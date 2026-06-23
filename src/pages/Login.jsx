import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useT } from '../lib/i18n'
import { AuthShell, Button, Field, Input, Spinner, GoogleButton, OrDivider } from '../components/ui'

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const t = useT().t
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const { error } = await signIn(email.trim(), pw)
    setBusy(false)
    if (error) return setErr(error.message)
    nav(loc.state?.from?.pathname || '/', { replace: true })
  }

  async function google() {
    setErr('')
    const { error } = await signInWithGoogle()
    if (error) setErr(error.message)
  }

  return (
    <AuthShell title={t('auth.welcome')} subtitle={t('auth.signInSub')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.email')}>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" />
        </Field>
        <Field label={t('auth.password')}>
          <Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        </Field>
        {err && <p className="text-sm text-clay">{err}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? <Spinner /> : t('auth.signIn')}</Button>
      </form>
      <OrDivider />
      <GoogleButton onClick={google} />
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="text-ink underline-offset-4 hover:underline">{t('auth.createOne')}</Link>
      </p>
    </AuthShell>
  )
}
