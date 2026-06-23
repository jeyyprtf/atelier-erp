import { useEffect } from 'react'

// global keyboard shortcuts (only when modals are closed — checked via data attributes)
function isEditing() {
  return document.activeElement?.tagName === 'INPUT'
    || document.activeElement?.tagName === 'TEXTAREA'
    || document.activeElement?.tagName === 'SELECT'
    || document.activeElement?.isContentEditable
    || document.querySelector('[data-modal-open="true"]')
}

export function useShortcuts(map) {
  useEffect(() => {
    function onKey(e) {
      if (isEditing()) return
      const key = (e.ctrlKey || e.metaKey ? 'Cmd+' : '') + (e.shiftKey ? 'Shift+' : '') + e.key.toLowerCase()
      const fn = map[key]
      if (fn) { e.preventDefault(); fn() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map])
}
