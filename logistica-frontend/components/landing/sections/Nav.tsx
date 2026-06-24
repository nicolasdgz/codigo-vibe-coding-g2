'use client'

import { useEffect, useState } from 'react'
import { m, useScroll, AnimatePresence } from 'framer-motion'
import { Truck, Menu, X } from 'lucide-react'
import { NAV_LINKS } from '@/components/landing/data/landing.data'

export function Nav() {
  const [visible, setVisible] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => scrollY.on('change', (v) => setVisible(v > 50)), [scrollY])

  return (
    <AnimatePresence>
      {visible && (
        <m.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-white/8 bg-[rgba(6,13,31,0.85)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg font-lexend">LogiTrack</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <a key={l.label} href={l.href}
                  className="text-sm text-white/60 hover:text-white transition-colors duration-200 cursor-pointer font-source-sans">
                  {l.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a href="/login"
                className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200 cursor-pointer font-source-sans">
                Iniciar sesión
              </a>
              <a href="#cta"
                className="text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer bg-orange-500 text-white hover:opacity-90 transition-opacity duration-200 font-source-sans">
                Solicitar demo
              </a>
            </div>

            <button className="md:hidden text-white cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden overflow-hidden border-t border-white/8">
                <div className="px-6 py-4 flex flex-col gap-4">
                  {NAV_LINKS.map((l) => (
                    <a key={l.label} href={l.href}
                      className="text-sm text-white/60 cursor-pointer font-source-sans"
                      onClick={() => setMobileOpen(false)}>
                      {l.label}
                    </a>
                  ))}
                  <a href="#cta"
                    className="text-sm font-semibold px-4 py-2 rounded-lg text-center cursor-pointer bg-orange-500 text-white font-source-sans"
                    onClick={() => setMobileOpen(false)}>
                    Solicitar demo
                  </a>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.nav>
      )}
    </AnimatePresence>
  )
}
