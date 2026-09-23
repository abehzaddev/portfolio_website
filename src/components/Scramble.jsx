import React, { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/hooks'

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01'

// Text that scrambles into place whenever `text` changes (or `trigger` flips true).
const Scramble = ({ text, trigger = true, duration = 700, className = '', as: Tag = 'span' }) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (!trigger || prefersReducedMotion()) { el.textContent = text; return undefined }
    const start = performance.now()
    const offsets = [...text].map(() => Math.random() * 0.6)
    let raf = 0
    const tick = (now) => {
      const p = (now - start) / duration
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === ' ' || p > offsets[i] + 0.4) out += ch
        else if (p > offsets[i]) out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
        else out += ' '
      }
      el.textContent = out
      if (p < 1) raf = requestAnimationFrame(tick)
      else el.textContent = text
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, trigger, duration])

  return <Tag ref={ref} className={className} aria-label={text}>{trigger ? '' : text}</Tag>
}

export default Scramble
