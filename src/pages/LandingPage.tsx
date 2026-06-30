import { Link } from 'react-router-dom'
import { FaArrowRight, FaLock } from 'react-icons/fa'

// Public entry page. Checkpoint is an internal tool — there is no public sign-up,
// so this is a single, simple screen that points authorized team members to login.
export function LandingPage() {
  return (
    <div
      className="flex min-h-screen flex-col text-slate-100"
      style={{
        background:
          'radial-gradient(circle at 12% -10%, rgba(37,99,235,0.25), transparent 45%), radial-gradient(circle at 90% 0%, rgba(79,70,229,0.22), transparent 45%), linear-gradient(180deg, #0a0a0f 0%, #0b1020 60%, #0a0a0f 100%)',
      }}
    >
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <img src="/checkpoint.svg" alt="Checkpoint" className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">Checkpoint</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-slate-300 transition hover:text-white">
          Log in
        </Link>
      </header>

      {/* Hero — single centered screen */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-300">
          <FaLock size={10} /> Internal tool
        </span>
        <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          The controlled path to our
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> databases</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-300 md:text-lg">
          Checkpoint is our team's internal platform for governing database access and change — reviewable
          migrations, read-only Query Studio, schema browsing, and a full audit trail.
        </p>
        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-400/40 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-medium text-white shadow-[0_8px_30px_rgba(37,99,235,0.4)] transition hover:from-blue-500 hover:to-indigo-500"
          >
            Log in <FaArrowRight size={12} />
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">For authorized team members · Google SSO or email</p>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-8 text-center text-xs text-slate-600">
        © 2026 Checkpoint · Internal use only
      </footer>
    </div>
  )
}
