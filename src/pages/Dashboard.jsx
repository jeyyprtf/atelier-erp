import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useTasks } from '../lib/useTasks'
import { useProfiles } from '../lib/useProfiles'
import { useNotifications } from '../lib/notifications'
import { effectiveProgress, fmtDate, STATUSES } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { Card, ProgressBar, StatusBadge, Avatar, Button } from '../components/ui'

const LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]))

export default function Dashboard() {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const { profiles } = useProfiles()
  const { unread } = useNotifications()
  const t = useT().t
  const nav = useNavigate()

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)

  const mine = useMemo(() => tasks.filter((x) => x.pic_id === user?.id || (x.assignees || []).some((a) => a.profile?.id === user?.id)), [tasks, user?.id])
  const dueSoon = useMemo(() => mine.filter((t) => t.deadline && new Date(t.deadline) >= today && new Date(t.deadline) <= weekEnd && t.status !== 'done'), [mine, today, weekEnd])
  const recent = useMemo(() => tasks.filter((t) => t.updated_at && new Date(t.updated_at) >= new Date(Date.now() - 86400000 * 3)), [tasks])
  const byStatus = useMemo(() => {
    const m = {}; STATUSES.forEach((s) => { m[s.key] = mine.filter((t) => t.status === s.key) }); return m
  }, [mine])

  const rollup = useMemo(
    () => profiles.map((p) => {
      const ts = tasks.filter((t) => t.pic_id === p.id || (t.assignees || []).some((a) => a.profile?.id === p.id))
      const avg = ts.length ? Math.round(ts.reduce((s, t) => s + effectiveProgress(t), 0) / ts.length) : 0
      return { ...p, count: ts.length, avg }
    }).filter((p) => p.count > 0).sort((a, b) => b.avg - a.avg),
    [profiles, tasks],
  )

  return (
    <div>
      {/* welcome + quick actions */}
      <header className="mb-7">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('dashboard.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('dashboard.subtitle')}</p>
      </header>

      {/* quick action buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Button onClick={() => nav('/tasks')}>{t('nav.myTasks')}</Button>
        <Button variant="ghost" onClick={() => nav('/assign')}>{t('nav.assignment')}</Button>
        <Button variant="ghost" onClick={() => nav('/meetings')}>{t('nav.meetingNotes')}</Button>
        {unread > 0 && <Button variant="clay" onClick={() => nav('/team')}>{t('notif.unread', { n: unread })}</Button>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* my kanban summary */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('dashboard.myboard')}</h2>
          <div className="grid grid-cols-4 gap-2">
            {STATUSES.map((s) => (
              <button key={s.key} onClick={() => nav('/tasks')} className="rounded-xl border border-hairline p-3 text-center transition-colors hover:bg-canvas">
                <p className="font-display text-2xl tracking-tight">{byStatus[s.key]?.length || 0}</p>
                <p className="mt-1 text-[11px] text-muted">{s.label}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* team progress snapshot */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('dashboard.team')}</h2>
          <div className="space-y-3">
            {rollup.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar name={p.full_name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm">{p.full_name}</p>
                    <span className="text-xs text-muted">{p.avg}%</span>
                  </div>
                  <ProgressBar value={p.avg} />
                </div>
              </div>
            ))}
            {rollup.length === 0 && <p className="text-sm text-muted">{t('dashboard.empty')}</p>}
          </div>
        </Card>

        {/* due this week */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('dashboard.due')}</h2>
          {dueSoon.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboard.dueEmpty')}</p>
          ) : (
            <div className="space-y-2">
              {dueSoon.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-canvas">
                  <StatusBadge status={t.status} label={LABEL[t.status]} />
                  <p className="min-w-0 flex-1 truncate text-sm">{t.title}</p>
                  <span className="shrink-0 text-xs text-clay">{fmtDate(t.deadline)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* recent activity */}
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted">{t('dashboard.recent')}</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboard.recentEmpty')}</p>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 text-sm">
                  <StatusBadge status={t.status} label={LABEL[t.status]} />
                  <p className="min-w-0 flex-1 truncate">{t.title}</p>
                  {t.pic && <Avatar name={t.pic.full_name} size={22} />}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
