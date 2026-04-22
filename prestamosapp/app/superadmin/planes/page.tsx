"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { List } from "lucide-react"

export default function PlanesPage() {
  const [planes, setPlanes] = useState<any[]>([])

  useEffect(() => {
    api.get("/planes").then(res => setPlanes(res.data)).catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Planes SaaS</h2>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
          Nuevo Plan
        </button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {planes.map(plan => (
          <div key={plan.IdPlan} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <List className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{plan.Nombre}</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex justify-between"><span>Precio:</span> <span className="font-medium text-slate-900">${plan.Precio}</span></p>
              <p className="flex justify-between"><span>Límite Usuarios:</span> <span className="font-medium text-slate-900">{plan.LimiteUsuarios}</span></p>
              <p className="flex justify-between"><span>Límite Préstamos:</span> <span className="font-medium text-slate-900">{plan.LimitePrestamos}</span></p>
              <p className="flex justify-between"><span>Estado:</span> <span className="font-medium text-green-600">{plan.Activo ? 'Activo' : 'Inactivo'}</span></p>
            </div>
            <div className="mt-6">
               <button className="w-full border py-2 rounded-md hover:bg-slate-50 transition-colors">Editar Plan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
