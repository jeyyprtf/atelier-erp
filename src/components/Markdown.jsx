import { memo } from 'react'

// Tiny markdown renderer — bold, italic, link, list, inline code
function parseInline(s) {
  const nodes = []
  let i = 0, buf = ''
  const flush = () => { if (buf) { nodes.push({ t: 't', v: buf }); buf = '' } }
  while (i < s.length) {
    if (s[i] === '*' && s[i + 1] === '*') {
      const end = s.indexOf('**', i + 2)
      if (end !== -1) { flush(); nodes.push({ t: 'b', v: s.slice(i + 2, end) }); i = end + 2; continue }
    }
    if (s[i] === '*' && s[i + 1] !== '*') {
      const end = s.indexOf('*', i + 1)
      if (end !== -1) { flush(); nodes.push({ t: 'i', v: s.slice(i + 1, end) }); i = end + 1; continue }
    }
    if (s[i] === '`') {
      const end = s.indexOf('`', i + 1)
      if (end !== -1) { flush(); nodes.push({ t: 'code', v: s.slice(i + 1, end) }); i = end + 1; continue }
    }
    if (s[i] === '[') {
      const cb = s.indexOf(']', i + 1)
      if (cb !== -1 && s[cb + 1] === '(') {
        const ce = s.indexOf(')', cb + 2)
        if (ce !== -1) { flush(); nodes.push({ t: 'a', v: s.slice(i + 1, cb), h: s.slice(cb + 2, ce) }); i = ce + 1; continue }
      }
    }
    buf += s[i]; i++
  }
  flush()
  return nodes
}

const Inline = memo(({ text }) => {
  const nodes = parseInline(text)
  return nodes.map((n, i) => {
    if (n.t === 't') return n.v
    if (n.t === 'b') return <strong key={i}><Inline text={n.v} /></strong>
    if (n.t === 'i') return <em key={i}><Inline text={n.v} /></em>
    if (n.t === 'code') return <code key={i} className="rounded bg-canvas px-1 py-px text-xs">{n.v}</code>
    if (n.t === 'a') return <a key={i} href={n.h} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{n.v}</a>
    return null
  })
})

// build nested blocks: paragraphs, headings, lists
function parseBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    if (!raw.trim()) { i++; continue }

    const li = raw.match(/^[\s]*[-*]\s+(.+)/)
    if (li) {
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(/^[\s]*[-*]\s+(.+)/)
        if (!m) break
        items.push(m[1]); i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    const h = raw.match(/^#{1,3}\s+(.+)/)
    if (h) { blocks.push({ type: 'h', level: h[0].match(/^#+/)[0].length, text: h[1] }); i++; continue }

    blocks.push({ type: 'p', text: raw }); i++
  }
  return blocks
}

export default function Markdown({ text }) {
  if (!text) return null
  const blocks = parseBlocks(text)
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed space-y-1.5">
      {blocks.map((b, i) => {
        if (b.type === 'ul') return (
          <ul key={i} className="list-disc pl-4 space-y-0.5">
            {b.items.map((item, j) => <li key={j}><Inline text={item} /></li>)}
          </ul>
        )
        if (b.type === 'h') {
          const size = b.level === 1 ? 'text-lg' : b.level === 2 ? 'text-base' : 'text-sm font-medium'
          return <h4 key={i} className={`font-display tracking-tight ${size}`}><Inline text={b.text} /></h4>
        }
        if (b.type === 'p') return <p key={i}><Inline text={b.text} /></p>
        return null
      })}
    </div>
  )
}
