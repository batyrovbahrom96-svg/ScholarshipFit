'use client'
// Ultra-light markdown → React renderer for our blog body strings.
// Supports: # / ## / ### headings, **bold**, - / 1. lists, > blockquotes,
// [text](url) links, `code`, tables (| ... |), and paragraphs.
// Zero external deps — keeps the bundle small.
import React from 'react'

const inline = (text) => {
  // links: [text](url)
  const parts = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**') && tok.endsWith('**')) {
      parts.push(<strong key={m.index} className="text-white">{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('`') && tok.endsWith('`')) {
      parts.push(<code key={m.index} className="px-1.5 py-0.5 rounded bg-white/10 text-[13px] font-mono text-[#D4AF37]">{tok.slice(1, -1)}</code>)
    } else if (tok.startsWith('[')) {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (mm) {
        const [, label, url] = mm
        const isExternal = /^https?:\/\//.test(url)
        parts.push(
          <a
            key={m.index}
            href={url}
            className="text-[#D4AF37] hover:underline"
            {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >{label}</a>
        )
      }
    }
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function BlogBody({ body }) {
  const lines = String(body || '').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) { i++; continue }

    // Headings
    if (line.startsWith('### ')) {
      out.push(<h3 key={i} className="mt-8 mb-3 text-lg md:text-xl font-semibold text-white">{inline(line.slice(4))}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      out.push(<h2 key={i} className="mt-10 mb-4 text-xl md:text-2xl font-semibold text-white">{inline(line.slice(3))}</h2>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      out.push(<h1 key={i} className="mt-10 mb-4 text-2xl md:text-3xl font-semibold text-white">{inline(line.slice(2))}</h1>)
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const buf = []
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        buf.push(lines[i].trim().slice(2))
        i++
      }
      out.push(
        <blockquote key={`q-${i}`} className="my-5 border-l-2 border-[#D4AF37]/60 bg-[#D4AF37]/[0.04] px-4 py-3 text-white/85 italic">
          {buf.map((b, k) => <p key={k} className="leading-relaxed">{inline(b)}</p>)}
        </blockquote>
      )
      continue
    }

    // Table  (| col | col | ... |)
    if (line.startsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim().slice(1, -1).split('|').map((c) => c.trim()))
        i++
      }
      // Second row is the separator (---|---|---) — discard
      const header = rows[0]
      const body = rows.slice(2)
      out.push(
        <div key={`t-${i}`} className="my-6 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>{header.map((h, k) => <th key={k} className="px-4 py-2 text-left text-white/70 font-medium">{inline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, k) => (
                <tr key={k} className={k % 2 ? 'bg-white/[0.02]' : ''}>
                  {r.map((c, j) => <td key={j} className="px-4 py-2 text-white/80 align-top">{inline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // Unordered list
    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        items.push(lines[i].trim().slice(2))
        i++
      }
      out.push(
        <ul key={`ul-${i}`} className="my-4 list-disc pl-6 space-y-1.5 text-white/80">
          {items.map((t, k) => <li key={k} className="leading-relaxed">{inline(t)}</li>)}
        </ul>
      )
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''))
        i++
      }
      out.push(
        <ol key={`ol-${i}`} className="my-4 list-decimal pl-6 space-y-1.5 text-white/80">
          {items.map((t, k) => <li key={k} className="leading-relaxed">{inline(t)}</li>)}
        </ol>
      )
      continue
    }

    // Paragraph (may span multiple lines until blank)
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#|>|-|\d+\.|\|)/.test(lines[i].trim())) {
      buf.push(lines[i].trim())
      i++
    }
    out.push(<p key={`p-${i}`} className="my-4 leading-relaxed text-white/80">{inline(buf.join(' '))}</p>)
  }

  return <div className="prose-invert max-w-none">{out}</div>
}
