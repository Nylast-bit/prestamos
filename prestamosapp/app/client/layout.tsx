"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!isAuthenticated()) {
      router.push("/login")
    } else if (user?.rol === 'SuperAdmin') {
      router.push("/superadmin")
    } else if (user?.rol === 'Prestamista' || user?.rol === 'Cajero') {
      const restrictedRoutes = ['/client/gastosfijos', '/client/consolidacion', '/client/prestatarios', '/client/configuracion'];
      if (restrictedRoutes.some(r => pathname.startsWith(r))) {
        router.push("/client/dashboard")
      }
    }
  }, [isAuthenticated, router, user, pathname])

  if (!isMounted || !isAuthenticated()) {
    return (
      <div className="flex h-screen w-full">
        {/* Sidebar Skeleton */}
        <div className="w-[250px] border-r bg-slate-50 hidden md:block p-4">
          <Skeleton className="h-8 w-3/4 mb-8" />
          <div className="space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b px-4 flex items-center">
             <Skeleton className="h-6 w-48" />
          </header>
          <div className="p-4 flex-1">
             <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
             </div>
             <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    )
  }

  const getSectionTitle = () => {
    switch (pathname) {
      case "/client/dashboard":
        return "Panel de Administración - Préstamos"
      case "/client/clientes":
        return "Gestión de Clientes"
      case "/client/prestatarios":
        return "Gestión de Prestatarios"
      case "/client/prestamos":
        return "Gestión de Préstamos"
      case "/client/consolidacion":
        return "Consolidación de Capital"
      case "/client/pagos":
        return "Gestión de Pagos"
      case "/client/pagospersonalizados":
        return "Gestión de Pagos Personalizados"
      case "/client/gastosfijos":
        return "Gestión de Gastos Fijos"
      case "/client/configuracion":
        return "Configuración"
      case "/client/solicitudes":
        return "Solicitudes Futuras"
      default:
        return "Panel de Administración - Préstamos"
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white z-10">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{getSectionTitle()}</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
