import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase, fmtDate } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { Button, Modal, Field, Input, Textarea, Spinner, EmptyState, Card } from '../components/ui'

export default function Meetings() {
  const { user, role } = useAuth()
  const t = useT().t
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)

  async function load() {
    const { data } = await supabase.from('meetings')
      .select('*, creator:profiles!created_by(full_name)')
      .order('meeting_date', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const canEdit = (m) => !!m && (m.created_by === user?.id || role === 'c_level')
  function create() { setActive(null); setOpen(true) }
  function openItem(m) { setActive(m); setOpen(true) }

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('meetings.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('meetings.subtitle')}</p>
        </div>
        <Button onClick={create}>{t('meetings.new')}</Button>
      </header>

      {loading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title={t('meetings.empty')} hint={t('meetings.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <Card key={m.id} onClick={() => openItem(m)} className="cursor-pointer p-5 transition-shadow hover:shadow-md">
              <p className="text-xs uppercase tracking-wider text-muted">
                {fmtDate(m.meeting_date, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h3 className="mt-1 font-display text-xl tracking-tight">{m.title}</h3>
              {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
              {m.notes && <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm text-ink/80">{m.notes}</p>}
              <p className="mt-4 text-xs text-muted">— {m.creator?.full_name || 'Unknown'}</p>
            </Card>
          ))}
        </div>
      )}

      <MeetingModal open={open} meeting={active} canEdit={canEdit(active)} onClose={() => setOpen(false)} onSaved={load} />
    </div>
  )
}

function MeetingModal({ open, meeting, canEdit, onClose, onSaved }) {
  const { user } = useAuth()
  const t = useT().t
  const isNew = !meeting
  const [f, setF] = useState({ title: '', meeting_date: '', description: '', notes: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    setF(meeting
      ? { title: meeting.title || '', meeting_date: meeting.meeting_date || '', description: meeting.description || '', notes: meeting.notes || '' }
      : { title: '', meeting_date: new Date().toISOString().slice(0, 10), description: '', notes: '' })
  }, [open, meeting])

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const editable = isNew || canEdit

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const payload = {
      title: f.title.trim(),
      meeting_date: f.meeting_date,
      description: f.description.trim() || null,
      notes: f.notes.trim() || null,
    }
    try {
      if (isNew) {
        const { error } = await supabase.from('meetings').insert({ ...payload, created_by: user.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('meetings').update(payload).eq('id', meeting.id)
        if (error) throw error
      }
      onSaved?.()
      onClose()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function del() {
    if (!confirm('Delete this meeting?')) return
    const { error } = await supabase.from('meetings').delete().eq('id', meeting.id)
    if (error) setErr(error.message)
    else { onSaved?.(); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title={isNew ? t('meetings.new') : canEdit ? `${t('general.edit')} Meeting` : 'Meeting'}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Title">
          <Input required disabled={!editable} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Meeting title" />
        </Field>
        <Field label="Date">
          <Input type="date" required disabled={!editable} value={f.meeting_date} onChange={(e) => set('meeting_date', e.target.value)} />
        </Field>
        <Field label="About">
          <Input disabled={!editable} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="What was it about?" />
        </Field>
        <Field label="Notes">
          <Textarea rows={8} disabled={!editable} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Discussion, decisions, action items…" />
        </Field>
        {err && <p className="text-sm text-clay">{err}</p>}
        <div className="flex items-center justify-between pt-2">
          <div>{!isNew && canEdit && <Button type="button" variant="ghost" onClick={del}>{t('general.delete')}</Button>}</div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('general.close')}</Button>
            {editable && <Button type="submit" disabled={busy}>{busy ? <Spinner /> : isNew ? t('general.create') : t('general.save')}</Button>}
          </div>
        </div>
      </form>
    </Modal>
  )
}
