"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardContent } from "@/components/dashboard-content"
import { ClientesContent } from "@/components/clientes-content"
import { PrestamosContent } from "@/components/prestamos-content"
import { PrestatariosContent } from "@/components/prestatarios-content"
import { ConsolidacionContent } from "@/components/consolidacion-content"
import { ConfiguracionContent } from "@/components/configuracion-content"
import { GastoFijoContent } from "@/components/gastofijo-content"

export default function Page() {
  const [activeSection, setActiveSection] = useState("dashboard")

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent />
      case "clientes":
        return <ClientesContent />
      case "prestatarios":
        return <PrestatariosContent />
      case "prestamos":
        return <PrestamosContent />
      case "consolidacion":
        return <ConsolidacionContent />
      case "gastosfijos":
        return <GastoFijoContent />
      case "configuracion":
        return <ConfiguracionContent />
      default:
        return <DashboardContent />
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
