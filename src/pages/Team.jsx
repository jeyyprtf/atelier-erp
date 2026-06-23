import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useTasks } from '../lib/useTasks'
import { useProfiles } from '../lib/useProfiles'
import { effectiveProgress } from '../lib/supabase'
import { useT } from '../lib/i18n'
import Board from '../components/Board'
import TaskModal from '../components/TaskModal'
import { Spinner, EmptyState, ProgressBar, Avatar, Select } from '../components/ui'

export default function Team() {
  const { user, role } = useAuth()
  const { tasks, loading, reload } = useTasks()
  const { profiles } = useProfiles()
  const t = useT().t
  const [member, setMember] = useState('all')
  const [active, setActive] = useState(null)
  const [open, setOpen] = useState(false)

  const onMember = (task, id) => task.pic_id === id || (task.assignees || []).some((a) => a.profile?.id === id)
  const filtered = useMemo(
    () => (member === 'all' ? tasks : tasks.filter((x) => onMember(x, member))),
    [tasks, member],
  )

  const rollup = useMemo(
    () => profiles.map((p) => {
      const ts = tasks.filter((x) => onMember(x, p.id))
      const avg = ts.length ? Math.round(ts.reduce((s, x) => s + effectiveProgress(x), 0) / ts.length) : 0
      return { ...p, count: ts.length, avg }
    }),
    [profiles, tasks],
  )

  function openTask(task) { setActive(task); setOpen(true) }
  const canEditAll = role === 'c_level' || (role === 'lead' && active?.created_by === user?.id)

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('team.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('team.subtitle')}</p>
        </div>
        <div className="w-full sm:w-56">
          <Select value={member} onChange={(e) => setMember(e.target.value)}>
            <option value="all">{t('team.allMembers')}</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </Select>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rollup.map((p) => (
          <div key={p.id} className="rounded-2xl border border-hairline bg-bone p-4">
            <div className="flex items-center gap-3">
              <Avatar name={p.full_name} size={34} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.full_name}</p>
                <p className="text-xs text-muted">{p.count} {p.count !== 1 ? t('team.tasks') : t('team.task')}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <ProgressBar value={p.avg} />
              <span className="w-9 text-right text-xs text-muted">{p.avg}%</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('team.empty')} hint={t('team.emptyHint')} />
      ) : (
        <Board tasks={filtered} onOpen={openTask} />
      )}
      <TaskModal open={open} task={active} profiles={profiles} canEditAll={canEditAll} onClose={() => setOpen(false)} onSaved={reload} />
    </div>
  )
}
