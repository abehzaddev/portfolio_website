import React, { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/hooks'

const cache = {}
const load = (src) => {
  if (!cache[src]) {
    cache[src] = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }
  return cache[src]
}

// Draws `src` (cover-fit) and "develops" it from coarse pixel blocks to sharp.
const PixelImage = ({ src, className = '', duration = 650 }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (!src) return undefined
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const off = document.createElement('canvas')
    const octx = off.getContext('2d')
    let raf = 0
    let cancelled = false

    load(src).then((img) => {
      if (cancelled) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const W = Math.max(1, Math.round(rect.width * dpr))
      const H = Math.max(1, Math.round(rect.height * dpr))
      canvas.width = W
      canvas.height = H

      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
      const dw = img.naturalWidth * s
      const dh = img.naturalHeight * s
      const dx = (W - dw) / 2
      const dy = (H - dh) / 2

      const draw = (block) => {
        ctx.clearRect(0, 0, W, H)
        if (block <= 1) {
          ctx.imageSmoothingEnabled = true
          ctx.drawImage(img, dx, dy, dw, dh)
          return
        }
        const w = Math.max(1, Math.ceil(W / block))
        const h = Math.max(1, Math.ceil(H / block))
        off.width = w
        off.height = h
        if (!off.width || !off.height) return
        octx.drawImage(img, dx / block, dy / block, dw / block, dh / block)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(off, 0, 0, w, h, 0, 0, w * block, h * block)
      }

      if (prefersReducedMotion()) { draw(1); return }
      const start = performance.now()
      const steps = [64, 40, 24, 14, 8, 4, 2, 1]
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration)
        draw(steps[Math.min(steps.length - 1, Math.floor(p * steps.length))] * dpr)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }).catch(() => {})

    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [src, duration])

  return <canvas ref={ref} className={`pixel ${className}`} aria-hidden="true" />
}

export default PixelImage
