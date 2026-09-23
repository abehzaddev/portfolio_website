import React, { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/hooks'

const RAMP = ' .,:;i1tfLCG08@'
const GLITCH = '01<>/\\{}[]#*+=-'
const rand = (s) => s[(Math.random() * s.length) | 0]

// Renders an image as live ASCII on a canvas. `face` is the subject's bounding box
// as fractions of the source image, used for the tracking overlay.
const AsciiPortrait = ({ src, face, label = 'SUBJECT', color = '#ecebe3', accent = '#ff4d2e' }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduced = prefersReducedMotion()
    const img = new Image()
    img.src = src

    let W = 0, H = 0, dpr = 1
    let cols = 0, rows = 0, cw = 0, ch = 0, fontSize = 10
    let cells = [] // ramp index per cell, -1 = empty
    let seeds = [] // per-cell reveal threshold
    let imgBox = { x: 0, y: 0, w: 0, h: 0 }
    let raf = 0, visible = true, last = 0
    const start = performance.now()
    const mouse = { x: -9999, y: -9999 }
    const jitter = { x: 0, y: 0, conf: 0.98, next: 0 }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      W = rect.width
      H = rect.height
      if (!W || !H || !img.complete || !img.naturalWidth) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      fontSize = Math.max(6, Math.min(11, W / 100))
      cw = fontSize * 0.6
      ch = fontSize
      cols = Math.ceil(W / cw)
      rows = Math.ceil(H / ch)

      // Fit the image (contain), anchored to the bottom.
      const s = Math.min(W / img.naturalWidth, H / img.naturalHeight)
      const dw = img.naturalWidth * s
      const dh = img.naturalHeight * s
      imgBox = { x: (W - dw) / 2, y: H - dh, w: dw, h: dh }

      const off = document.createElement('canvas')
      off.width = cols
      off.height = rows
      const octx = off.getContext('2d')
      octx.drawImage(img, imgBox.x / cw, imgBox.y / ch, dw / cw, dh / ch)
      const px = octx.getImageData(0, 0, cols, rows).data

      const n = cols * rows
      const lums = new Float32Array(n)
      const opaque = []
      for (let i = 0; i < n; i++) {
        lums[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255
        if (px[i * 4 + 3] > 50) opaque.push(lums[i])
      }
      // Stretch contrast between the 3rd and 97th percentile so the ramp is fully used.
      opaque.sort((a, b) => a - b)
      const lo = opaque[Math.floor(opaque.length * 0.03)] || 0
      const hi = opaque[Math.floor(opaque.length * 0.97)] || 1

      cells = new Array(n)
      seeds = new Array(n)
      for (let i = 0; i < n; i++) {
        const a = px[i * 4 + 3] / 255
        const v = Math.max(0, Math.min(1, (lums[i] - lo) / (hi - lo || 1))) * a
        cells[i] = a < 0.2 ? -1 : Math.min(RAMP.length - 1, Math.round(v * (RAMP.length - 1)))
        seeds[i] = Math.random() * 0.75 + (Math.floor(i / cols) / rows) * 0.25
      }
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`
      ctx.textBaseline = 'top'
    }

    const drawBox = (t) => {
      if (!face) return
      if (t > jitter.next) {
        jitter.x = (Math.random() - 0.5) * 4
        jitter.y = (Math.random() - 0.5) * 4
        jitter.conf = 0.96 + Math.random() * 0.03
        jitter.next = t + 180 + Math.random() * 400
      }
      const x = imgBox.x + face.x0 * imgBox.w + jitter.x
      const y = imgBox.y + face.y0 * imgBox.h + jitter.y
      const w = (face.x1 - face.x0) * imgBox.w
      const h = (face.y1 - face.y0) * imgBox.h
      const k = Math.min(w, h) * 0.14

      ctx.strokeStyle = accent
      ctx.lineWidth = 1.5
      ctx.beginPath()
      // Corner brackets
      ;[[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        ctx.moveTo(cx, cy + k * sy)
        ctx.lineTo(cx, cy)
        ctx.lineTo(cx + k * sx, cy)
      })
      ctx.stroke()
      ctx.globalAlpha = 0.25
      ctx.strokeRect(x, y, w, h)
      ctx.globalAlpha = 1

      const text = `${label} · ${jitter.conf.toFixed(2)}`
      ctx.font = `500 ${Math.max(10, fontSize + 1)}px "JetBrains Mono", monospace`
      const tw = ctx.measureText(text).width
      ctx.fillStyle = accent
      ctx.fillRect(x - 0.75, y - 18, tw + 12, 18)
      ctx.fillStyle = '#0c0c0b'
      ctx.fillText(text, x + 6, y - 14)
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`
    }

    const render = (now) => {
      raf = requestAnimationFrame(render)
      if (!visible || !cols) return
      if (now - last < 33) return // ~30fps is plenty for text
      last = now

      const t = now - start
      const p = reduced ? 2 : Math.min(1.2, t / 1800)
      const band = ((t / 7000) % 1) * (rows + 30) - 15
      const R = Math.max(60, W * 0.09)
      const R2 = R * R
      const hot = []

      ctx.clearRect(0, 0, W, H)
      for (let r = 0; r < rows; r++) {
        let line = ''
        const y = r * ch
        const dy = y + ch / 2 - mouse.y
        const rowNear = Math.abs(dy) < R
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          const v = cells[i]
          if (v === -1) { line += ' '; continue }
          const seed = seeds[i]
          if (seed > p) {
            line += seed < p + 0.12 ? rand(GLITCH) : ' '
            continue
          }
          if (rowNear) {
            const dx = c * cw + cw / 2 - mouse.x
            // Inside the lens: show the pixel's real intensity (0–9), the numbers a model sees.
            if (dx * dx + dy * dy < R2) {
              hot.push(c, y, v)
              line += ' '
              continue
            }
          }
          line += RAMP[v]
        }
        const inBand = Math.abs(r - band) < 6
        ctx.fillStyle = color
        ctx.globalAlpha = inBand ? 1 : 0.72
        ctx.fillText(line, 0, y)
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = accent
      const top = RAMP.length - 1
      for (let j = 0; j < hot.length; j += 3) ctx.fillText(String(Math.round((hot[j + 2] / top) * 9)), hot[j] * cw, hot[j + 1])

      if (p >= 1) drawBox(t)
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }

    const ro = new ResizeObserver(layout)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    img.onload = () => {
      layout()
      ro.observe(canvas)
      io.observe(canvas)
      raf = requestAnimationFrame(render)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    // Re-layout once the mono font arrives so glyph metrics are right.
    if (document.fonts) document.fonts.ready.then(layout)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [src, face, label, color, accent])

  return <canvas ref={canvasRef} className="ascii" aria-hidden="true" />
}

export default AsciiPortrait
