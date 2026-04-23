"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Building2, List, Ticket, Clock } from "lucide-react"

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    empresas: 0,
    planesActivos: 0,
    suscripcionesAVencer: 0
  })

  useEffect(() => {
    api.get("/suscripciones/stats")
      .then(res => setStats(res.data))
      .catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Métricas Globales SaaS</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Empresas Registradas</h3>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{stats.empresas}</div>
            <p className="text-xs text-muted-foreground mt-1">Tenant activos en base de datos</p>
          </div>
        </div>

        <div className="rounded-xl border bg-white text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-slate-600">Planes Ofertados</h3>
            <List className="w-4 h-4 text-blue-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{stats.planesActivos}</div>
            <p className="text-xs text-muted-foreground mt-1">Planes actualmente configurados</p>
          </div>
        </div>

        <div className="rounded-xl border bg-orange-600 text-white shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-orange-100">Próximos a Vencer</h3>
            <Clock className="w-4 h-4 text-orange-200" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-3xl font-bold">{stats.suscripcionesAVencer}</div>
            <p className="text-xs text-orange-200 mt-1">Vencen en menos de 15 días</p>
          </div>
        </div>
      </div>
    </div>
  )
}
