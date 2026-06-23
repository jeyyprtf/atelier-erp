import { useEffect, useState, useCallback } from 'react'
import { supabase, STATUSES, effectiveProgress } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useT } from '../lib/i18n'
import { Modal, Button, Field, Input, Textarea, Select, Spinner, Avatar } from './ui'
import Markdown from './Markdown'

const blank = { title: '', description: '', status: 'todo', deadline: '', pic_id: '', progress: '', assignees: [] }

export default function TaskModal({ open, task, profiles, canEditAll, onClose, onSaved }) {
  const { user } = useAuth()
  const t = useT().t
  const isNew = !task
  const [f, setF] = useState(blank)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // comments
  const [comments, setComments] = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)

  // time
  const [entries, setEntries] = useState([])
  const [timeMin, setTimeMin] = useState('')
  const [timeNote, setTimeNote] = useState('')
  const [timeBusy, setTimeBusy] = useState(false)
  const [totalMin, setTotalMin] = useState(0)

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
      loadComments(task.id)
      loadTime(task.id)
    } else {
      setF(blank)
      setComments([])
      setEntries([])
      setTotalMin(0)
    }
  }, [open, task])

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const baseline = effectiveProgress({ status: f.status, progress: null })
  const isMine = task && (task.pic_id === user?.id || (task.assignees || []).some((a) => a.profile?.id === user?.id))
  const canStatus = isNew || canEditAll || isMine
  const lockCore = !canEditAll && !isNew

  async function loadComments(taskId) {
    const { data } = await supabase.from('task_comments').select('*, author:profiles!author_id(id,full_name,avatar_url)').eq('task_id', taskId).order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function addComment(e) {
    e.preventDefault()
    const body = commentBody.trim()
    if (!body) return
    setCommentBusy(true)
    const { error } = await supabase.from('task_comments').insert({ task_id: task.id, author_id: user.id, body })
    setCommentBusy(false)
    if (error) { setErr(error.message); return }
    setCommentBody('')
    loadComments(task.id)
  }

  async function loadTime(taskId) {
    const { data } = await supabase.from('time_entries').select('*, profile:profiles!profile_id(full_name)').eq('task_id', taskId).order('created_at', { ascending: false })
    setEntries(data || [])
    setTotalMin((data || []).reduce((s, e) => s + e.minutes, 0))
  }

  async function addTime(e) {
    e.preventDefault()
    const min = parseInt(timeMin)
    if (!min || min <= 0 || min > 1440) return
    setTimeBusy(true)
    const { error } = await supabase.from('time_entries').insert({ task_id: task.id, profile_id: user.id, minutes: min, note: timeNote.trim() || null })
    setTimeBusy(false)
    if (error) { setErr(error.message); return }
    setTimeMin(''); setTimeNote('')
    loadTime(task.id)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const progress = f.progress === '' ? null : Math.max(0, Math.min(100, Number(f.progress)))
    try {
      if (isNew) {
        const { data, error } = await supabase.from('tasks').insert({
          title: f.title.trim(), description: f.description.trim() || null, status: f.status,
          deadline: f.deadline || null, pic_id: f.pic_id || null, progress, created_by: user.id,
        }).select('id').single()
        if (error) throw error
        if (f.assignees.length) {
          const { error: e2 } = await supabase.from('task_assignees').insert(f.assignees.map((pid) => ({ task_id: data.id, profile_id: pid })))
          if (e2) throw e2
        }
      } else if (canEditAll) {
        const { error } = await supabase.from('tasks').update({
          title: f.title.trim(), description: f.description.trim() || null, status: f.status,
          deadline: f.deadline || null, pic_id: f.pic_id || null, progress,
        }).eq('id', task.id)
        if (error) throw error
        await supabase.from('task_assignees').delete().eq('task_id', task.id)
        if (f.assignees.length) await supabase.from('task_assignees').insert(f.assignees.map((pid) => ({ task_id: task.id, profile_id: pid })))
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

  // pony: large modal when task exists (comments + time) — use wider max-w
  const wide = !!task

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      <div className={wide ? 'max-h-[70vh] overflow-y-auto space-y-6' : 'space-y-4'}>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title">
            <Input required value={f.title} onChange={(e) => set('title', e.target.value)} disabled={lockCore} placeholder="What needs doing?" />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} disabled={lockCore} placeholder="Details… (markdown supported)" />
            {f.description && <div className="mt-2 rounded-xl border border-hairline bg-canvas/30 p-3"><Markdown text={f.description} /></div>}
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
            <Field label="Progress %" hint={`Auto (${baseline}%)`}>
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

        {/* comments section */}
        {task && (
          <div className="border-t border-hairline pt-5">
            <h3 className="mb-3 text-sm font-medium">Comments</h3>
            <div className="mb-3 space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar name={c.author?.full_name} url={c.author?.avatar_url} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.author?.full_name || '?'}</span>
                      <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1"><Markdown text={c.body} /></div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={addComment} className="flex gap-2">
              <Input value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Write a comment… (markdown OK)" className="flex-1" />
              <Button type="submit" disabled={commentBusy || !commentBody.trim()}>{commentBusy ? <Spinner /> : 'Send'}</Button>
            </form>
          </div>
        )}

        {/* time tracking */}
        {task && (
          <div className="border-t border-hairline pt-5">
            <h3 className="mb-3 text-sm font-medium">Time ({Math.floor(totalMin / 60)}h {totalMin % 60}m total)</h3>
            <div className="mb-3 space-y-1.5">
              {entries.slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-sm text-muted">
                  <span className="font-mono text-xs">{e.minutes}m</span>
                  <span>{e.profile?.full_name}</span>
                  {e.note && <span className="text-xs">— {e.note}</span>}
                </div>
              ))}
            </div>
            <form onSubmit={addTime} className="flex items-end gap-2">
              <div className="w-20"><Field label="Min"><Input type="number" min={1} max={1440} value={timeMin} onChange={(e) => setTimeMin(e.target.value)} placeholder="30" /></Field></div>
              <div className="flex-1"><Field label="Note"><Input value={timeNote} onChange={(e) => setTimeNote(e.target.value)} placeholder="What did you do?" /></Field></div>
              <Button type="submit" disabled={timeBusy || !timeMin}>{timeBusy ? <Spinner /> : 'Log'}</Button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  )
}
