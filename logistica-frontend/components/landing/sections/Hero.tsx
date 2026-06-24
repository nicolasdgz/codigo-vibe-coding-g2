'use client'

import { m } from 'framer-motion'
import { ArrowRight, ChevronRight, Clock, Shield, Package, Truck, Star, MapPin } from 'lucide-react'
import { MagneticButton } from '@/components/landing/ui/MagneticButton'

const HEADLINE_WORDS = 'Mueve más, gestiona menos.'.split(' ')

const FLOATING_BADGES = [
  {
    delay: 0,
    side: 'left-[8%] top-1/4',
    className: 'bg-white/4 border-white/8 text-white/80',
    icon: null,
    dot: 'bg-green-400',
    label: '340 vehículos activos',
  },
  {
    delay: 1,
    side: 'right-[8%] top-1/3',
    className: 'bg-orange-500/12 border-orange-500/20 text-orange-500',
    icon: Clock,
    dot: null,
    label: '-23% tiempo entrega',
  },
  {
    delay: 2,
    side: 'left-[10%] bottom-1/3',
    className: 'bg-blue-600/12 border-blue-600/25 text-blue-500',
    icon: Shield,
    dot: null,
    label: '99.9% uptime SLA',
  },
] as const

const SOCIAL_PROOF = [
  { icon: Package, label: '+500 empresas' },
  { icon: Truck, label: '+50.000 rutas/mes' },
  { icon: Star, label: '4.9/5 valoración' },
] as const

const DASHBOARD_KPIS = [
  { label: 'En ruta', value: '247', colorClass: 'text-blue-500' },
  { label: 'Entregados', value: '1.893', colorClass: 'text-green-500' },
  { label: 'Pendientes', value: '54', colorClass: 'text-orange-500' },
  { label: 'Incidentes', value: '3', colorClass: 'text-red-500' },
]

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
      {FLOATING_BADGES.map((b, i) => {
        const Icon = b.icon
        return (
          <m.div key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
            className={`absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium font-source-sans border backdrop-blur-xl ${b.side} ${b.className}`}>
            {b.dot && <div className={`w-2 h-2 rounded-full animate-pulse ${b.dot}`} />}
            {Icon && <Icon className="w-3 h-3" />}
            {b.label}
          </m.div>
        )
      })}

      <m.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'tween' }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 font-source-sans bg-blue-600/12 border border-blue-600/25 text-blue-500">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Logística inteligente para LATAM
      </m.div>

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 max-w-5xl text-white font-lexend">
        {HEADLINE_WORDS.map((word, i) => (
          <m.span key={i}
            initial={{ opacity: 0, y: 60, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: 'easeOut', type: 'tween' }}
            className="inline-block mr-[0.2em] will-change-transform [will-change:filter,transform,opacity]">
            {word}
          </m.span>
        ))}
      </h1>

      <m.p
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, type: 'tween' }}
        className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed text-white/55 font-source-sans">
        Plataforma de gestión logística para empresas que no se detienen. Tracking en tiempo real, rutas optimizadas con IA e integración con tus sistemas actuales.
      </m.p>

      <m.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, type: 'tween' }}
        className="flex flex-col sm:flex-row gap-4 mb-16">
        <MagneticButton className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white cursor-pointer bg-orange-500 font-source-sans">
          Solicitar demo gratuita <ArrowRight className="w-4 h-4" />
        </MagneticButton>
        <MagneticButton className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold cursor-pointer bg-white/6 border border-white/12 text-white font-source-sans">
          Ver en acción <ChevronRight className="w-4 h-4" />
        </MagneticButton>
      </m.div>

      <m.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.1, type: 'tween' }}
        className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40 font-source-sans">
        {SOCIAL_PROOF.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-600" />
            {label}
          </div>
        ))}
      </m.div>

      {/* Glass dashboard preview */}
      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut', type: 'tween' }}
        className="relative mt-20 w-full max-w-4xl mx-auto rounded-2xl overflow-hidden aspect-[16/7] glass-blue will-change-transform"
        style={{ boxShadow: '0 0 80px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {['bg-red-500', 'bg-amber-500', 'bg-green-500'].map((c) => (
                <div key={c} className={`w-3 h-3 rounded-full ${c}`} />
              ))}
            </div>
            <span className="text-xs text-white/30 font-source-sans">LogiTrack · Dashboard</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {DASHBOARD_KPIS.map((k) => (
              <div key={k.label} className="rounded-xl p-3 bg-white/4 border border-white/6">
                <div className={`text-lg font-bold font-lexend ${k.colorClass}`}>{k.value}</div>
                <div className="text-xs mt-0.5 text-white/40 font-source-sans">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-xl flex items-center justify-center relative overflow-hidden bg-blue-600/5 border border-blue-600/10">
            <div className="absolute inset-0 opacity-20" style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(37,99,235,0.6) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(249,115,22,0.4) 0%, transparent 50%)',
            }} />
            <MapPin className="w-8 h-8 opacity-50 text-blue-600" />
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 60%)',
        }} />
      </m.div>
    </section>
  )
}
