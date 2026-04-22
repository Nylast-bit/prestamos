"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Ticket } from "lucide-react"

export default function SuscripcionesPage() {
  const [suscripciones, setSuscripciones] = useState<any[]>([])

  useEffect(() => {
    api.get("/suscripciones").then(res => setSuscripciones(res.data)).catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Registro de Suscripciones</h2>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
          Nueva Suscripción
        </button>
      </div>
      
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-medium">Empresa</th>
              <th className="p-4 font-medium">Plan</th>
              <th className="p-4 font-medium">Inicio</th>
              <th className="p-4 font-medium">Vencimiento</th>
              <th className="p-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {suscripciones.map(sus => (
              <tr key={sus.IdSuscripcion} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-4 font-medium">{sus.Empresa?.Nombre}</td>
                <td className="p-4 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-orange-600" />
                  {sus.Plan?.Nombre}
                </td>
                <td className="p-4">{new Date(sus.FechaInicio).toLocaleDateString()}</td>
                <td className="p-4 font-medium">{new Date(sus.FechaVencimiento).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sus.Estado === 'Activa' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {sus.Estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
