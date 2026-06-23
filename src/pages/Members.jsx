import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { useT } from '../lib/i18n'
import { Spinner, Avatar, Select } from '../components/ui'

const ROLES = [
  { v: 'member', l: 'Member' },
  { v: 'lead', l: 'Lead' },
  { v: 'c_level', l: 'C-Level' },
]

export default function Members() {
  const { user, refreshProfile } = useAuth()
  const t = useT().t
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function changeRole(id, role) {
    setSavingId(id)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    setSavingId(null)
    if (error) { alert(error.message); return }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, role } : r)))
    if (id === user?.id) refreshProfile()
  }

  return (
    <div>
      <header className="mb-7">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{t('members.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('members.subtitle')}</p>
      </header>
      {loading ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 border-b border-hairline p-4 last:border-0">
              <Avatar name={r.full_name} url={r.avatar_url} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.full_name}
                  {r.id === user?.id && <span className="ml-2 text-xs text-muted">({t('profile.you')})</span>}
                </p>
                <p className="truncate text-sm text-muted">{r.email}</p>
              </div>
              <div className="w-40">
                <Select value={r.role} disabled={r.id === user?.id || savingId === r.id} onChange={(e) => changeRole(r.id, e.target.value)}>
                  {ROLES.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
