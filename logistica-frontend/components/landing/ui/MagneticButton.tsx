'use client'

import { useRef } from 'react'
import { m, useMotionValue, useSpring } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function MagneticButton({ children, className, style }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 20 })
  const sy = useSpring(y, { stiffness: 200, damping: 20 })

  return (
    <m.button
      ref={ref}
      style={{ x: sx, y: sy, ...style }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.set((e.clientX - r.left - r.width / 2) * 0.3)
        y.set((e.clientY - r.top - r.height / 2) * 0.3)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className={className}
    >
      {children}
    </m.button>
  )
}
