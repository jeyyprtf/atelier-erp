import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { Button, Modal, Field, Input, Textarea, Spinner, EmptyState, Card } from '../components/ui'

const SUGGESTED = ['spreadsheet', 'document', 'pdf', 'proposal', 'link', 'other']

export default function Resources() {
  const { user, role } = useAuth()
  const t = useT().t
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const [filter, setFilter] = useState('all')

  async function load() {
    const { data } = await supabase.from('resources')
      .select('*, creator:profiles!created_by(full_name)')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const categories = useMemo(() => {
    const s = new Set(items.map((i) => i.category || 'other'))
    return ['all', ...Array.from(s).sort()]
  }, [items])

  const filtered = filter === 'all' ? items : items.filter((i) => (i.category || 'other') === filter)

  const canEdit = (r) => !!r && (r.created_by === user?.id || role === 'c_level')
  function create() { setActive(null); setOpen(true) }
  function openItem(r) { setActive(r); setOpen(true) }
  function catLabel(c) { return t(`resources.categories.${c}`) }

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('resources.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('resources.subtitle')}</p>
        </div>
        <Button onClick={create}>{t('resources.new')}</Button>
      </header>

      {categories.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${filter === c ? 'bg-ink text-bone' : 'border border-hairline text-muted hover:border-ink hover:text-ink'}`}>
              {c === 'all' ? t('resources.all') : catLabel(c)}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('resources.empty')} hint={t('resources.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
              className="group block">
              <Card className="relative p-5 transition-shadow group-hover:shadow-md">
                <div className="absolute right-4 top-4 text-muted opacity-0 transition-opacity group-hover:opacity-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                  </svg>
                </div>
                <span className="inline-block rounded-full bg-canvas px-2.5 py-1 text-xs text-muted">{catLabel(r.category || 'other')}</span>
                <h3 className="mt-2.5 font-display text-lg tracking-tight">{r.title}</h3>
                {r.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{r.description}</p>}
                <p className="mt-4 text-xs text-muted">{r.creator?.full_name || 'Unknown'}</p>
              </Card>
            </a>
          ))}
        </div>
      )}

      <ResourceModal open={open} resource={active} canEdit={canEdit(active)} onClose={() => setOpen(false)} onSaved={load} />
    </div>
  )
}

function ResourceModal({ open, resource, canEdit, onClose, onSaved }) {
  const { user } = useAuth()
  const t = useT().t
  const isNew = !resource
  const [f, setF] = useState({ title: '', description: '', url: '', category: 'other' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    setF(resource
      ? { title: resource.title || '', description: resource.description || '', url: resource.url || '', category: resource.category || 'other' }
      : { title: '', description: '', url: '', category: 'other' })
  }, [open, resource])

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const editable = isNew || canEdit
  const catLabel = (c) => t(`resources.categories.${c}`)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const payload = { title: f.title.trim(), description: f.description.trim() || null, url: f.url.trim(), category: f.category || 'other' }
    try {
      if (isNew) {
        const { error } = await supabase.from('resources').insert({ ...payload, created_by: user.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('resources').update(payload).eq('id', resource.id)
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
    if (!confirm('Delete this resource?')) return
    const { error } = await supabase.from('resources').delete().eq('id', resource.id)
    if (error) setErr(error.message)
    else { onSaved?.(); onClose() }
  }

  return (
    <Modal open={open} onClose={onClose} title={isNew ? t('resources.new') : canEdit ? `${t('general.edit')} Resource` : 'Resource'}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Title">
          <Input required disabled={!editable} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Resource name" />
        </Field>
        <Field label={t('resources.url')}>
          <Input type="url" required disabled={!editable} value={f.url} onChange={(e) => set('url', e.target.value)} placeholder="https://drive.google.com/…" />
        </Field>
        <Field label={t('resources.category')}>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((c) => (
              <button type="button" key={c} disabled={!editable}
                onClick={() => set('category', c)}
                className={`rounded-full px-3 py-1.5 text-xs transition-colors ${f.category === c ? 'bg-ink text-bone' : 'border border-hairline text-muted hover:border-ink hover:text-ink'}`}>
                {catLabel(c)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Description">
          <Textarea rows={3} disabled={!editable} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="What's inside this resource…" />
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
