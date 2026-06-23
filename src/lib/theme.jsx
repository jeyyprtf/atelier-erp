import { createContext, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches
const apply = (theme) =>
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && systemDark()))

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system')

  useEffect(() => { apply(theme) }, [theme])

  // follow OS changes while on "system"
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (t) => { localStorage.setItem('theme', t); setThemeState(t) }
  const resolved = theme === 'system' ? (systemDark() ? 'dark' : 'light') : theme

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>
}
