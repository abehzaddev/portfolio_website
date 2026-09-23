// Small 2D rigid-circle engine for the Toolbox ball pit.
// Sequential impulses with friction + rolling, fixed timestep, units in px and seconds.

const STEP = 1 / 240
const ITERATIONS = 8
const SLOP = 0.5 // px of allowed overlap before positional correction
const BOUNCE_MIN = 140 // px/s: slower impacts don't bounce, so resting stacks stay still
const SPEC = 16 // px: speculative margin, so near-touching bodies are solved before they overlap

export const makeWorld = () => ({
  bodies: [],
  gravity: 3800,
  zeroG: false,
  W: 0,
  H: 0,
  hand: null, // { x, y, vx, vy, r, active }
  acc: 0,
})

export const makeBody = (el, r, x, y) => {
  const m = r * r * 0.01
  return {
    el, r, x, y, vx: 0, vy: 0, a: 0, w: 0,
    m, im: 1 / m, ii: 1 / (0.4 * m * r * r), // solid sphere inertia
    held: false, tx: 0, ty: 0,
  }
}

const STATIC = { vx: 0, vy: 0, w: 0, r: 0, im: 0, ii: 0 }

// Contact between a (dynamic) and b (dynamic, static or the hand); n points a -> b.
const contact = (a, b, nx, ny, pen, e, mu, kind) => {
  const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
  const ima = a.held ? 0 : a.im
  const imb = b.held ? 0 : b.im
  const iia = a.held ? 0 : a.ii
  const iib = b.held ? 0 : b.ii
  const kn = ima + imb
  const kt = ima + imb + a.r * a.r * iia + (b.r || 0) * (b.r || 0) * iib
  return {
    a, b, nx, ny, pen, mu, kind, ima, imb, iia, iib,
    kn, kt, jn: 0, jt: 0,
    // Bounce only on a real impact that lands within this step.
    target: -rvn > BOUNCE_MIN && (pen >= 0 || -rvn * STEP > -pen) ? -e * rvn : 0,
  }
}

const solve = (c) => {
  const { a, b, nx, ny } = c
  if (!c.kn) return
  // Normal
  let vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
  // A gap (pen < 0) may close this step but not overshoot: speculative contact.
  let target = c.pen < 0 ? Math.max(c.target, c.pen / STEP) : c.target
  if (c.kind === 'hand') target = Math.max(target, Math.min(c.pen, 40) * 18) // soft push-out
  let dj = (target - vn) / c.kn
  const jn = Math.max(c.jn + dj, 0)
  dj = jn - c.jn
  c.jn = jn
  a.vx -= dj * nx * c.ima; a.vy -= dj * ny * c.ima
  b.vx += dj * nx * c.imb; b.vy += dj * ny * c.imb

  // Friction along the tangent, including spin at the contact point
  if (!c.mu) return
  const tx = -ny
  const ty = nx
  const vt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - (b.w || 0) * (b.r || 0) - a.w * a.r
  let djt = -vt / c.kt
  const max = c.mu * c.jn
  const jt = Math.max(-max, Math.min(max, c.jt + djt))
  djt = jt - c.jt
  c.jt = jt
  a.vx -= djt * tx * c.ima; a.vy -= djt * ty * c.ima
  b.vx += djt * tx * c.imb; b.vy += djt * ty * c.imb
  a.w -= djt * a.r * c.iia
  if (b.ii) b.w -= djt * b.r * c.iib
}

const collect = (world) => {
  const { bodies, W, H, hand, zeroG } = world
  const out = []
  const e = zeroG ? 0.75 : 0.45
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i]
    // Walls: floor, sides, and a ceiling only when floating
    if (a.y + a.r > H - SPEC) out.push(contact(a, STATIC, 0, 1, a.y + a.r - H, zeroG ? 0.7 : 0.38, 0.6, 'wall'))
    if (a.x - a.r < SPEC) out.push(contact(a, STATIC, -1, 0, a.r - a.x, 0.4, 0.05, 'wall'))
    if (a.x + a.r > W - SPEC) out.push(contact(a, STATIC, 1, 0, a.x + a.r - W, 0.4, 0.05, 'wall'))
    if (zeroG && a.y - a.r < SPEC) out.push(contact(a, STATIC, 0, -1, a.r - a.y, 0.7, 0.3, 'wall'))

    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const min = a.r + b.r
      const d2 = dx * dx + dy * dy
      if (d2 >= (min + SPEC) * (min + SPEC)) continue
      const d = Math.sqrt(d2) || 0.0001
      out.push(contact(a, b, dx / d, dy / d, min - d, e, 0.08, 'ball'))
    }

    if (hand && hand.active && !a.held) {
      const dx = hand.x - a.x
      const dy = hand.y - a.y
      const min = a.r + hand.r
      const d2 = dx * dx + dy * dy
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 0.0001
        out.push(contact(a, { ...hand, w: 0, im: 0, ii: 0 }, dx / d, dy / d, min - d, 0.3, 0.25, 'hand'))
      }
    }
  }
  return out
}

const correct = (world) => {
  const { bodies, W, H, zeroG } = world
  for (let it = 0; it < 2; it++) {
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const min = a.r + b.r
        const d2 = dx * dx + dy * dy
        if (d2 >= min * min) continue
        const d = Math.sqrt(d2) || 0.0001
        const pen = min - d - SLOP
        if (pen <= 0) continue
        const ima = a.held ? 0 : a.im
        const imb = b.held ? 0 : b.im
        if (!(ima + imb)) continue
        const k = (pen * 0.8) / (ima + imb)
        a.x -= (dx / d) * k * ima; a.y -= (dy / d) * k * ima
        b.x += (dx / d) * k * imb; b.y += (dy / d) * k * imb
      }
      if (a.held) continue
      if (a.y + a.r > H) a.y = H - a.r
      if (zeroG && a.y - a.r < 0) a.y = a.r
      if (a.x - a.r < 0) a.x = a.r
      if (a.x + a.r > W) a.x = W - a.r
    }
  }
}

const step = (world, dt) => {
  const { bodies } = world
  const g = world.zeroG ? 0 : world.gravity
  const drag = world.zeroG ? 0.15 : 0.35

  bodies.forEach((b) => {
    if (b.held) {
      // Follow the pointer like it's in your hand; velocity is kept for the throw.
      b.vx = (b.tx - b.x) / Math.max(dt * 6, 1e-3)
      b.vy = (b.ty - b.y) / Math.max(dt * 6, 1e-3)
      b.w *= 0.9
      return
    }
    b.vy += g * dt
    const k = 1 / (1 + drag * dt)
    b.vx *= k; b.vy *= k
    b.w *= 1 / (1 + 0.6 * dt) // rolling resistance
  })

  const contacts = collect(world)
  for (let it = 0; it < ITERATIONS; it++) contacts.forEach(solve)

  bodies.forEach((b) => {
    b.x += b.vx * dt
    b.y += b.vy * dt
    b.a += b.w * dt
  })
  correct(world)
}

// Advance by real elapsed time using fixed substeps.
export const advance = (world, elapsed) => {
  world.acc = Math.min(world.acc + elapsed, 0.1)
  while (world.acc >= STEP) {
    step(world, STEP)
    world.acc -= STEP
  }
}
