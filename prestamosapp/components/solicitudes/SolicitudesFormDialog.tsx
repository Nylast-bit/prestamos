import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Edit3, CalendarDays, DollarSign, User } from 'lucide-react'

interface SolicitudFormDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: any
  setFormData: (data: any) => void
  clientes: any[]
  isEditing: boolean
  onSubmit: (e?: React.FormEvent) => void
  isSubmitting: boolean
}

export function SolicitudFormDialog({
  isOpen,
  onClose,
  formData,
  setFormData,
  clientes,
  isEditing,
  onSubmit,
  isSubmitting
}: SolicitudFormDialogProps) {

  // Helper para actualizar el estado del formulario fácilmente
  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmitWrapper}>
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-[#213685]">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              {isEditing ? "Editar Solicitud" : "Nueva Solicitud de Préstamo"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Actualiza los datos o el estado de la solicitud." 
                : "Registra una nueva petición de crédito para un cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            
            {/* Cliente */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-slate-700">
                <User className="h-4 w-4" /> Cliente Solicitante
              </Label>
              <Select 
                value={formData.IdCliente} 
                onValueChange={(val) => updateField("IdCliente", val)}
                disabled={isEditing} // Generalmente no cambias el cliente de una solicitud ya hecha
                required
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente: any) => (
                    <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                      {cliente.Nombre} {cliente.Cedula ? `(${cliente.Cedula})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Monto Solicitado */}
              <div className="space-y-2">
                <Label htmlFor="MontoSolicitado" className="flex items-center gap-1 text-slate-700">
                  <DollarSign className="h-4 w-4" /> Monto Solicitado
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <Input
                    id="MontoSolicitado"
                    type="number"
                    step="any"
                    min="1"
                    className="pl-7 font-bold text-[#213685]"
                    value={formData.MontoSolicitado}
                    onChange={(e) => updateField("MontoSolicitado", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Fecha Deseada */}
              <div className="space-y-2">
                <Label htmlFor="FechaDeseada" className="flex items-center gap-1 text-slate-700">
                  <CalendarDays className="h-4 w-4" /> Fecha Deseada
                </Label>
                <Input
                  id="FechaDeseada"
                  type="date"
                  className="bg-white"
                  value={formData.FechaDeseada}
                  onChange={(e) => updateField("FechaDeseada", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label className="text-slate-700">Estado de la Solicitud</Label>
              <Select 
                value={formData.Estado} 
                onValueChange={(val) => updateField("Estado", val)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente (En Revisión)</SelectItem>
                  <SelectItem value="Aprobada">Aprobada</SelectItem>
                  <SelectItem value="Rechazada">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notas / Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="Notas" className="text-slate-700">Notas Adicionales</Label>
              <Textarea
                id="Notas"
                className="resize-none bg-white"
                rows={3}
                value={formData.Notas}
                onChange={(e) => updateField("Notas", e.target.value)}
                placeholder="¿Para qué es el préstamo? ¿Alguna garantía en mente?..."
              />
            </div>

          </div>

          <DialogFooter className="border-t pt-4 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-[#213685] hover:bg-[#213685]/90 min-w-[120px]" 
              disabled={isSubmitting || !formData.IdCliente || !formData.MontoSolicitado}
            >
              {isSubmitting ? "Guardando..." : (isEditing ? "Actualizar" : "Crear Solicitud")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}