"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Building2, List, Shield, Settings, CheckCircle, Ticket, LogOut } from 'lucide-react'
import { useAuthStore } from "@/store/authStore"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from 'next/link';

const data = {
  navMain: [
    {
      title: "Dashboard",
      href: "/superadmin",
      icon: Shield,
    },
    {
      title: "Gestionar Empresas",
      href: "/superadmin/empresas",
      icon: Building2,
    },
    {
      title: "Planes Base",
      href: "/superadmin/planes",
      icon: List,
    },
    {
      title: "Suscripciones Activas",
      href: "/superadmin/suscripciones",
      icon: Ticket,
    }
  ]
}

export function SuperAdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const nombreUsuario = user?.nombre || "Cargando..."
  const emailUsuario = user?.email || ""

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/superadmin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CreditWay Global</span>
                  <span className="truncate text-xs">SuperAdmin</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administración SaaS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.href}
                    className="hover:bg-orange-100 data-[active=true]:bg-orange-600 data-[active=true]:text-white cursor-pointer"
                  >
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-orange-100">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                <Shield className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{nombreUsuario}</span>
                <span className="truncate text-xs">{emailUsuario}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
