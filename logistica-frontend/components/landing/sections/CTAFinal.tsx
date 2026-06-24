'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { Mail, ArrowRight } from 'lucide-react'

export function CTAFinal() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section id="cta" className="py-24 px-4">
      <m.div
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6, type: 'tween' }}
        className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden p-[1px] will-change-transform">
        <div className="rotating-gradient-border" />
        <div className="relative rounded-3xl p-12 md:p-16 text-center bg-brand-bg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 font-source-sans bg-orange-500/12 border border-orange-500/25 text-orange-500">
            Demo gratuita · Sin tarjeta de crédito
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-lexend">
            Empieza a mover más hoy
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto text-white/55 font-source-sans">
            Solicita tu demo personalizada y ve LogiTrack en acción con datos de tu propia operación.
          </p>

          {submitted ? (
            <m.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'tween' }}
              className="flex items-center justify-center gap-3 text-lg font-medium text-white font-source-sans">
              <span className="w-3 h-3 rounded-full bg-green-400" />
              ¡Recibido! Te contactaremos en menos de 24h.
            </m.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 outline-none bg-white/6 border border-white/10 focus:border-blue-600/50 transition-colors duration-200 font-source-sans"
                />
              </div>
              <button
                type="submit"
                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer bg-orange-500 hover:opacity-90 transition-opacity duration-200 font-source-sans">
                Solicitar demo <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-white/30 font-source-sans">
            Sin compromisos · Configuración en 24h · Soporte incluido
          </p>
        </div>
      </m.div>
    </section>
  )
}
