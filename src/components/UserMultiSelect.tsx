import { FaTimes } from 'react-icons/fa'
import type { ManagedUser } from '../types'
import { Dropdown } from './Dropdown'

// Sentinel value meaning "everyone" — supersedes any individual selection.
// The server treats the same value in a releasers list as "any org member".
export const ALL_USERS = '*'

// Pick multiple users by email — selected ones show as removable chips, with a
// dropdown to add the rest. Used for project approvers/releasers and elsewhere.
// Pass `allLabel` to offer an "All Users" special option (stored as ALL_USERS),
// which, once chosen, replaces every individual pick.
export function UserMultiSelect({
  users,
  selected,
  onChange,
  editable = true,
  placeholder = 'Add user…',
  allLabel,
}: {
  users: ManagedUser[]
  selected: string[]
  onChange: (emails: string[]) => void
  editable?: boolean
  placeholder?: string
  allLabel?: string
}) {
  const nameFor = (email: string) => (email === ALL_USERS ? (allLabel ?? 'All Users') : users.find((u) => u.email === email)?.name ?? email)
  const allSelected = selected.includes(ALL_USERS)

  return (
    <div className="space-y-2">
      {selected.length === 0 ? (
        <p className="text-sm text-slate-500">None selected.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/60 py-0.5 pl-2.5 pr-1 text-xs text-slate-700 dark:text-slate-200"
            >
              {nameFor(email)}
              {editable ? (
                <button
                  onClick={() => onChange(selected.filter((e) => e !== email))}
                  className="cursor-pointer rounded-full p-0.5 text-slate-400 hover:text-rose-500"
                  aria-label={`Remove ${nameFor(email)}`}
                >
                  <FaTimes size={9} />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      )}

      {/* Once "All Users" is chosen it covers everyone, so hide the picker. */}
      {editable && !allSelected ? (
        <Dropdown
          value=""
          placeholder={placeholder}
          onChange={(email) => onChange(email === ALL_USERS ? [ALL_USERS] : [...selected, email])}
          menuMinWidth={260}
          options={[
            ...(allLabel ? [{ value: ALL_USERS, label: allLabel }] : []),
            ...users
              .filter((u) => !selected.includes(u.email))
              .map((u) => ({ value: u.email, label: u.name ?? u.email, hint: u.email })),
          ]}
        />
      ) : null}
    </div>
  )
}
