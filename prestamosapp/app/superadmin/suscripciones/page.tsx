"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Ticket } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function SuscripcionesPage() {
  const [suscripciones, setSuscripciones] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSuscripcion, setEditingSuscripcion] = useState<any>(null)

  const [formData, setFormData] = useState({
    idEmpresa: '',
    idPlan: '',
    fechaVencimiento: '',
    estado: 'Activa'
  })

  const loadData = async () => {
    try {
      const [susRes, empRes, planesRes] = await Promise.all([
        api.get("/suscripciones"),
        api.get("/empresas"),
        api.get("/planes")
      ])
      setSuscripciones(susRes.data)
      setEmpresas(empRes.data)
      setPlanes(planesRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openNewModal = () => {
    setEditingSuscripcion(null)
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    
    setFormData({ 
      idEmpresa: '', 
      idPlan: '', 
      fechaVencimiento: nextMonth.toISOString().split('T')[0],
      estado: 'Activa'
    })
    setIsModalOpen(true)
  }

  const openEditModal = (sus: any) => {
    setEditingSuscripcion(sus)
    setFormData({
      idEmpresa: sus.IdEmpresa,
      idPlan: sus.IdPlan,
      fechaVencimiento: new Date(sus.FechaVencimiento).toISOString().split('T')[0],
      estado: sus.Estado
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingSuscripcion) {
        await api.put(`/suscripciones/${editingSuscripcion.IdSuscripcion}`, {
            idPlan: Number(formData.idPlan),
            fechaVencimiento: formData.fechaVencimiento,
            estado: formData.estado
        })
      } else {
        await api.post("/suscripciones", {
            idEmpresa: Number(formData.idEmpresa),
            idPlan: Number(formData.idPlan),
            fechaVencimiento: formData.fechaVencimiento
        })
      }
      setIsModalOpen(false)
      loadData()
    } catch (e) {
      console.error(e)
      alert("Ocurrió un error al guardar.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Registro de Suscripciones</h2>
        <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={openNewModal}>
          Nueva Suscripción
        </Button>
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
              <th className="p-4 font-medium text-right">Acciones</th>
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
                <td className="p-4 text-right">
                  <span className="text-blue-600 hover:underline cursor-pointer" onClick={() => openEditModal(sus)}>Editar</span>
                </td>
              </tr>
            ))}
            {suscripciones.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No hay suscripciones registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSuscripcion ? 'Modificar Suscripción' : 'Asignar Nueva Suscripción'}</DialogTitle>
            <DialogDescription>
              {editingSuscripcion ? 'Actualiza el plan o fecha de vencimiento.' : 'Vincula una empresa existente con un plan SaaS.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <select 
                className="w-full border rounded-md p-2 outline-none text-sm bg-slate-50"
                value={formData.idEmpresa} 
                onChange={e => setFormData({...formData, idEmpresa: e.target.value})}
                disabled={!!editingSuscripcion} // No se puede cambiar la empresa de una suscripción
              >
                <option value="">-- Seleccionar Empresa --</option>
                {empresas.map(emp => (
                    <option key={emp.IdEmpresa} value={emp.IdEmpresa}>{emp.Nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Plan Asignado</Label>
              <select 
                className="w-full border rounded-md p-2 outline-none text-sm"
                value={formData.idPlan} 
                onChange={e => setFormData({...formData, idPlan: e.target.value})}
              >
                <option value="">-- Seleccionar Plan --</option>
                {planes.filter(p => p.Activo).map(plan => (
                    <option key={plan.IdPlan} value={plan.IdPlan}>{plan.Nombre} (${plan.Precio})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento (Próximo Cobro)</Label>
              <Input type="date" value={formData.fechaVencimiento} onChange={e => setFormData({...formData, fechaVencimiento: e.target.value})} />
            </div>

            {editingSuscripcion && (
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <select 
                        className="w-full border rounded-md p-2 outline-none text-sm"
                        value={formData.estado} 
                        onChange={e => setFormData({...formData, estado: e.target.value})}
                    >
                        <option value="Activa">Activa</option>
                        <option value="Inactiva">Inactiva (Cancelada / Suspendida)</option>
                    </select>
                </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSubmit}>Guardar Suscripción</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
