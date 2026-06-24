'use client'

import { m } from 'framer-motion'
import { FEATURES } from '@/components/landing/data/landing.data'

const viewportOpts = { once: true, margin: '-100px' } as const
const tweenFast = { type: 'tween' as const, duration: 0.6 }

export function Features() {
  const featured = FEATURES.filter((f) => f.featured)
  const regular = FEATURES.filter((f) => !f.featured)

  return (
    <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
      <m.div
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOpts} transition={tweenFast}
        className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4 font-source-sans bg-blue-600/12 border border-blue-600/25 text-blue-500">
          Plataforma completa
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-lexend">
          Todo lo que necesitas
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-white/50 font-source-sans">
          Una plataforma unificada para gestionar cada aspecto de tu operación logística.
        </p>
      </m.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured.map((f, i) => {
          const Icon = f.icon
          return (
            <m.div key={f.title}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOpts} transition={{ ...tweenFast, delay: i * 0.1 }}
              className="md:col-span-2 rounded-2xl p-8 relative overflow-hidden cursor-pointer group glass-blue will-change-transform">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-blue-600/15 border border-blue-600/25">
                  <Icon className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 font-lexend">{f.title}</h3>
                <p className="mb-6 text-base leading-relaxed text-white/55 font-source-sans">{f.description}</p>
                {f.stat && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium font-source-sans bg-green-500/12 border border-green-500/20 text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {f.stat}
                  </span>
                )}
              </div>
            </m.div>
          )
        })}

        {regular.map((f, i) => {
          const Icon = f.icon
          return (
            <m.div key={f.title}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOpts} transition={{ ...tweenFast, delay: 0.1 + i * 0.1 }}
              className="rounded-2xl p-6 cursor-pointer group relative overflow-hidden glass will-change-transform">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-blue-600/10 border border-blue-600/15">
                  <Icon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 font-lexend">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/50 font-source-sans">{f.description}</p>
              </div>
            </m.div>
          )
        })}
      </div>
    </section>
  )
}
