import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

const SELECT =
  '*, pic:profiles!pic_id(id,full_name), assignees:task_assignees(profile:profiles!profile_id(id,full_name))'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data } = await supabase.from('tasks').select(SELECT).order('created_at', { ascending: false })
    setTasks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  // live updates — reload when any task / assignment changes anywhere
  useEffect(() => {
    const ch = supabase.channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, reload)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [reload])

  return { tasks, loading, reload, setTasks }
}
