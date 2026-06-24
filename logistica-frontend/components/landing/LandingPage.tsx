'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { ParticleCanvas } from '@/components/landing/effects/ParticleCanvas'
import { Nav } from '@/components/landing/sections/Nav'
import { Hero } from '@/components/landing/sections/Hero'
import { LogosBar } from '@/components/landing/sections/LogosBar'
import { Features } from '@/components/landing/sections/Features'
import { HowItWorks } from '@/components/landing/sections/HowItWorks'
import { Testimonials } from '@/components/landing/sections/Testimonials'
import { CTAFinal } from '@/components/landing/sections/CTAFinal'
import { Footer } from '@/components/landing/sections/Footer'

export default function LandingPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="bg-brand-bg min-h-screen">
        <ParticleCanvas />

        {/* Mesh gradients */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)
          `,
        }} />

        {/* Grid lines */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10">
          <Nav />
          <Hero />
          <LogosBar />
          <Features />
          <HowItWorks />
          <Testimonials />
          <CTAFinal />
          <Footer />
        </div>
      </div>
    </LazyMotion>
  )
}
