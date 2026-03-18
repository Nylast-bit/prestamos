"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Building2, Calculator, CreditCard, TrendingDown, DollarSign, FileText, HandCoins, Home, PiggyBank, Receipt, Settings, TrendingUp, Users, UserCheck, Calendar, Shield, LogOut } from 'lucide-react'
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeSection: string
  onSectionChange: (section: string) => void
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      key: "dashboard",
      icon: Home,
    },
    {
      title: "Clientes",
      key: "clientes",
      icon: Users,
    },
    {
      title: "Prestatarios",
      key: "prestatarios",
      icon: UserCheck,
    },
    {
      title: "Préstamos",
      key: "prestamos",
      icon: DollarSign,
    },
    {
      title: "Pagos",
      key: "pagos",
      icon: CreditCard,
    },
    {
      title: "Acuerdos",
      key: "acuerdos",
      icon: HandCoins,
    },
    {
      title: "Pagos Personalizados",
      key: "pagospersonalizados",
      icon: Calendar,
    },
    {
      title: "Solicitudes Futuras",
      key: "solicitudes",
      icon: TrendingUp,
    },
    {
      title: "Consolidación Capital",
      key: "consolidacion",
      icon: PiggyBank,
    },
    {
      title: "Gastos Fijos",
      key: "gastosfijos",
      icon: TrendingDown,
    },

  ],
  navSecondary: [
    {
      title: "Configuración",
      key: "configuracion",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ activeSection, onSectionChange, ...props }: AppSidebarProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleConfigClick = () => {
    onSectionChange("configuracion")
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Si no está definido el usuario (cargando), mostramos versión genérica
  const nombreUsuario = user?.nombre || "Cargando..."
  const emailUsuario = user?.email || ""
  const nombreEmpresa = user?.nombreEmpresa || "Cargando Empresa..."
  const esSuperAdmin = user?.rol === "admin_sistema"

  // Filtramos las pestañas según rol. (Super admin tiene acceso a empresas, pero la vista de empresas aún no está. Por ahora todos ven config)
  const navMainFiltrado = data.navMain; // A futuro aquí filtramos Items de Mantenimiento de Super Admin

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#213685] text-sidebar-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{nombreEmpresa}</span>
                  <span className="truncate text-xs">CreditWay Platform</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestión Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMainFiltrado.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={activeSection === item.key}
                    className="hover:bg-[#213685]/10 data-[active=true]:bg-[#213685] data-[active=true]:text-white cursor-pointer"
                    onClick={() => onSectionChange(item.key)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    size="sm"
                    className="hover:bg-[#213685]/10 cursor-pointer"
                    onClick={() => onSectionChange(item.key)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
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
            <SidebarMenuButton size="lg" className="hover:bg-[#213685]/10">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#213685] text-white">
                <UserCheck className="size-4" />
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
