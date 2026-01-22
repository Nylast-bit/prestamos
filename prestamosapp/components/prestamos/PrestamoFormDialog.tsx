import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calculator } from 'lucide-react'

// Definimos la interfaz de las props que recibe este componente
interface PrestamoFormDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: any
  setFormData: (data: any) => void
  clientes: any[]
  prestatarios: any[]
  isEditing: boolean
  onSimular: () => void
  onSubmit: (e?: React.FormEvent) => void
  isSubmitting: boolean
  isSimulating: boolean
}

export function PrestamoFormDialog({
  isOpen,
  onClose,
  formData,
  setFormData,
  clientes,
  prestatarios,
  isEditing,
  onSimular,
  onSubmit,
  isSubmitting,
  isSimulating
}: PrestamoFormDialogProps) {

  // Función auxiliar para actualizar el estado del formulario
  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Préstamo" : "Nuevo Préstamo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Actualiza la información del préstamo existente." 
              : "Completa los datos y realiza la simulación antes de crear el préstamo."
            }
          </DialogDescription>
        </DialogHeader>

        {/* --- INICIO DEL FORMULARIO --- */}
        <div className="grid gap-4 py-4">
          
          {/* Fila 1: Cliente y Prestatario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="IdCliente">Cliente</Label>
              <Select 
                value={formData.IdCliente} 
                onValueChange={(val) => updateField("IdCliente", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente: any) => (
                    <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                      {cliente.Nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="IdPrestatario">Prestatario</Label>
              <Select 
                value={formData.IdPrestatario} 
                onValueChange={(val) => updateField("IdPrestatario", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar prestatario" />
                </SelectTrigger>
                <SelectContent>
                  {prestatarios.map((pres: any) => (
                    <SelectItem key={pres.IdPrestatario} value={pres.IdPrestatario.toString()}>
                      {pres.Nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Fila 2: Monto, Interés y Cuotas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="MontoPrestado">Monto ($)</Label>
              <Input
                id="MontoPrestado"
                type="number"
                step="0.01"
                value={formData.MontoPrestado}
                onChange={(e) => updateField("MontoPrestado", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="InteresPorcentaje">Interés (%)</Label>
              <Input
                id="InteresPorcentaje"
                type="number"
                step="0.01"
                value={formData.InteresPorcentaje}
                onChange={(e) => updateField("InteresPorcentaje", e.target.value)}
                placeholder="Ej. 10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="CantidadCuotas">Nº Cuotas</Label>
              <Input
                id="CantidadCuotas"
                type="number"
                value={formData.CantidadCuotas}
                onChange={(e) => updateField("CantidadCuotas", e.target.value)}
                placeholder="Ej. 12"
                required
              />
            </div>
          </div>

          {/* Fila 3: Tipo de Cálculo y Modalidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="TipoCalculo">Tipo de Cálculo</Label>
              <Select 
                value={formData.TipoCalculo} 
                onValueChange={(val) => updateField("TipoCalculo", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capital+interes">Capital + Interés (Flat)</SelectItem>
                  <SelectItem value="amortizable">Amortizable (Sobre Saldo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ModalidadPago">Modalidad de Pago</Label>
              <Select 
                value={formData.ModalidadPago} 
                onValueChange={(val) => updateField("ModalidadPago", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 4: Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="FechaInicio">Fecha Inicio</Label>
              <Input
                id="FechaInicio"
                type="date"
                value={formData.FechaInicio}
                onChange={(e) => updateField("FechaInicio", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="FechaFinEstimada">Fecha Vencimiento</Label>
              <Input
                id="FechaFinEstimada"
                type="date"
                value={formData.FechaFinEstimada}
                onChange={(e) => updateField("FechaFinEstimada", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="Observaciones">Observaciones</Label>
            <Textarea
              id="Observaciones"
              value={formData.Observaciones}
              onChange={(e) => updateField("Observaciones", e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Botón de Simulación (Solo visible si NO estamos editando) */}
          {!isEditing && (
            <div className="pt-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onSimular}
                disabled={isSimulating || !formData.MontoPrestado || !formData.InteresPorcentaje || !formData.CantidadCuotas}
                className="w-full border-dashed border-2 hover:border-solid"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isSimulating ? "Calculando..." : "Simular Cuotas y Totales"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Debes simular para generar la tabla de pagos antes de crear.
              </p>
            </div>
          )}
        </div>
        {/* --- FIN DEL FORMULARIO --- */}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSubmit()} 
            className="bg-[#213685] hover:bg-[#213685]/90" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : (isEditing ? "Actualizar Préstamo" : "Crear Préstamo")}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}