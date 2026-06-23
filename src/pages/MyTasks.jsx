import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useTasks } from '../lib/useTasks'
import { useProfiles } from '../lib/useProfiles'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import Board from '../components/Board'
import TaskModal from '../components/TaskModal'
import { Spinner, EmptyState } from '../components/ui'

export default function MyTasks() {
  const { user, role } = useAuth()
  const { tasks, loading, setTasks, reload } = useTasks()
  const { profiles } = useProfiles()
  const t = useT().t
  const [active, setActive] = useState(null)
  const [open, setOpen] = useState(false)

  const mine = useMemo(
    () => tasks.filter((x) => x.pic_id === user?.id || (x.assignees || []).some((a) => a.profile?.id === user?.id)),
    [tasks, user?.id],
  )

  async function move(id, status) {
    setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, status } : x)))
    const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
    if (error) reload()
  }

  function openTask(task) { setActive(task); setOpen(true) }
  const canEditAll = role === 'c_level' || (role === 'lead' && active?.created_by === user?.id)

  return (
    <div>
      <header className="mb-7">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('mytasks.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('mytasks.subtitle')}</p>
      </header>
      {loading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : mine.length === 0 ? (
        <EmptyState title={t('mytasks.empty')} hint={t('mytasks.emptyHint')} />
      ) : (
        <Board tasks={mine} onMove={move} onOpen={openTask} />
      )}
      <TaskModal open={open} task={active} profiles={profiles} canEditAll={canEditAll} onClose={() => setOpen(false)} onSaved={reload} />
    </div>
  )
}
