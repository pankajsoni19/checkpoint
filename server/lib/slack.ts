import { query, queryOne } from '../db/pool'
import { asJson } from './serialize'

// Slack notification settings, persisted per-org inside app_settings.slack
// (see server/modules/settings.ts). Mirrors the client's AppSettings['slack'].
interface SlackSettings {
  enabled: boolean
  notification_token: string
  channel_id: string
  notify_on_submit: boolean
  notify_on_approve: boolean
  notify_on_apply: boolean
  notify_on_reviewer: boolean
}

const DEFAULTS: SlackSettings = {
  enabled: false,
  notification_token: '',
  channel_id: '',
  notify_on_submit: true,
  notify_on_approve: false,
  notify_on_apply: true,
  notify_on_reviewer: false,
}

type MigrationEvent = 'submit' | 'approve' | 'apply' | 'reviewer'

const TOGGLE: Record<MigrationEvent, keyof SlackSettings> = {
  submit: 'notify_on_submit',
  approve: 'notify_on_approve',
  apply: 'notify_on_apply',
  reviewer: 'notify_on_reviewer',
}

async function loadSlack(orgId: string): Promise<SlackSettings | null> {
  const row = await queryOne<{ slack: unknown }>('SELECT slack FROM app_settings WHERE org_id = :org', { org: orgId })
  if (!row) return null
  return asJson<SlackSettings>(row.slack, DEFAULTS)
}

// Post a message to the org's configured Slack channel via chat.postMessage.
// Notifications are best-effort: any failure is logged and swallowed so it never
// breaks the migration request that triggered it.
async function postMessage(slack: SlackSettings, text: string): Promise<void> {
  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${slack.notification_token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel: slack.channel_id, text }),
      signal: AbortSignal.timeout(8000),
    })
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!data.ok) {
      console.error(`[slack] chat.postMessage failed: ${data.error ?? `HTTP ${res.status}`}`)
    }
  } catch (err) {
    console.error(`[slack] notification failed: ${(err as Error).message}`)
  }
}

const LABEL: Record<MigrationEvent, string> = {
  submit: ':large_yellow_circle: *Migration submitted for approval*',
  approve: ':white_check_mark: *Migration approved*',
  apply: ':rocket: *Migration applied*',
  reviewer: ':eyes: *Reviewer added to migration*',
}

const VERB: Record<MigrationEvent, string> = {
  submit: 'Submitted',
  approve: 'Approved',
  apply: 'Applied',
  reviewer: 'Updated',
}

interface MigrationInfo {
  title: string
  description: string | null
  db_name: string
  project_name: string
  env_name: string | null
  // Configured approvers for the migration's project (who is allowed to approve).
  approvers: string[]
}

async function loadMigrationInfo(migrationId: string): Promise<MigrationInfo | undefined> {
  const row = await queryOne<{
    title: string
    description: string | null
    db_name: string
    project_name: string
    env_name: string | null
    approvers: unknown
  }>(
    `SELECT m.title, m.description, d.name AS db_name, p.name AS project_name, e.name AS env_name,
            ps.approvers AS approvers
       FROM migrations m
       JOIN \`databases\` d ON d.id = m.database_id
       JOIN projects p ON p.id = d.project_id
       LEFT JOIN environments e ON e.id = d.environment_id
       LEFT JOIN project_settings ps ON ps.project_id = p.id
      WHERE m.id = :id`,
    { id: migrationId },
  )
  if (!row) return undefined
  return { ...row, approvers: asJson<string[]>(row.approvers, []) }
}

// Notify the org's Slack channel about a migration lifecycle event, honoring the
// per-event toggle. No-op when Slack is disabled/unconfigured or the toggle is off.
export async function notifyMigration(
  orgId: string,
  event: MigrationEvent,
  migrationId: string,
  actor: string,
  baseUrl: string,
): Promise<void> {
  const slack = await loadSlack(orgId)
  if (!slack || !slack.enabled || !slack.notification_token || !slack.channel_id) return
  if (!slack[TOGGLE[event]]) return

  const m = await loadMigrationInfo(migrationId)
  if (!m) return

  const reviewers = (await query<{ email: string }>(
    'SELECT reviewer_email AS email FROM migration_reviewers WHERE migration_id = :id',
    { id: migrationId },
  )).map((r) => r.email)

  const verb = VERB[event]
  const lines = [
    LABEL[event],
    `*Project:* ${m.project_name}`,
    `*Environment:* ${m.env_name ?? '—'}`,
    `*Title:* ${m.title}`,
  ]
  if (m.description?.trim()) lines.push(`*Description:* ${m.description.trim()}`)
  lines.push(`*Db:* ${m.db_name}`)
  if (m.approvers.length) lines.push(`*Approvers:* ${m.approvers.join(', ')}`)
  if (reviewers.length) lines.push(`*Reviewers:* ${reviewers.join(', ')}`)
  lines.push(`${verb} by ${actor}`)
  lines.push(`<${baseUrl}/migrations/${migrationId}|View migration>`)
  await postMessage(slack, lines.join('\n'))
}
