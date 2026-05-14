import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Play, 
  Star, 
  Settings, 
  Shield, 
  Zap, 
  Package, 
  BarChart, 
  PenTool, 
  CheckCircle2,
  Users,
  DollarSign,
  PieChart,
  Calendar,
  Building2
} from "lucide-react";

// ==========================================
// DATA
// ==========================================
const featuresData = [
  { icon: Users, title: "Gestión de Clientes", desc: "Mantén un registro detallado de tus prestatarios y su historial crediticio." },
  { icon: DollarSign, title: "Control de Préstamos", desc: "Administra préstamos activos, cuotas, intereses y moras de forma automática." },
  { icon: Shield, title: "Seguridad y Confianza", desc: "Tus datos financieros protegidos con los más altos estándares de encriptación." },
  { icon: Zap, title: "Pagos y Cobros Rápidos", desc: "Registra pagos y genera comprobantes al instante para tus clientes." },
  { icon: Calendar, title: "Pagos Personalizados", desc: "Flexibilidad total para crear planes de pago adaptados a cada cliente." },
  { icon: PieChart, title: "Consolidación de Capital", desc: "Análisis financiero detallado de ingresos, egresos y proyecciones de ganancias." },
];

// ==========================================
// COMPONENTS
// ==========================================

function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-50 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#384b92] text-[#dbeafe]">
          <Building2 className="size-5" />
        </div>
        <span className="text-xl font-bold text-[#384b92]">CreditWay</span>
      </div>
      <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
        <Link href="#features" className="hover:text-[#384b92] transition-colors">Características</Link>
        <Link href="#pricing" className="hover:text-[#384b92] transition-colors">Precios</Link>
      </nav>
      <div className="flex gap-4">
        <Button asChild variant="outline" className="border-[#384b92] text-[#384b92] hover:bg-[#384b92]/10 rounded-full">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl">
        El Futuro de los Préstamos con la <span className="text-[#384b92]">Mejor Tecnología</span>
      </h1>
      <p className="mt-6 text-slate-600 max-w-2xl text-lg">
        Herramientas expertas para elevar tu negocio financiero. Llevemos tu capital más lejos.
      </p>

      <div className="flex items-center gap-4 mt-8">
        <Button asChild className="bg-[#384b92] hover:bg-[#384b92]/90 text-white rounded-full px-8">
          <Link href="/login">Comenzar Gratis</Link>
        </Button>
        <Button variant="outline" className="rounded-full px-8 gap-2 border-[#384b92]/20 text-[#384b92]">
          <Play size={16} /> Ver Demo
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <div className="flex text-yellow-400">
           {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
        </div>
        <span className="text-sm text-slate-500">4.9/5 de más de 1,000 prestamistas</span>
      </div>

      {/* Hero Grid Asimétrico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-16 w-full h-auto md:h-[300px]">
        <div className="bg-slate-200 rounded-3xl overflow-hidden relative min-h-[200px] md:min-h-0 flex items-center justify-center p-6">
           <PieChart className="text-slate-400 size-24 opacity-50" />
        </div>
        <div className="bg-[#384b92] rounded-3xl p-6 text-white flex flex-col justify-center min-h-[200px] md:min-h-0">
          <h3 className="text-4xl font-bold">+500</h3>
          <p className="text-sm text-blue-200 mt-2">Prestamistas Activos</p>
        </div>
        <div className="bg-white border rounded-3xl p-6 flex flex-col justify-center min-h-[200px] md:min-h-0">
           <h3 className="text-2xl font-bold text-slate-900">+10M</h3>
           <p className="text-sm text-slate-500">Capital Gestionado</p>
        </div>
        <div className="bg-[#dbeafe] rounded-3xl p-6 flex flex-col justify-center min-h-[200px] md:min-h-0">
           <h3 className="text-3xl font-bold text-[#384b92]">100%</h3>
           <p className="text-sm text-[#384b92]">Control de tus finanzas</p>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-[#384b92] py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Servicios Financieros<br/>Eficientes e Integrados</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuresData.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="bg-[#29386d] border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition-colors cursor-pointer group">
                <div className="mb-12 flex justify-between items-start text-blue-200 group-hover:text-white transition-colors">
                  <Icon size={24} />
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-blue-100/70">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-900 py-24 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Planes a Medida para la<br/>Escala de tu Negocio</h2>
          <p className="text-slate-400">Precios flexibles para cualquier tamaño de cartera</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Starter Plan */}
          <div className="bg-slate-800 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-medium text-white mb-2">Starter</h3>
            <p className="text-sm text-slate-400 mb-6">Este paquete ofrece las funciones básicas que necesitas para empezar.</p>
            <div className="text-4xl font-bold text-white mb-8">$39 <span className="text-sm font-normal text-slate-500">/ mes</span></div>
            <Button asChild variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent mb-8">
              <Link href="/login">Elegir Plan</Link>
            </Button>
            <ul className="space-y-4">
              {["Hasta 500 préstamos activos", "Soporte técnico 24/7", "Acceso al panel de administración", "Generación de recibos PDF"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-[#60a5fa]" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-slate-800 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-medium text-white mb-2">Enterprise</h3>
            <p className="text-sm text-slate-400 mb-6">Este paquete proporciona características avanzadas para escalar.</p>
            <div className="text-4xl font-bold text-white mb-8">$99 <span className="text-sm font-normal text-slate-500">/ mes</span></div>
            <Button asChild variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10 bg-transparent mb-8">
              <Link href="/login">Elegir Plan</Link>
            </Button>
            <ul className="space-y-4">
              {["Préstamos y prestatarios ilimitados", "Múltiples usuarios y roles (Cajeros)", "Consolidación de capital avanzada", "Reportes de proyecciones"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-[#60a5fa]" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Professional Highlight */}
        <div className="mt-8 bg-[#29386d] border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
           <div>
              <h3 className="text-xl font-medium text-white mb-2">Profesional</h3>
              <p className="text-sm text-blue-100/80 max-w-md">Diseñado para una mayor flexibilidad, este módulo ofrece herramientas avanzadas para adaptarse a tus necesidades operativas.</p>
           </div>
           <Button asChild className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#384b92] rounded-full px-8 whitespace-nowrap">
              <Link href="/login">Contactar Ventas</Link>
           </Button>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// MAIN PAGE EXPORT
// ==========================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        
        {/* Call To Action Final */}
        <section className="bg-[#384b92] py-24 text-center px-4">
           <h2 className="text-3xl font-bold text-white mb-4">Lleva tu Negocio al Siguiente Nivel</h2>
           <p className="text-blue-100/80 max-w-xl mx-auto mb-8">
             Acelera el crecimiento de tu cartera con nuestra tecnología. Reduce la morosidad y optimiza tus cobros. ¡Obtén una oferta especial ahora!
           </p>
           <Button asChild className="bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#384b92] font-medium px-8 py-6 rounded-full text-lg">
              <Link href="/login">Trabaja con Nosotros</Link>
           </Button>
        </section>
      </main>
      
      <footer className="bg-slate-950 py-8 text-center text-slate-500 text-sm border-t border-white/5">
        <p>© {new Date().getFullYear()} CreditWay Platform. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
