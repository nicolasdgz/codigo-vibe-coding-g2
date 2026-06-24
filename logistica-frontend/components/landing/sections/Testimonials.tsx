'use client'

import { m } from 'framer-motion'
import { Star } from 'lucide-react'
import { TESTIMONIALS } from '@/components/landing/data/landing.data'
import { TiltCard } from '@/components/landing/ui/TiltCard'

const viewportOpts = { once: true, margin: '-100px' } as const

export function Testimonials() {
  const cols = [
    TESTIMONIALS.filter((_, i) => i % 3 === 0),
    TESTIMONIALS.filter((_, i) => i % 3 === 1),
    TESTIMONIALS.filter((_, i) => i % 3 === 2),
  ]

  return (
    <section id="testimonials" className="py-24 px-4 max-w-7xl mx-auto">
      <m.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOpts} transition={{ duration: 0.6, type: 'tween' }}
        className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-lexend">
          Lo que dicen nuestros clientes
        </h2>
        <p className="text-lg text-white/50 font-source-sans">
          +500 empresas en 12 países ya optimizaron su logística.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-6">
            {col.map((t, ti) => (
              <m.div key={t.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOpts}
                transition={{ duration: 0.5, delay: ci * 0.1 + ti * 0.05, type: 'tween' }}>
                <TiltCard>
                  <div className="rounded-2xl p-6 cursor-pointer glass">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current text-orange-500" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-6 text-white/70 font-source-sans">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div>
                      <div className="font-semibold text-sm text-white font-lexend">{t.name}</div>
                      <div className="text-xs mt-0.5 text-white/40 font-source-sans">
                        {t.role} · {t.company}
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </m.div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
