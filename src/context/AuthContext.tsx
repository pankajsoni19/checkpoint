import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../services/api'
import type { SessionUser } from '../types'

interface AuthValue {
  user: SessionUser | null
  loading: boolean
  signIn: (googleCredential: string) => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const session = await api.getSession()
      setUser(session.user)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (googleCredential: string) => {
    // The client gets a Google ID token from Google Identity Services and
    // posts it; the server verifies it and establishes the session cookie.
    const session = await api.googleSignIn(googleCredential)
    setUser(session.user)
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const session = await api.passwordSignIn(email, password)
    setUser(session.user)
  }, [])

  const signUp = useCallback(async (input: { name: string; email: string; password: string }) => {
    const session = await api.signup(input)
    setUser(session.user)
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    const session = await api.resetPassword(token, password)
    setUser(session.user)
  }, [])

  const signOut = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithPassword, signUp, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
