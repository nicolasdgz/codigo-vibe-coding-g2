'use client'

import { LOGOS } from '@/components/landing/data/landing.data'

export function LogosBar() {
  return (
    <section className="py-16 overflow-hidden">
      <p className="text-center text-xs font-medium tracking-widest uppercase mb-8 text-white/25 font-source-sans">
        Empresas líderes de LATAM confían en LogiTrack
      </p>
      <div className="relative">
        <div className="flex gap-16 items-center landing-marquee">
          {[...LOGOS, ...LOGOS].map((logo, i) => (
            <span key={i} className="flex-shrink-0 text-sm font-bold tracking-widest uppercase text-white/20 font-lexend">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
