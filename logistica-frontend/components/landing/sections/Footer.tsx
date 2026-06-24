'use client'

import { Truck, Globe, Share2, Rss, ExternalLink } from 'lucide-react'
import { FOOTER_LINKS } from '@/components/landing/data/landing.data'

const SOCIAL = [Globe, Share2, Rss, ExternalLink]

export function Footer() {
  return (
    <footer className="py-16 px-4 border-t border-white/6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white font-lexend">LogiTrack</span>
            </div>
            <p className="text-sm mb-6 leading-relaxed text-white/35 font-source-sans">
              Logística inteligente para empresas que no se detienen.
            </p>
            <div className="flex gap-2">
              {SOCIAL.map((Icon, i) => (
                <button key={i}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer bg-white/5 border border-white/8 hover:bg-blue-600/20 hover:border-blue-600/40 transition-all duration-200">
                  <Icon className="w-4 h-4 text-white/50" />
                </button>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4 font-lexend">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#"
                      className="text-sm cursor-pointer text-white/35 hover:text-white/80 transition-colors duration-200 font-source-sans">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/6 text-xs text-white/25 font-source-sans">
          <p>© 2026 LogiTrack. Todos los derechos reservados.</p>
          <p>Hecho con amor para LATAM</p>
        </div>
      </div>
    </footer>
  )
}
