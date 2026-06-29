import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notify } from '../lib/toast'
import { PASSWORD_AUTH_ENABLED } from '../lib/config'
import { AuthShell, authInputClass, primaryBtnClass } from '../components/AuthShell'

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  if (!PASSWORD_AUTH_ENABLED || !token) {
    return (
      <AuthShell eyebrow="Reset password" title="Link not valid" subtitle="This password reset link is missing or has expired.">
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      notify.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      notify.error('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await resetPassword(token, password)
      notify.success('Password updated. You are signed in.')
      navigate('/')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Could not reset password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell eyebrow="Reset password" title="Choose a new password" subtitle="Enter a new password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">New password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={authInputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Confirm password</span>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className={authInputClass}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryBtnClass}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
