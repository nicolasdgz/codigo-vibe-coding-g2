'use client'

import { useEffect, useRef } from 'react'

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Skip on small screens — performance budget is limited on mobile
    if (window.innerWidth < 768) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let frame = 0
    const mouse = { x: -9999, y: -9999 }
    const PARTICLE_COUNT = 60
    const CONNECTION_DIST = 120

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resize()

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.5 + 0.5,
    }))

    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onResize = () => { resize() }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    const W = () => window.innerWidth
    const H = () => window.innerHeight

    const animate = () => {
      frame++
      ctx.clearRect(0, 0, W(), H())

      for (const p of particles) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const distSq = dx * dx + dy * dy
        if (distSq < 14400) { // 120^2
          const dist = Math.sqrt(distSq)
          p.vx += (dx / dist) * 0.04
          p.vy += (dy / dist) * 0.04
        }
        p.vx *= 0.99
        p.vy *= 0.99
        p.x = (p.x + p.vx + W()) % W()
        p.y = (p.y + p.vy + H()) % H()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(59,130,246,0.5)'
        ctx.fill()
      }

      // Draw connections every 2 frames to halve the O(n²) cost
      if (frame % 2 === 0) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j]
            const dx = a.x - b.x, dy = a.y - b.y
            const distSq = dx * dx + dy * dy
            if (distSq < CONNECTION_DIST * CONNECTION_DIST) {
              const d = Math.sqrt(distSq)
              ctx.beginPath()
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(b.x, b.y)
              ctx.strokeStyle = `rgba(37,99,235,${0.12 * (1 - d / CONNECTION_DIST)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }
      }

      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />
}
