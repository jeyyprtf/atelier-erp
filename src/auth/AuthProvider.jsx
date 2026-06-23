import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // track auth session
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setProfile(null); setLoading(false) }
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  // load the profile (name + role) for the signed-in user
  useEffect(() => {
    const uid = session?.user?.id
    if (!uid) return
    let active = true
    setLoading(true)
    supabase.from('profiles').select('*').eq('id', uid).single()
      .then(({ data }) => { if (active) { setProfile(data); setLoading(false) } })
    return () => { active = false }
  }, [session?.user?.id])

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password, full_name) =>
      supabase.auth.signUp({ email, password, options: { data: { full_name } } }),
    signInWithGoogle: () =>
      supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
    signOut: () => supabase.auth.signOut(),
    refreshProfile: async () => {
      const uid = session?.user?.id
      if (!uid) return
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
      setProfile(data)
    },
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
