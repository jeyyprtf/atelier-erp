import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../lib/theme'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { Avatar, Button, Card, Field, Input, Spinner } from '../components/ui'

const ROLE_KEYS = { c_level: 'role.c_level', lead: 'role.lead', member: 'role.member' }
const THEMES = [{ v: 'light', l: 'Light' }, { v: 'dark', l: 'Dark' }, { v: 'system', l: 'System' }]
const LANGS = [{ v: 'en', l: 'English' }, { v: 'id', l: 'Bahasa Indonesia' }]

export default function Profile() {
  const { user, profile, role, refreshProfile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useT()
  const nav = useNavigate()

  // name
  const [name, setName] = useState(profile?.full_name || '')
  const [nameBusy, setNameBusy] = useState(false)
  const [nameMsg, setNameMsg] = useState('')

  // password
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  async function saveName(e) {
    e.preventDefault()
    setNameBusy(true)
    setNameMsg('')
    const clean = name.trim()
    const { error } = await supabase.from('profiles').update({ full_name: clean }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { full_name: clean } })
    setNameBusy(false)
    if (error) setNameMsg(error.message)
    else { setNameMsg(t('profile.saved')); refreshProfile() }
  }

  async function savePw(e) {
    e.preventDefault()
    setPwMsg('')
    if (newPw.length < 6) return setPwMsg(t('profile.passwordMin'))
    // verify current password
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: curPw })
    if (authErr) { setPwMsg(t('profile.wrongPassword')); return }
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwBusy(false)
    if (error) setPwMsg(error.message)
    else { setPwMsg(t('profile.passwordUpdated')); setCurPw(''); setNewPw('') }
  }

  async function out() {
    await signOut()
    nav('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-7">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('profile.subtitle')}</p>
      </header>

      <div className="space-y-5">
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={profile?.full_name} url={profile?.avatar_url} size={56} />
          <div className="min-w-0">
            <p className="truncate font-display text-xl tracking-tight">{profile?.full_name || '—'}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">{t(ROLE_KEYS[role])}</span>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('profile.displayName')}</h2>
          <form onSubmit={saveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1"><Field label={t('profile.fullName')}><Input value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
            <Button type="submit" disabled={nameBusy}>{nameBusy ? <Spinner /> : t('profile.save')}</Button>
          </form>
          {nameMsg && <p className="mt-2 text-xs text-muted">{nameMsg}</p>}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('profile.appearance')}</h2>
          <div className="inline-flex rounded-full border border-hairline p-1">
            {THEMES.map((o) => (
              <button key={o.v} onClick={() => setTheme(o.v)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${theme === o.v ? 'bg-ink text-bone' : 'text-muted hover:text-ink'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('profile.language')}</h2>
          <div className="inline-flex rounded-full border border-hairline p-1">
            {LANGS.map((o) => (
              <button key={o.v} onClick={() => setLang(o.v)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${lang === o.v ? 'bg-ink text-bone' : 'text-muted hover:text-ink'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('profile.changePassword')}</h2>
          <form onSubmit={savePw} className="space-y-3">
            <Field label={t('profile.currentPassword')}><Input type="password" required value={curPw} onChange={(e) => setCurPw(e.target.value)} placeholder="••••••••" /></Field>
            <Field label={t('profile.newPassword')}><Input type="password" required minLength={6} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" /></Field>
            {pwMsg && <p className="text-xs text-muted">{pwMsg}</p>}
            <Button type="submit" disabled={pwBusy}>{pwBusy ? <Spinner /> : t('profile.updatePassword')}</Button>
          </form>
        </Card>

        <button onClick={out} className="text-sm text-muted transition-colors hover:text-clay">{t('sign.out')}</button>
      </div>
    </div>
  )
}
