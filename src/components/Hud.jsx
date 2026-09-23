import React, { useEffect, useRef, useState } from 'react'

export const SECTIONS = [
  { id: 'home', label: 'Subject' },
  { id: 'about', label: 'Profile' },
  { id: 'work', label: 'Selected Work' },
  { id: 'toolbox', label: 'Toolbox' },
  { id: 'timeline', label: 'Commit Log' },
  { id: 'contact', label: 'Contact' },
]

const two = (n) => String(n).padStart(2, '0')

export const jumpTo = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const Hud = () => {
  const [active, setActive] = useState('home')
  const [open, setOpen] = useState(false)
  const tcRef = useRef(null)
  const frmRef = useRef(null)
  const barRef = useRef(null)

  // Which section is on screen
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-45% 0px -50% 0px' })
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  // Session timecode + scroll frame counter, written straight to the DOM
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = () => {
      const ms = performance.now() - start
      const s = Math.floor(ms / 1000)
      const f = Math.floor((ms % 1000) / (1000 / 24))
      tcRef.current.textContent = `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}:${two(f)}`
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      frmRef.current.textContent = String(Math.round(window.scrollY)).padStart(6, '0')
      barRef.current.style.transform = `scaleX(${p})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 0–5 jump to a channel, Esc closes the index
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') setOpen(false)
      const n = parseInt(e.key, 10)
      if (!Number.isNaN(n) && SECTIONS[n]) {
        setOpen(false)
        jumpTo(SECTIONS[n].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', open)
  }, [open])

  const idx = Math.max(0, SECTIONS.findIndex((s) => s.id === active))

  return (
    <>
      <div className="hud" aria-hidden={open}>
        <span className="hud__corner hud__corner--tl" />
        <span className="hud__corner hud__corner--tr" />
        <span className="hud__corner hud__corner--bl" />
        <span className="hud__corner hud__corner--br" />

        <button className="hud__brand" onClick={() => jumpTo('home')} data-cursor="TOP">
          <strong>Arshia Behzad</strong>
          <span>Software Engineer</span>
        </button>

        <div className="hud__rec">
          <span className="hud__dot" /> REC <span ref={tcRef} className="hud__tc">00:00:00:00</span>
        </div>

        <button className="hud__index" onClick={() => setOpen(true)} data-cursor="INDEX">
          Index <span>[{two(SECTIONS.length)}]</span>
        </button>

        <nav className="hud__rail" aria-label="Sections">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={i === idx ? 'is-active' : ''}
              onClick={() => jumpTo(s.id)}
              data-cursor={s.label.toUpperCase()}
              aria-label={s.label}
            >
              {two(i)}
            </button>
          ))}
        </nav>

        <div className="hud__channel">
          <span>CH.{two(idx)}</span> {SECTIONS[idx].label}
        </div>
        <div className="hud__frames">
          FRM <span ref={frmRef}>000000</span>
          <i><b ref={barRef} /></i>
        </div>
      </div>

      <div className={`index ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open} aria-label="Site index">
        <button className="index__close" onClick={() => setOpen(false)} data-cursor="CLOSE" tabIndex={open ? 0 : -1}>
          Close ✕
        </button>
        <ol>
          {SECTIONS.map((s, i) => (
            <li key={s.id} style={{ '--i': i }}>
              <button
                onClick={() => { setOpen(false); jumpTo(s.id) }}
                className={i === idx ? 'is-active' : ''}
                tabIndex={open ? 0 : -1}
              >
                <span className="index__num">{two(i)}</span>
                <span className="index__label">{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="index__hint">Tip — press 0–5 anywhere to switch channels</p>
      </div>
    </>
  )
}

export default Hud
