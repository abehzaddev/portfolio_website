import React, { useEffect, useRef, useState } from 'react'
import { hasFinePointer } from '../lib/hooks'

const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, '0')

const Cursor = () => {
  const ringRef = useRef(null)
  const dotRef = useRef(null)
  const readRef = useRef(null)
  const [enabled] = useState(hasFinePointer)

  useEffect(() => {
    if (!enabled) return undefined
    document.documentElement.classList.add('has-cursor')
    const pos = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let label = ''
    let raf = 0

    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const target = e.target.closest ? e.target.closest('[data-cursor], a, button, input, textarea') : null
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      const next = typing ? '' : target ? target.getAttribute('data-cursor') || 'OPEN' : ''
      ringRef.current.classList.toggle('is-hidden', !!typing)
      if (next !== label) {
        label = next
        ringRef.current.classList.toggle('is-active', !!label)
        ringRef.current.querySelector('.cursor__label').textContent = label
      }
    }
    const onDown = () => ringRef.current.classList.add('is-down')
    const onUp = () => ringRef.current.classList.remove('is-down')

    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.22
      ring.y += (pos.y - ring.y) * 0.22
      ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`
      dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      readRef.current.textContent = `X${pad(pos.x)} Y${pad(pos.y)}`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ringRef}>
        <span className="cursor__label" />
        <span className="cursor__read" ref={readRef} />
      </div>
      <div className="cursor__dot" ref={dotRef} />
    </div>
  )
}

export default Cursor
