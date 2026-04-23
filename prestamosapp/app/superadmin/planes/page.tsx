"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { List } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function PlanesPage() {
  const [planes, setPlanes] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<any>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    precio: 0,
    limiteUsuarios: 5,
    limitePrestamos: 50,
    activo: true
  })

  const loadPlanes = () => {
    api.get("/planes").then(res => setPlanes(res.data)).catch(console.error)
  }

  useEffect(() => {
    loadPlanes()
  }, [])

  const openNewModal = () => {
    setEditingPlan(null)
    setFormData({ nombre: '', precio: 0, limiteUsuarios: 5, limitePrestamos: 50, activo: true })
    setIsModalOpen(true)
  }

  const openEditModal = (plan: any) => {
    setEditingPlan(plan)
    setFormData({
      nombre: plan.Nombre,
      precio: plan.Precio,
      limiteUsuarios: plan.LimiteUsuarios,
      limitePrestamos: plan.LimitePrestamos,
      activo: plan.Activo
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        await api.put(`/planes/${editingPlan.IdPlan}`, formData)
      } else {
        await api.post("/planes", formData)
      }
      setIsModalOpen(false)
      loadPlanes()
    } catch (e) {
      console.error(e)
      alert("Ocurrió un error al guardar el plan.")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Planes SaaS</h2>
        <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={openNewModal}>
          Nuevo Plan
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {planes.map(plan => (
          <div key={plan.IdPlan} className={`rounded-xl border p-6 shadow-sm ${plan.Activo ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${plan.Activo ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}>
                <List className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">{plan.Nombre}</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="flex justify-between"><span>Precio:</span> <span className="font-medium text-slate-900">${plan.Precio}</span></p>
              <p className="flex justify-between"><span>Límite Usuarios:</span> <span className="font-medium text-slate-900">{plan.LimiteUsuarios}</span></p>
              <p className="flex justify-between"><span>Límite Préstamos:</span> <span className="font-medium text-slate-900">{plan.LimitePrestamos}</span></p>
              <p className="flex justify-between"><span>Estado:</span> <span className={`font-medium ${plan.Activo ? 'text-green-600' : 'text-slate-500'}`}>{plan.Activo ? 'Activo' : 'Inactivo'}</span></p>
            </div>
            <div className="mt-6">
               <button onClick={() => openEditModal(plan)} className="w-full border py-2 rounded-md hover:bg-slate-50 transition-colors">Editar Plan</button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}</DialogTitle>
            <DialogDescription>Completa los detalles de facturación y límites del plan.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Plan</Label>
              <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Pro, Basic, Enterprise" />
            </div>
            <div className="space-y-2">
              <Label>Precio ($USD)</Label>
              <Input type="number" value={formData.precio} onChange={e => setFormData({...formData, precio: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Límite de Usuarios (Prestamistas)</Label>
              <Input type="number" value={formData.limiteUsuarios} onChange={e => setFormData({...formData, limiteUsuarios: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Límite de Préstamos Activos</Label>
              <Input type="number" value={formData.limitePrestamos} onChange={e => setFormData({...formData, limitePrestamos: Number(e.target.value)})} />
            </div>
            
            {editingPlan && (
              <div className="flex items-center justify-between pt-4">
                <Label>Plan Activo (Disponible para suscripción)</Label>
                <Switch checked={formData.activo} onCheckedChange={c => setFormData({...formData, activo: c})} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSubmit}>Guardar Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
