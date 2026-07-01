import { execScript, execute, query, queryOne } from "./pool";
import { env, ORG_LOCKED } from "../env";
import { newId } from "../lib/ids";
import { BASELINE_VERSION, MIGRATIONS } from "./migrations";

const LOCKED_ORG_ID = "org_primary";

// Key/value store recording what schema has been applied, so boots skip the full
// CREATE/ALTER pass instead of re-checking every table against the DB spec. Created
// before the version check itself, so it can't live in the baseline dump alone.
const SERVER_CONFIG_DDL = `CREATE TABLE IF NOT EXISTS server_config (
     \`key\`     VARCHAR(64) PRIMARY KEY,
     value      TEXT NOT NULL,
     updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Load the whole server_config table in one round trip.
async function readConfig(): Promise<Map<string, string>> {
  const rows = await query<{ key: string; value: string }>(
    "SELECT `key`, value FROM server_config",
  );
  return new Map(rows.map((r) => [r.key, r.value]));
}

async function setConfig(key: string, value: string): Promise<void> {
  await execute(
    "INSERT INTO server_config (`key`, value) VALUES (:key, :value) ON DUPLICATE KEY UPDATE value = VALUES(value)",
    { key, value },
  );
}

// A DB is "fresh" when it has none of our tables yet. We probe a core table rather
// than server_config, which we always create above.
async function isFreshDatabase(): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'users'`,
  );
  return !row || row.n === 0;
}

async function readBaselineSchema(): Promise<string> {
  const path = `${import.meta.dir}/../../docs/schema.sql`;
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(
      `Baseline schema not found at ${path} — cannot bootstrap a fresh database.`,
    );
  }
  return file.text();
}

// Append a {version, name, at} entry to the JSON migration log in server_config,
// alongside the plain current-version pointer.
async function recordApplied(
  config: Map<string, string>,
  version: number,
  name: string,
): Promise<void> {
  let history: { version: number; name: string; at: string }[] = [];
  try {
    history = JSON.parse(config.get("schema_history") ?? "[]");
  } catch {
    history = [];
  }
  history.push({ version, name, at: new Date().toISOString() });
  config.set("schema_history", JSON.stringify(history));
  config.set("schema_version", String(version));

  await setConfig("schema_version", String(version));
  await setConfig("schema_history", JSON.stringify(history));
}

// Bring the DB up to date, then ensure the locked org exists when configured.
export async function initDb(): Promise<void> {
  // server_config may not exist on an older DB, so create it before reading version.
  await execute(SERVER_CONFIG_DDL);
  const config = await readConfig();
  let version = Number(config.get("schema_version") ?? 0);

  // First boot against this DB: establish the baseline. A brand-new DB gets the full
  // schema from docs/schema.sql; an existing DB (already has the tables) is simply
  // stamped at BASELINE_VERSION so future migrations layer on top of it.
  if (version === 0) {
    if (await isFreshDatabase()) {
      await execScript(await readBaselineSchema());
      console.log("Applied baseline schema from docs/schema.sql.");
    } else {
      console.log("Existing database detected — adopting baseline version.");
    }
    await recordApplied(config, BASELINE_VERSION, "baseline");
    version = BASELINE_VERSION;
  }

  // Apply every migration newer than the recorded version, in ascending order.
  const pending = MIGRATIONS.filter((m) => m.version > version).sort(
    (a, b) => a.version - b.version,
  );
  for (const m of pending) {
    await execScript(m.statements.join(";\n"));
    await recordApplied(config, m.version, m.name);
    version = m.version;
    console.log(`Applied migration v${m.version} — ${m.name}.`);
  }
  if (pending.length === 0)
    console.log(`Database schema up to date (v${version}).`);

  // Ensure the locked org exists. Recorded in config once created, so this only
  // hits the DB on the first boot after it's configured.
  if (ORG_LOCKED && config.get("locked_org") !== LOCKED_ORG_ID) {
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM organizations WHERE id = :id",
      { id: LOCKED_ORG_ID },
    );
    if (!existing) {
      await execute(
        "INSERT INTO organizations (id, name, slug) VALUES (:id, :name, :slug)",
        {
          id: LOCKED_ORG_ID,
          name: env.lockedOrg,
          slug: slugify(env.lockedOrg) || "org",
        },
      );
    }
    await setConfig("locked_org", LOCKED_ORG_ID);
  }
}

export { LOCKED_ORG_ID, slugify, newId };
