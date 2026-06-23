import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'
import { useAuth } from '../auth/AuthProvider'

const NotifCtx = createContext(null)
export const useNotifications = () => useContext(NotifCtx)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const loadRef = useRef(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    const { data } = await supabase.from('notifications').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(30)
    if (data) { setItems(data); setUnread(data.filter((n) => !n.read).length) }
  }, [user?.id])

  useEffect(() => { loadRef.current = load }, [load])
  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user?.id) return
    const ch = supabase.channel('notif-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${user.id}` }, () => loadRef.current?.())
      .subscribe()
    return () => { supabase.removeChannel(ch).catch(() => {}) }
  }, [user?.id])

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
  }

  const markAll = async () => {
    await supabase.from('notifications').update({ read: true }).eq('profile_id', user.id).eq('read', false)
    setItems((xs) => xs.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  return <NotifCtx.Provider value={{ items, unread, markRead, markAll }}>{children}</NotifCtx.Provider>
}

export function NotifBell() {
  const nav = useNavigate()
  const { items, unread, markRead, markAll } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative grid h-8 w-8 place-items-center rounded-lg hover:bg-canvas">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-clay px-1 text-[10px] font-medium text-bone">{unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-hairline bg-bone shadow-xl"
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.15 }}>
              <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                <span className="text-sm font-medium">Notifications</span>
                {unread > 0 && <button onClick={markAll} className="text-xs text-muted hover:text-ink">Mark all read</button>}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted">No notifications yet</p>
                ) : items.map((n) => (
                  <button key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) nav(n.link) }}
                    className={`flex w-full gap-3 border-b border-hairline/50 px-4 py-3 text-left text-sm transition-colors hover:bg-canvas ${n.read ? 'opacity-60' : ''}`}>
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-clay'}`} />
                    <span className={n.read ? '' : 'font-medium'}>{n.body}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
