"use client"

import * as React from "react"
import { BarChart3, Building2, Calculator, CreditCard, DollarSign, FileText, HandCoins, Home, PiggyBank, Receipt, Settings, TrendingUp, Users, UserCheck, Calendar, Shield } from 'lucide-react'

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
      key: "pagos-personalizados",
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
      title: "Volantes",
      key: "volantes",
      icon: Receipt,
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
  const handleConfigClick = () => {
    onSectionChange("configuracion")
  }

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
                  <span className="truncate font-semibold">Préstamos Pro</span>
                  <span className="truncate text-xs">Gestión Financiera</span>
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
              {data.navMain.map((item) => (
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
                <span className="truncate font-semibold">Admin Usuario</span>
                <span className="truncate text-xs">admin@prestamos.com</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
