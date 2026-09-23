import React, { useEffect, useRef, useState } from 'react'
import { SectionLabel } from './About'
import { sized } from '../lib/content'
import { useInView, prefersReducedMotion } from '../lib/hooks'
import { makeWorld, makeBody, advance } from '../lib/physics'

const HAND_R = 34 // radius of the invisible "hand" that follows the cursor through the pit
const MAX_THROW = 3200

const useSandbox = (stageRef, count, running) => {
  const worldRef = useRef(makeWorld())

  useEffect(() => {
    if (!running || !count) return undefined
    const stage = stageRef.current
    const nodes = [...stage.querySelectorAll('.orb')]
    const world = worldRef.current
    world.W = stage.clientWidth
    world.H = stage.clientHeight
    const { W, H } = world
    const reduced = prefersReducedMotion()
    // Size orbs so they fill roughly a third of the stage, whatever the skill count.
    const base = Math.max(24, Math.min(W < 600 ? 40 : 58, Math.sqrt((W * H * 0.34) / (nodes.length * Math.PI))))

    world.bodies = nodes.map((el, i) => {
      const r = base * (1.18 - (i / nodes.length) * 0.3)
      el.style.width = el.style.height = `${r * 2}px`
      // Too small for a readable label: show the icon alone (names stay in the sr-only list).
      el.classList.toggle('orb--compact', r < 42 && !el.classList.contains('orb--text'))
      const x = r + Math.random() * (W - 2 * r)
      const y = reduced ? H - r - Math.floor(i / 5) * r * 2 : -r - i * 55
      const b = makeBody(el, r, x, y)
      b.vx = (Math.random() - 0.5) * 120
      return b
    })

    let raf = 0
    let last = performance.now()
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(stage)
    const ro = new ResizeObserver(() => { world.W = stage.clientWidth; world.H = stage.clientHeight })
    ro.observe(stage)

    const render = () => {
      world.bodies.forEach((b) => {
        b.el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0) rotate(${b.a}rad)`
      })
    }
    const loop = (now) => {
      const elapsed = Math.min((now - last) / 1000, 0.05)
      last = now
      if (visible) {
        // The hand's velocity decays if the pointer stops moving.
        const hand = world.hand
        if (hand && now - hand.t > 60) { hand.vx *= 0.8; hand.vy *= 0.8 }
        advance(world, elapsed)
        render()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const local = (e) => {
      const rect = stage.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    // Track the pointer as a moving obstacle with a smoothed velocity.
    const onMove = (e) => {
      const p = local(e)
      const now = performance.now()
      const inside = p.x >= 0 && p.y >= 0 && p.x <= world.W && p.y <= world.H
      const held = world.bodies.find((b) => b.held)
      if (!world.hand) world.hand = { x: p.x, y: p.y, vx: 0, vy: 0, r: HAND_R, t: now, active: false }
      const h = world.hand
      const dt = Math.max((now - h.t) / 1000, 1 / 240)
      h.vx = h.vx * 0.5 + ((p.x - h.x) / dt) * 0.5
      h.vy = h.vy * 0.5 + ((p.y - h.y) / dt) * 0.5
      h.x = p.x; h.y = p.y; h.t = now
      h.active = inside && !held
      if (held) { held.tx = p.x; held.ty = Math.min(p.y, world.H - held.r) }
    }
    const onLeave = () => { if (world.hand) world.hand.active = false }

    const onDown = (e) => {
      const el = e.target.closest('.orb')
      if (!el) return
      const b = world.bodies.find((x) => x.el === el)
      const p = local(e)
      b.held = true
      b.tx = p.x; b.ty = p.y
      if (world.hand) world.hand.active = false
      el.classList.add('is-held')
      el.setPointerCapture(e.pointerId)
      e.preventDefault()
    }
    const onUp = () => {
      world.bodies.forEach((b) => {
        if (!b.held) return
        b.held = false
        const h = world.hand
        // Throw with the pointer's recent velocity.
        const vx = h ? h.vx : b.vx
        const vy = h ? h.vy : b.vy
        const s = Math.hypot(vx, vy)
        const k = s > MAX_THROW ? MAX_THROW / s : 1
        b.vx = vx * k; b.vy = vy * k
        b.el.classList.remove('is-held')
      })
    }

    stage.addEventListener('pointerdown', onDown)
    stage.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      stage.removeEventListener('pointerdown', onDown)
      stage.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [stageRef, count, running])

  const shake = () => worldRef.current.bodies.forEach((b) => {
    b.vx += (Math.random() - 0.5) * 1600
    b.vy -= 900 + Math.random() * 900
    b.w += (Math.random() - 0.5) * 20
  })
  const setZeroG = (on) => {
    const world = worldRef.current
    world.zeroG = on
    if (on) world.bodies.forEach((b) => { b.vx += (Math.random() - 0.5) * 200; b.vy -= 150 + Math.random() * 250 })
  }
  return { shake, setZeroG }
}

const Toolbox = ({ skills }) => {
  const [ref, inView] = useInView({ threshold: 0.35 })
  const stageRef = useRef(null)
  const [zeroG, setZero] = useState(false)
  const { shake, setZeroG } = useSandbox(stageRef, skills.length, inView)

  const toggleZero = () => {
    setZeroG(!zeroG)
    setZero(!zeroG)
  }

  return (
    <section id="toolbox" className="toolbox section" ref={ref}>
      <SectionLabel n={3}>Toolbox</SectionLabel>
      <div className="toolbox__head">
        <h2 className="display" data-reveal>The <em>toolbox</em></h2>
        <div className="toolbox__controls" data-reveal>
          <p className="mono">{String(skills.length).padStart(2, '0')} objects detected — push, grab, throw.</p>
          <div>
            <button className="btn" onClick={shake} data-cursor="SHAKE">Shake</button>
            <button className={`btn ${zeroG ? 'btn--solid' : ''}`} onClick={toggleZero} aria-pressed={zeroG} data-cursor="FLOAT">
              Zero-G {zeroG ? 'on' : 'off'}
            </button>
          </div>
        </div>
      </div>

      <ul className="sr-only">
        {skills.map((s) => <li key={s.name}>{s.name}</li>)}
      </ul>

      <div className="stage" ref={stageRef} aria-hidden="true" data-cursor="PUSH">
        {skills.map((s, i) => (
          <div key={s.name} className={`orb ${i === 0 ? 'orb--hot' : ''} ${s.icon ? '' : 'orb--text'}`} data-cursor={s.name.toUpperCase()} title={s.name}>
            {s.icon && <img src={sized(s.icon, 128)} alt="" draggable="false" />}
            <span className="mono">{s.name}</span>
          </div>
        ))}
        <span className="stage__floor mono">FLOOR · Y=0</span>
      </div>
    </section>
  )
}

export default Toolbox
