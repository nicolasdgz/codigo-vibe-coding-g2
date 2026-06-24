'use client'

import { m } from 'framer-motion'
import { STEPS } from '@/components/landing/data/landing.data'

const viewportOpts = { once: true, margin: '-100px' } as const

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 max-w-5xl mx-auto">
      <m.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOpts} transition={{ duration: 0.6, type: 'tween' }}
        className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-lexend">
          Cómo funciona
        </h2>
        <p className="text-lg text-white/50 font-source-sans">
          De la instalación a la operación en menos de 48 horas.
        </p>
      </m.div>

      <div className="flex flex-col gap-6">
        {STEPS.map((step, i) => (
          <m.div key={step.number}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOpts}
            transition={{ duration: 0.6, delay: i * 0.1, type: 'tween' }}
            className={`flex items-center gap-6 will-change-transform ${i % 2 === 1 ? 'flex-row-reverse' : ''}`}>
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold font-lexend bg-blue-600/10 border border-blue-600/20 text-blue-600">
              {step.number}
            </div>
            <div className="flex-1 rounded-2xl p-6 glass">
              <h3 className="text-xl font-bold text-white mb-2 font-lexend">{step.title}</h3>
              <p className="leading-relaxed text-white/55 font-source-sans">{step.description}</p>
            </div>
          </m.div>
        ))}
      </div>
    </section>
  )
}
