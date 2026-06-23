import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useTheme } from '../lib/theme'
import { useT } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { Avatar, Button, Card, Field, Input, Spinner } from '../components/ui'
import AvatarCropModal from '../components/AvatarCropModal'

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

  // avatar
  const [cropFile, setCropFile] = useState(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarMsg, setAvatarMsg] = useState('')
  const fileRef = useRef(null)

  function pickFile() { fileRef.current?.click() }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 1048576) { setAvatarMsg('Max 1 MB'); return }
    setAvatarMsg('')
    const img = new Image()
    img.onload = () => {
      const ratio = img.width / img.height
      if (Math.abs(ratio - 1) < 0.02) {
        // nearly square — upload directly
        uploadDirect(f)
      } else {
        setCropFile(f)
        setCropOpen(true)
      }
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(f)
    e.target.value = ''
  }

  async function uploadDirect(f) {
    setAvatarBusy(true)
    setAvatarMsg('')
    const ext = f.name.split('.').pop() || 'webp'
    const path = `${user.id}/avatar.${ext}`
    // pony: delete old first so new URL busts cache
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.webp`, `${user.id}/avatar.png`, `${user.id}/avatar.jpg`])
    const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: true })
    setAvatarBusy(false)
    if (error) { setAvatarMsg(error.message); return }
    const { data: url } = supabase.storage.from('avatars').getPublicUrl(path)
    await Promise.all([
      supabase.from('profiles').update({ avatar_url: url.publicUrl }).eq('id', user.id),
      supabase.auth.updateUser({ data: { avatar_url: url.publicUrl } }),
    ])
    setAvatarMsg(t('profile.saved'))
    refreshProfile()
  }

  async function onCropSaved(blob) {
    setAvatarBusy(true)
    setAvatarMsg('')
    const path = `${user.id}/avatar.webp`
    await supabase.storage.from('avatars').remove([path])
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/webp' })
    setAvatarBusy(false)
    if (error) { setAvatarMsg(error.message); return }
    const { data: url } = supabase.storage.from('avatars').getPublicUrl(path)
    await Promise.all([
      supabase.from('profiles').update({ avatar_url: url.publicUrl }).eq('id', user.id),
      supabase.auth.updateUser({ data: { avatar_url: url.publicUrl } }),
    ])
    setAvatarMsg(t('profile.saved'))
    refreshProfile()
  }

  async function removeAvatar() {
    setAvatarBusy(true)
    setAvatarMsg('')
    await supabase.storage.from('avatars').remove([`${user.id}/avatar.webp`])
    await Promise.all([
      supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id),
      supabase.auth.updateUser({ data: { avatar_url: null } }),
    ])
    setAvatarBusy(false)
    refreshProfile()
  }

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
          <button onClick={pickFile} className="group relative shrink-0" disabled={avatarBusy} title="Change photo">
            {avatarBusy ? <div className="grid h-14 w-14 place-items-center"><Spinner /></div> : <Avatar name={profile?.full_name} url={profile?.avatar_url} size={56} />}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/0 transition-colors group-hover:bg-ink/30">
              <svg className="opacity-0 transition-opacity group-hover:opacity-100" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
            </div>
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-xl tracking-tight">{profile?.full_name || '—'}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
            {profile?.avatar_url && (
              <button onClick={removeAvatar} className="mt-0.5 text-xs text-muted hover:text-clay">Remove photo</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/webp,image/jpeg,image/png" className="hidden" onChange={onFile} />
          <span className="ml-auto shrink-0 rounded-full bg-canvas px-3 py-1 text-xs font-medium text-muted">{t(ROLE_KEYS[role])}</span>
        </Card>
        {avatarMsg && <p className="-mt-3 text-xs text-muted">{avatarMsg}</p>}

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

      <AvatarCropModal open={cropOpen} file={cropFile} onClose={() => setCropOpen(false)} onSaved={onCropSaved} />
    </div>
  )
}
