"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { SuperAdminSidebar } from "@/components/superadmin-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!isAuthenticated()) {
      router.push("/login")
    } else if (user?.rol !== 'SuperAdmin') {
      router.push("/")
    }
  }, [isAuthenticated, router, user])

  if (!isMounted || !isAuthenticated() || user?.rol !== 'SuperAdmin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SuperAdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-orange-50">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-base font-semibold text-orange-950 sm:text-lg">Panel SuperAdmin SaaS</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 bg-muted">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
