"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Building2 } from "lucide-react"

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([])

  useEffect(() => {
    api.get("/empresas").then(res => setEmpresas(res.data)).catch(console.error)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Empresas</h2>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
          Nueva Empresa
        </button>
      </div>
      
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Nombre</th>
              <th className="p-4 font-medium">Documento</th>
              <th className="p-4 font-medium">Teléfono</th>
              <th className="p-4 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map(emp => (
              <tr key={emp.IdEmpresa} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-4">{emp.IdEmpresa}</td>
                <td className="p-4 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {emp.Nombre}
                </td>
                <td className="p-4">{emp.Documento}</td>
                <td className="p-4">{emp.Telefono}</td>
                <td className="p-4">{emp.Email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
