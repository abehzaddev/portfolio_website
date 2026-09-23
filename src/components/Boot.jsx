import React, { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/hooks'

const LINES = [
  'lens ........... mounted',
  'sensor ......... calibrated',
  'focus .......... locked',
  'subject ........ acquired',
]

const Boot = () => {
  const [done, setDone] = useState(prefersReducedMotion)
  const [gone, setGone] = useState(done)
  const [n, setN] = useState(0)
  const numRef = useRef(null)

  useEffect(() => {
    if (done) return undefined
    const start = performance.now()
    const DURATION = 1500
    let raf = 0
    const tick = (now) => {
      const p = Math.min(1, (now - start) / DURATION)
      const eased = 1 - Math.pow(1 - p, 3)
      numRef.current.textContent = String(Math.round(eased * 100)).padStart(3, '0')
      setN(Math.floor(p * LINES.length + 0.001))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(() => setDone(true), 200)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [done])

  useEffect(() => {
    if (!done) return undefined
    document.documentElement.classList.add('is-booted')
    const t = setTimeout(() => setGone(true), 900)
    return () => clearTimeout(t)
  }, [done])

  if (gone) return null
  return (
    <div className={`boot ${done ? 'is-done' : ''}`} aria-hidden="true">
      <div className="boot__log">
        {LINES.slice(0, n).map((l) => <p key={l}>&gt; {l}</p>)}
      </div>
      <div className="boot__num"><span ref={numRef}>000</span><i>%</i></div>
    </div>
  )
}

export default Boot
