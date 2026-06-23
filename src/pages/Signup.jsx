import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useT } from '../lib/i18n'
import { AuthShell, Button, Field, Input, Spinner, GoogleButton, OrDivider } from '../components/ui'

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth()
  const t = useT().t
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const { data, error } = await signUp(email.trim(), pw, name.trim())
    setBusy(false)
    if (error) return setErr(error.message)
    if (data.session) return nav('/', { replace: true })
    setSent(true)
  }

  async function google() {
    setErr('')
    const { error } = await signInWithGoogle()
    if (error) setErr(error.message)
  }

  if (sent) {
    return (
      <AuthShell title={t('auth.checkEmail')} subtitle={t('auth.checkEmailSub')}>
        <p className="text-sm leading-relaxed text-muted">
          {t('auth.verificationSent', { email })}
        </p>
        <Button className="mt-6 w-full" onClick={() => nav('/login')}>{t('auth.backToSignIn')}</Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t('auth.createAccount')} subtitle={t('auth.joinSub')}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.fullName')}>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </Field>
        <Field label={t('auth.email')}>
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@team.com" />
        </Field>
        <Field label={t('auth.password')} hint={t('auth.passwordHint')}>
          <Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
        </Field>
        {err && <p className="text-sm text-clay">{err}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? <Spinner /> : t('auth.signUp')}</Button>
      </form>
      <OrDivider />
      <GoogleButton onClick={google} />
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-ink underline-offset-4 hover:underline">{t('auth.signInLink')}</Link>
      </p>
    </AuthShell>
  )
}
