import { MapPin, BarChart3, Route, Plug, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const NAV_LINKS = [
  { label: 'Características', href: '#features' },
  { label: 'Cómo funciona', href: '#how-it-works' },
  { label: 'Testimonios', href: '#testimonials' },
]

export const LOGOS = [
  'LATAM Cargo', 'Grupo Éxito', 'Falabella', 'MercadoLibre',
  'DHL Express', 'Rappi', 'FEMSA', 'Cencosud',
]

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
  featured: boolean
  stat?: string
}

export const FEATURES: Feature[] = [
  {
    icon: MapPin,
    title: 'Tracking en tiempo real',
    description: 'Monitorea tu flota y envíos en un mapa interactivo. Alertas instantáneas ante desvíos o demoras.',
    featured: true,
    stat: '+340 vehículos en línea',
  },
  {
    icon: BarChart3,
    title: 'Dashboard de operaciones',
    description: 'KPIs, alertas y reportes automáticos para decisiones ágiles en tiempo real.',
    featured: false,
  },
  {
    icon: Route,
    title: 'Rutas optimizadas con IA',
    description: 'Reduce hasta un 23% el costo de combustible con rutas calculadas por inteligencia artificial.',
    featured: false,
  },
  {
    icon: Plug,
    title: 'Integración ERP & SAP',
    description: 'Conecta con tus sistemas de facturación electrónica y ERP sin fricción.',
    featured: false,
  },
  {
    icon: Smartphone,
    title: 'App móvil para conductores',
    description: 'Firma digital y evidencia fotográfica desde cualquier dispositivo Android o iOS.',
    featured: false,
  },
]

export const STEPS = [
  {
    number: '01',
    title: 'Conecta tu flota',
    description: 'Instala nuestro GPS tracker o integra con tu hardware existente. Configuración en menos de 24h.',
  },
  {
    number: '02',
    title: 'Configura tus rutas',
    description: 'Define zonas, puntos de entrega y restricciones. La IA optimiza automáticamente cada recorrido.',
  },
  {
    number: '03',
    title: 'Monitorea y actúa',
    description: 'Panel en tiempo real, alertas proactivas y reportes automáticos para todo tu equipo.',
  },
  {
    number: '04',
    title: 'Escala sin límites',
    description: 'Desde 10 hasta 10.000 vehículos. La plataforma crece contigo sin configuración adicional.',
  },
]

export const TESTIMONIALS = [
  {
    name: 'Carlos Mendoza',
    role: 'Gerente de Operaciones',
    company: 'LogiPrime Colombia',
    rating: 5,
    text: 'Redujimos los tiempos de entrega un 35% en 3 meses. El tracking en tiempo real cambió cómo gestionamos toda la flota.',
  },
  {
    name: 'Ana Gutiérrez',
    role: 'Directora de Supply Chain',
    company: 'Retail Express Perú',
    rating: 5,
    text: 'La integración con SAP fue sorprendentemente rápida. Ahora tenemos visibilidad total desde el almacén hasta el cliente final.',
  },
  {
    name: 'Roberto Vega',
    role: 'VP de Logística',
    company: 'Distribuidora Norte',
    rating: 5,
    text: 'El ROI fue visible desde el primer mes. Las rutas optimizadas por IA nos ahorraron 22% en combustible mensualmente.',
  },
  {
    name: 'María Fernández',
    role: 'Jefa de Flota',
    company: 'TransAndina SA',
    rating: 5,
    text: 'Los conductores adoptaron la app en días. La firma digital eliminó todo el papeleo y los reclamos bajaron a cero.',
  },
  {
    name: 'Juan Pablo Torres',
    role: 'CEO',
    company: 'QuickDeliver Chile',
    rating: 5,
    text: 'Pasamos de gestionar 50 a 300 rutas diarias sin aumentar personal. La plataforma escala de forma increíble.',
  },
  {
    name: 'Sofía Ramírez',
    role: 'Gerente de Distribución',
    company: 'FreshLogistics MX',
    rating: 5,
    text: 'Las alertas proactivas nos salvaron de múltiples incidentes críticos. El soporte técnico es de primer nivel.',
  },
]

export const FOOTER_LINKS: Record<string, string[]> = {
  Producto: ['Características', 'Integraciones', 'Precios', 'Changelog', 'Seguridad'],
  Empresa: ['Nosotros', 'Blog', 'Casos de éxito', 'Prensa', 'Carreras'],
  Recursos: ['Documentación', 'API Reference', 'Comunidad', 'Webinars', 'Status'],
  Legal: ['Privacidad', 'Términos de uso', 'Cookies', 'GDPR', 'Compliance'],
}

