import { useEffect, useState } from 'react'
import { supabase, STATUSES, effectiveProgress } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useT } from '../lib/i18n'
import { Modal, Button, Field, Input, Textarea, Select, Spinner } from './ui'

const blank = { title: '', description: '', status: 'todo', deadline: '', pic_id: '', progress: '', assignees: [] }

export default function TaskModal({ open, task, profiles, canEditAll, onClose, onSaved }) {
  const { user } = useAuth()
  const t = useT().t
  const isNew = !task
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    if (task) {
      setF({
        title: task.title || '',
        description: task.description || '',
        status: task.status,
        deadline: task.deadline || '',
        pic_id: task.pic_id || '',
        progress: task.progress ?? '',
        assignees: (task.assignees || []).map((a) => a.profile?.id).filter(Boolean),
      })
    } else {
      setF(blank)
    }
  }, [open, task])

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const baseline = effectiveProgress({ status: f.status, progress: null })

  const isMine = task && (task.pic_id === user?.id || (task.assignees || []).some((a) => a.profile?.id === user?.id))
  const canStatus = isNew || canEditAll || isMine
  const lockCore = !canEditAll && !isNew

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const progress = f.progress === '' ? null : Math.max(0, Math.min(100, Number(f.progress)))
    try {
      if (isNew) {
        const { data, error } = await supabase.from('tasks').insert({
          title: f.title.trim(),
          description: f.description.trim() || null,
          status: f.status,
          deadline: f.deadline || null,
          pic_id: f.pic_id || null,
          progress,
          created_by: user.id,
        }).select('id').single()
        if (error) throw error
        if (f.assignees.length) {
          const { error: e2 } = await supabase.from('task_assignees')
            .insert(f.assignees.map((pid) => ({ task_id: data.id, profile_id: pid })))
          if (e2) throw e2
        }
      } else if (canEditAll) {
        const { error } = await supabase.from('tasks').update({
          title: f.title.trim(),
          description: f.description.trim() || null,
          status: f.status,
          deadline: f.deadline || null,
          pic_id: f.pic_id || null,
          progress,
        }).eq('id', task.id)
        if (error) throw error
        await supabase.from('task_assignees').delete().eq('task_id', task.id)
        if (f.assignees.length) {
          await supabase.from('task_assignees').insert(f.assignees.map((pid) => ({ task_id: task.id, profile_id: pid })))
        }
      } else {
        const { error } = await supabase.from('tasks').update({ status: f.status, progress }).eq('id', task.id)
        if (error) throw error
      }
      onSaved?.()
      onClose()
    } catch (e) {
      setErr(e.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const modalTitle = isNew ? t('assign.newTask') : canEditAll ? `${t('general.edit')} Task` : 'Task'

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Title">
          <Input required value={f.title} onChange={(e) => set('title', e.target.value)} disabled={lockCore} placeholder="What needs doing?" />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} disabled={lockCore} placeholder="Details…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={f.status} onChange={(e) => set('status', e.target.value)} disabled={!canStatus}>
              {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Deadline">
            <Input type="date" value={f.deadline} onChange={(e) => set('deadline', e.target.value)} disabled={lockCore} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PIC">
            <Select value={f.pic_id} onChange={(e) => set('pic_id', e.target.value)} disabled={lockCore}>
              <option value="">—</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </Field>
          <Field label="Progress %" hint={`Empty = auto (${baseline}%)`}>
            <Input type="number" min={0} max={100} value={f.progress} onChange={(e) => set('progress', e.target.value)} disabled={!canStatus} placeholder={String(baseline)} />
          </Field>
        </div>
        {!lockCore && (
          <Field label="Assignees">
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => {
                const on = f.assignees.includes(p.id)
                return (
                  <button type="button" key={p.id}
                    onClick={() => set('assignees', on ? f.assignees.filter((x) => x !== p.id) : [...f.assignees, p.id])}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${on ? 'border-ink bg-ink text-bone' : 'border-hairline text-muted hover:border-ink hover:text-ink'}`}>
                    {p.full_name}
                  </button>
                )
              })}
            </div>
          </Field>
        )}
        {err && <p className="text-sm text-clay">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>{canStatus ? t('general.cancel') : t('general.close')}</Button>
          {canStatus && <Button type="submit" disabled={busy}>{busy ? <Spinner /> : isNew ? t('general.create') : t('general.save')}</Button>}
        </div>
      </form>
    </Modal>
  )
}
