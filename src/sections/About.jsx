import React, { useEffect, useRef, useState } from 'react'
import { highlights, now } from '../lib/content'
import { useInView, prefersReducedMotion } from '../lib/hooks'

const STATEMENT = [
  'I write software that ', ['sees,'], ' ', ['sorts'], ' and ', ['ships'],
  ' — from segmentation models peering through microscopes to AI agents at IBM and apps you carry in your pocket.',
]

// Split into words so each can stagger in; arrays mark emphasized words.
const words = STATEMENT.flatMap((part) =>
  Array.isArray(part)
    ? [{ w: part[0], em: true }]
    : part.split(/(\s+)/).filter(Boolean).map((w) => ({ w, em: false })))

export const SectionLabel = ({ n, children }) => (
  <p className="label mono" data-reveal>
    <span>{String(n).padStart(2, '0')}</span>
    <i />
    {children}
  </p>
)

// Counts from `from` to `to` once `run` flips true.
const Counter = ({ from, to, run }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (!run) return undefined
    if (prefersReducedMotion()) { ref.current.textContent = to; return undefined }
    const start = performance.now()
    let raf = 0
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1400)
      const e = 1 - Math.pow(1 - p, 4)
      ref.current.textContent = Math.round(from + (to - from) * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [from, to, run])
  return <span ref={ref}>{from}</span>
}

const Readout = () => {
  const [ref, inView] = useInView({ threshold: 0.3 })
  return (
    <aside className="readout" ref={ref} data-reveal>
      <div className="readout__bar mono">
        <span><i className="readout__dot" /> Status readout</span>
        <span>{new Date().getFullYear()}</span>
      </div>

      <dl className="readout__now">
        {now.map((r) => (
          <div key={r.k}>
            <dt className="mono">{r.k}</dt>
            <dd>
              {r.v}
              {r.tags && (
                <span className="readout__tags">
                  {r.tags.map((t) => <span key={t} className="mono">{t}</span>)}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="readout__stats">
        {highlights.map((h) => (
          <div className="stat" key={h.label}>
            <p className="stat__ctx mono">{h.ctx}</p>
            <p className="stat__num">
              {h.to !== undefined
                ? <Counter from={h.value} to={h.to} run={inView} />
                : <Counter from={0} to={h.value} run={inView} />}
              <small>{h.unit}</small>
              <em className="stat__tail">{h.tail}</em>
            </p>
            <p className="stat__label">{h.label}</p>
          </div>
        ))}
      </div>
    </aside>
  )
}

const About = ({ abouts }) => {
  const [active, setActive] = useState(0)

  return (
    <section id="about" className="about section">
      <SectionLabel n={1}>Profile</SectionLabel>

      <h2 className="about__statement">
        {words.map(({ w, em }, i) =>
          /^\s+$/.test(w) ? w : (
            <span key={i} className="word" data-reveal style={{ '--d': `${i * 28}ms` }}>
              {em ? <em>{w}</em> : w}
            </span>
          ))}
      </h2>

      <div className="about__grid">
        <Readout />

        <ul className="about__roles">
          {abouts.map((a, i) => (
            <li key={a.title} data-reveal style={{ '--d': `${i * 80}ms` }}>
              <button
                className={`role ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                data-cursor="VIEW"
                aria-pressed={i === active}
              >
                <span className="role__n mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="role__title">{a.title}</span>
                <span className="role__desc">{a.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default About
