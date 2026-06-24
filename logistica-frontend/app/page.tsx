import type { Metadata } from 'next'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'LogiTrack - Sistema de Gestión Logística',
  description: 'Mueve más, gestiona menos. Logística inteligente para empresas que no se detienen.',
}

export default function Home() {
  return <LandingPage />
}
