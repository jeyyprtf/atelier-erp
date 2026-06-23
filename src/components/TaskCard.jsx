import { ProgressBar, Avatar, StatusBadge } from './ui'
import { STATUSES, effectiveProgress, fmtDate } from '../lib/supabase'

const LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]))

export default function TaskCard({ task, showStatus }) {
  const pct = effectiveProgress(task)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const overdue = task.deadline && task.status !== 'done' && new Date(task.deadline) < today
  const assignees = task.assignees || []

  return (
    <div className="cursor-pointer rounded-xl border border-hairline bg-bone p-3.5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{task.title}</p>
        {showStatus && <StatusBadge status={task.status} label={LABEL[task.status]} />}
      </div>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>}
      <div className="mt-3 flex items-center gap-2">
        <ProgressBar value={pct} />
        <span className="w-9 shrink-0 text-right text-xs text-muted">{pct}%</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {assignees.slice(0, 4).map((a, i) => <Avatar key={i} name={a.profile?.full_name} size={22} />)}
          {assignees.length === 0 && <span className="text-xs text-muted">Unassigned</span>}
        </div>
        {task.deadline && (
          <span className={`text-xs ${overdue ? 'font-medium text-clay' : 'text-muted'}`}>{fmtDate(task.deadline)}</span>
        )}
      </div>
    </div>
  )
}
