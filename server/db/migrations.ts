// Forward-only, incremental schema migrations.
//
// The full baseline schema lives in docs/schema.sql and is applied once to a fresh
// database (recorded as BASELINE_VERSION in server_config). Every schema change
// *after* that baseline is a Migration appended to the list below: give it the next
// version number and the SQL to run.
//
// On boot, initDb() applies every migration whose version is greater than the one
// recorded in server_config, in ascending order, exactly once, then records the new
// version. So the DB is never re-checked statement-by-statement against a spec — it
// only runs what it hasn't run yet.
//
// Rules:
//   - Append only. Never edit or renumber a migration that may already have shipped.
//   - `version` must be ascending and contiguous, starting at BASELINE_VERSION + 1.
//   - Each `statements` entry is exactly one SQL statement; they run in array order.
//   - Prefer idempotent DDL (IF NOT EXISTS / IF EXISTS) where MySQL supports it.

// The version represented by docs/schema.sql. Bump only if you regenerate the
// baseline dump to fold in past migrations (a fresh install then starts higher).
export const BASELINE_VERSION = 1

export type Migration = {
  version: number
  name: string
  statements: string[]
}

export const MIGRATIONS: Migration[] = [
  // Example — copy this shape for the first real migration and delete the sample:
  // {
  //   version: 2,
  //   name: 'add_user_timezone',
  //   statements: ['ALTER TABLE `users` ADD COLUMN `timezone` VARCHAR(64) NULL'],
  // },
]
