import React, { useEffect, useMemo, useRef, useState } from 'react'
import PixelImage from '../components/PixelImage'
import { SectionLabel } from './About'
import { sized } from '../lib/content'
import { hasFinePointer } from '../lib/hooks'

const two = (n) => String(n).padStart(2, '0')

const linksFor = (w) => {
  const live = w.projectLink && !/localhost/.test(w.projectLink) && w.projectLink !== w.codeLink ? w.projectLink : null
  return { live, code: w.codeLink }
}

// Floating preview that trails the cursor while hovering the index.
const Preview = ({ work, index }) => {
  const ref = useRef(null)

  useEffect(() => {
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const cur = { ...pos }
    let raf = 0
    const onMove = (e) => { pos.x = e.clientX; pos.y = e.clientY }
    const tick = () => {
      const dx = pos.x - cur.x
      cur.x += dx * 0.12
      cur.y += (pos.y - cur.y) * 0.12
      if (ref.current) {
        ref.current.style.transform =
          `translate3d(${cur.x + 28}px, ${cur.y - 120}px, 0) rotate(${Math.max(-8, Math.min(8, dx * 0.05))}deg)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove) }
  }, [])

  return (
    <div className={`preview ${work ? 'is-on' : ''}`} ref={ref} aria-hidden="true">
      {work && <PixelImage key={work.img} src={sized(work.img, 700)} />}
      <span className="preview__tag mono">● CLIP {two(index + 1)}</span>
    </div>
  )
}

const Work = ({ works }) => {
  const [filter, setFilter] = useState('All')
  const [hover, setHover] = useState(null)
  const [open, setOpen] = useState(null)
  const fine = useMemo(hasFinePointer, [])

  const channels = useMemo(() => {
    const counts = { All: works.length }
    works.forEach((w) => (w.tags || []).forEach((t) => {
      if (t !== 'All') counts[t] = (counts[t] || 0) + 1
    }))
    return Object.entries(counts)
  }, [works])

  const shown = filter === 'All' ? works : works.filter((w) => (w.tags || []).includes(filter))
  const hovered = hover !== null ? shown[hover] : null

  return (
    <section id="work" className="work section">
      <SectionLabel n={2}>Selected Work</SectionLabel>

      <div className="work__head">
        <h2 className="display" data-reveal>
          Things I've <em>built</em><sup className="mono">({two(works.length)})</sup>
        </h2>
        <div className="tuner" role="group" aria-label="Filter projects" data-reveal>
          {channels.map(([name, count]) => (
            <button
              key={name}
              className={filter === name ? 'is-active' : ''}
              onClick={() => { setFilter(name); setOpen(null) }}
              aria-pressed={filter === name}
              data-cursor="TUNE"
            >
              {name}<sup>{count}</sup>
            </button>
          ))}
        </div>
      </div>

      <ol className="projects" onMouseLeave={() => setHover(null)} key={filter}>
        {shown.map((w, i) => {
          const isOpen = open === w.title
          const { live, code } = linksFor(w)
          const tags = (w.tags || []).filter((t) => t !== 'All')
          return (
            <li key={w.title} className={`project ${isOpen ? 'is-open' : ''}`} style={{ '--d': `${i * 60}ms` }}>
              <button
                className="project__row"
                onMouseEnter={() => setHover(i)}
                onClick={() => setOpen(isOpen ? null : w.title)}
                aria-expanded={isOpen}
                data-cursor={isOpen ? 'CLOSE' : 'EXPAND'}
              >
                <span className="project__n mono">{two(i + 1)}</span>
                <span className="project__title">{w.title}</span>
                <span className="project__tags mono">{tags.join(' / ')}</span>
                <span className="project__plus" aria-hidden="true" />
              </button>
              <div className="project__body">
                <div className="project__inner">
                  {w.img && (
                    <div className="project__shot">
                      {isOpen && <PixelImage src={sized(w.img, 900)} />}
                    </div>
                  )}
                  <div className="project__text">
                    <p>{w.description && w.description.trim()}</p>
                    <div className="project__links">
                      {live && <a className="btn btn--solid" href={live} target="_blank" rel="noreferrer" data-cursor="VISIT">Live ↗</a>}
                      {code && <a className="btn" href={code} target="_blank" rel="noreferrer" data-cursor="SOURCE">Source ↗</a>}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      {fine && <Preview work={hovered && hovered.img && hovered.title !== open ? hovered : null} index={hover || 0} />}
    </section>
  )
}

export default Work
