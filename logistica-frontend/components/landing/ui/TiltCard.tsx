'use client'

import { useRef } from 'react'
import { m, useMotionValue, useSpring } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
}

export function TiltCard({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 150, damping: 20 })
  const sry = useSpring(ry, { stiffness: 150, damping: 20 })

  return (
    <m.div
      ref={ref}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        rx.set(((e.clientY - r.top - r.height / 2) / r.height) * -5)
        ry.set(((e.clientX - r.left - r.width / 2) / r.width) * 5)
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0) }}
      className={className}
    >
      {children}
    </m.div>
  )
}
