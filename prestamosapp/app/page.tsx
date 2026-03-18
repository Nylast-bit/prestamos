"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { ClientesContent } from "@/components/clientes-content"
import { PrestamosContent } from "@/components/prestamos-content"
import { PrestatariosContent } from "@/components/prestatarios-content"
import { ConsolidacionContent } from "@/components/consolidacion-content"
import { ConfiguracionContent } from "@/components/configuracion-content"
import { GastoFijoContent } from "@/components/gastofijo-content"
import { SolicitudesContent } from "@/components/solicitudes-content"
import { PagosContent } from "@/components/pago-content"
import { PagosPersonalizadosContent } from "@/components/pagospersonalizados-content"

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!isAuthenticated()) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isMounted || !isAuthenticated()) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent onNavigate={setActiveSection} />
      case "clientes":
        return <ClientesContent />
      case "prestatarios":
        return <PrestatariosContent />
      case "prestamos":
        return <PrestamosContent />
      case "consolidacion":
        return <ConsolidacionContent />
      case "pagos":
        return <PagosContent />
      case "pagospersonalizados":
        return <PagosPersonalizadosContent />

      case "solicitudes":
        return <SolicitudesContent />
      case "gastosfijos":
        return <GastoFijoContent />
      case "configuracion":
        return <ConfiguracionContent />
      default:
        return <DashboardContent onNavigate={setActiveSection} />

    }
  }

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return "Panel de Administración - Préstamos"
      case "clientes":
        return "Gestión de Clientes"
      case "prestatarios":
        return "Gestión de Prestatarios"
      case "prestamos":
        return "Gestión de Préstamos"
      case "consolidacion":
        return "Consolidación de Capital"
      case "pagos":
        return "Gestión de Pagos"
      case "pagospersonalizados":
        return "Gestión de Pagos Personalizados"
      case "gastosfijos":
        return "Gestión de Gastos Fijos"
      case "configuracion":
        return "Configuración"
      default:
        return "Panel de Administración - Préstamos"
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{getSectionTitle()}</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
