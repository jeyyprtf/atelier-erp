import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
)

// status options shared across the app
export const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'approval_pending', label: 'Approval Pending' },
  { key: 'done', label: 'Done' },
]

// baseline progress per status (overridable by tasks.progress)
const BASELINE = { todo: 0, in_progress: 33, approval_pending: 66, done: 100 }
export const effectiveProgress = (t) =>
  t.progress ?? BASELINE[t.status] ?? 0

export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) =>
  d ? new Date(d).toLocaleDateString(undefined, opts) : ''
