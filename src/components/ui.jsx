import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../lib/theme'

export function Spinner({ className = '' }) {
  return <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-clay ${className}`} />
}

export function FullScreen({ children }) {
  return <div className="grid min-h-screen place-items-center bg-bone">{children}</div>
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'
  const variants = {
    primary: 'bg-ink text-bone hover:bg-clay',
    clay: 'bg-clay text-bone hover:opacity-90',
    ghost: 'border border-hairline bg-transparent text-ink hover:border-ink',
    subtle: 'bg-canvas text-ink hover:bg-hairline',
  }
  return <motion.button whileTap={{ scale: 0.97 }} className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export const inputCls = 'w-full rounded-xl border border-hairline bg-bone px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-ink disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted'
export const Input = (props) => <input className={inputCls} {...props} />
export const Textarea = (props) => <textarea className={`${inputCls} resize-none`} {...props} />
export const Select = ({ children, ...props }) => <select className={inputCls} {...props}>{children}</select>

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Card({ className = '', children, ...props }) {
  return <div className={`rounded-2xl border border-hairline bg-bone ${className}`} {...props}>{children}</div>
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-hairline bg-bone p-6 shadow-xl"
            initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}>
            {title && <h2 className="mb-5 font-display text-2xl tracking-tight">{title}</h2>}
            {children}
            {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
      <motion.div className="h-full rounded-full bg-clay"
        initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
    </div>
  )
}

const STATUS_STYLE = {
  todo: 'bg-canvas text-muted',
  in_progress: 'bg-clay-soft text-clay',
  approval_pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
}
export function StatusBadge({ status, label }) {
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status] || ''}`}>{label}</span>
}

export function Avatar({ name, url, size = 36 }) {
  if (url) {
    return <img src={url} alt={name || ''} referrerPolicy="no-referrer"
      className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  }
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-ink font-medium text-bone"
      style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</span>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-hairline py-16 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-canvas lg:block">
        <motion.div className="absolute inset-0 grid place-items-center"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: 'easeOut' }}>
          <div className="h-64 w-64 rounded-sm border border-hairline bg-bone shadow-sm" />
        </motion.div>
        <div className="absolute left-10 top-10 font-display text-2xl tracking-tight">Atelier</div>
        <p className="absolute bottom-10 left-10 max-w-xs text-sm leading-relaxed text-muted">
          A calm, gallery-quiet workspace for your team's tasks, progress, and notes.
        </p>
      </div>
      <div className="grid place-items-center bg-bone px-6 py-12">
        <motion.div className="w-full max-w-sm"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-4xl tracking-tight">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  )
}
export function ThemeToggle({ className = '' }) {
  const { resolved, setTheme } = useTheme()
  const dark = resolved === 'dark'
  return (
    <button type="button" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label="Toggle theme"
      className={`inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink ${className}`}>
      {dark ? <MoonIcon /> : <SunIcon />}
      <span>{dark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  )
}
export function GoogleButton({ onClick, label = 'Continue with Google' }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-hairline bg-bone px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink">
      <GoogleIcon /> {label}
    </button>
  )
}
export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
      <span className="h-px flex-1 bg-hairline" />or<span className="h-px flex-1 bg-hairline" />
    </div>
  )
}
