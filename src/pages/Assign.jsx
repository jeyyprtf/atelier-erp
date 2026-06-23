import { useState, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useTasks } from '../lib/useTasks'
import { useProfiles } from '../lib/useProfiles'
import { supabase, STATUSES, fmtDate, effectiveProgress } from '../lib/supabase'
import { useT } from '../lib/i18n'
import TaskModal from '../components/TaskModal'
import { Button, Spinner, EmptyState, StatusBadge, Avatar } from '../components/ui'

const LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]))

function exportCSV(tasks, t) {
  const header = ['Title', 'Status', 'PIC', 'Assignees', 'Deadline', 'Progress']
  const rows = tasks.map((task) => [
    task.title,
    LABEL[task.status] || task.status,
    task.pic?.full_name || '',
    (task.assignees || []).map((a) => a.profile?.full_name).join(', '),
    task.deadline || '',
    effectiveProgress(task) + '%',
  ])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'tasks.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function Assign() {
  const { user, role } = useAuth()
  const { tasks, loading, reload } = useTasks()
  const { profiles } = useProfiles()
  const t = useT().t
  const [active, setActive] = useState(null)
  const [open, setOpen] = useState(false)

  const canEditAll = (task) => role === 'c_level' || (role === 'lead' && task?.created_by === user?.id)
  function create() { setActive(null); setOpen(true) }
  function edit(task) { setActive(task); setOpen(true) }
  async function del(task) {
    if (!confirm(`Delete "${task.title}"?`)) return
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) alert(error.message)
    else reload()
  }

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('assign.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('assign.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={create}>{t('assign.newTask')}</Button>
          {tasks.length > 0 && <Button variant="ghost" onClick={() => exportCSV(tasks, t)}>Export CSV</Button>}
        </div>
      </header>

      {loading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : tasks.length === 0 ? (
        <EmptyState title={t('assign.empty')} hint={t('assign.emptyHint')} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline">
          {/* desktop table */}
          <table className="hidden w-full text-sm md:table">
            <thead className="border-b border-hairline bg-canvas/40 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">PIC</th>
                <th className="px-4 py-3">Assignees</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-hairline last:border-0 hover:bg-canvas/30">
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3 text-muted">{task.pic?.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-1.5">
                      {(task.assignees || []).slice(0, 4).map((a, i) => <Avatar key={i} name={a.profile?.full_name} size={22} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} label={LABEL[task.status]} /></td>
                  <td className="px-4 py-3 text-muted">{fmtDate(task.deadline) || t('general.noDeadline')}</td>
                  <td className="px-4 py-3 text-muted">{effectiveProgress(task)}%</td>
                  <td className="px-4 py-3 text-right">
                    {canEditAll(task) ? (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => edit(task)} className="text-xs text-muted hover:text-ink">{t('general.edit')}</button>
                        <button onClick={() => del(task)} className="text-xs text-muted hover:text-clay">{t('general.delete')}</button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* mobile cards */}
          <div className="divide-y divide-hairline md:hidden">
            {tasks.map((task) => (
              <div key={task.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{task.title}</p>
                  <StatusBadge status={task.status} label={LABEL[task.status]} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  <span>PIC: {task.pic?.full_name || '—'}</span>
                  <span>{fmtDate(task.deadline) || t('general.noDeadline')}</span>
                  <span>{effectiveProgress(task)}%</span>
                </div>
                {canEditAll(task) && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => edit(task)} className="rounded-full bg-canvas px-3 py-1.5 text-xs hover:bg-hairline">{t('general.edit')}</button>
                    <button onClick={() => del(task)} className="rounded-full border border-hairline px-3 py-1.5 text-xs text-muted hover:text-clay">{t('general.delete')}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <TaskModal open={open} task={active} profiles={profiles} canEditAll={active ? canEditAll(active) : true} onClose={() => setOpen(false)} onSaved={reload} />
    </div>
  )
}
