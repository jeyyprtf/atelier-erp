import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth/AuthProvider'
import { useT } from '../lib/i18n'
import { useShortcuts } from '../lib/useShortcuts'
import { NotifBell } from '../lib/notifications'
import { Avatar, ThemeToggle } from './ui'

const NAV = [
  { to: '/', labelKey: 'nav.dashboard', end: true },
  { to: '/tasks', labelKey: 'nav.myTasks' },
  { to: '/team', labelKey: 'nav.teamProgress' },
  { to: '/assign', labelKey: 'nav.assignment', roles: ['lead', 'c_level'] },
  { to: '/meetings', labelKey: 'nav.meetingNotes' },
  { to: '/resources', labelKey: 'nav.resources' },
  { to: '/members', labelKey: 'nav.members', roles: ['c_level'] },
]
const ROLE_LABEL = { c_level: 'C-Level', lead: 'Lead', member: 'Member' }

function NavItems({ items, t, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1">
      {items.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-canvas text-ink' : 'text-muted hover:text-ink'}`}>
          {({ isActive }) => (
            <>
              <span className={`h-1.5 w-1.5 rounded-full transition-colors ${isActive ? 'bg-clay' : 'bg-transparent'}`} />
              <span>{t(n.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { profile, role, signOut } = useAuth()
  const t = useT().t
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const items = NAV.filter((n) => !n.roles || n.roles.includes(role))

  useEffect(() => { setOpen(false) }, [loc.pathname])

  // register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // keyboard shortcuts
  useShortcuts({
    'd': () => nav('/'),
    't': () => nav('/tasks'),
    'e': () => nav('/team'),
    'a': () => nav('/assign'),
    'm': () => nav('/meetings'),
    'r': () => nav('/resources'),
    'p': () => nav('/profile'),
  })

  async function out() {
    await signOut()
    nav('/login', { replace: true })
  }

  const sideBottom = (
    <div className="border-t border-hairline pt-4">
      <button onClick={() => nav('/profile')} className="flex w-full items-center gap-3 rounded-xl p-1 text-left transition-colors hover:bg-canvas">
        <Avatar name={profile?.full_name} url={profile?.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{profile?.full_name || '—'}</p>
          <p className="text-xs text-muted">{t(`role.${role}`)}</p>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between px-1">
        <ThemeToggle />
        <button onClick={out} className="text-xs text-muted transition-colors hover:text-clay">{t('sign.out')}</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bone">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-hairline bg-bone px-5 py-7 lg:flex">
        <div className="px-2 font-display text-2xl tracking-tight">{t('app.name')}</div>
        <div className="mt-10 flex flex-1 flex-col">
          <NavItems items={items} t={t} />
          {sideBottom}
          {/* kb hint */}
          <p className="mt-2 text-center text-[10px] text-muted/50">⌨ D T E A M R P</p>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-hairline bg-bone/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-canvas">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 5h14M2 9h14M2 13h14" /></svg>
        </button>
        <span className="font-display text-xl tracking-tight">{t('app.name')}</span>
        <div className="flex items-center gap-2">
          <NotifBell />
          <button onClick={() => nav('/profile')} aria-label={t('nav.profile')}>
            <Avatar name={profile?.full_name} url={profile?.avatar_url} size={30} />
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-hairline bg-bone px-5 py-7 lg:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}>
              <div className="flex items-center justify-between">
                <span className="px-2 font-display text-2xl tracking-tight">{t('app.name')}</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l10 10M13 3L3 13" /></svg>
                </button>
              </div>
              <div className="mt-5 flex items-center justify-end"><NotifBell /></div>
              <div className="mt-4 flex flex-1 flex-col">
                <NavItems items={items} t={t} onNavigate={() => setOpen(false)} />
                {sideBottom}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="px-4 pb-16 pt-20 lg:ml-60 lg:px-10 lg:py-9">
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
