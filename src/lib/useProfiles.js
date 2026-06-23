import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.from('profiles').select('id,full_name,email,role').order('full_name')
      .then(({ data }) => { if (active) { setProfiles(data || []); setLoading(false) } })
    return () => { active = false }
  }, [])

  return { profiles, loading }
}
