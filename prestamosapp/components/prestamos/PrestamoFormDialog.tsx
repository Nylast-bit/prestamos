import React, { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, CalendarDays, Wand2 } from 'lucide-react'

// Definición de las props que recibe desde el padre (PrestamosContent)
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

  // Función auxiliar para actualizar campos
  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  // ------------------------------------------------------------------
  // 🔮 CÁLCULO AUTOMÁTICO DE FECHA DE VENCIMIENTO
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isEditing && formData.FechaInicio && formData.CantidadCuotas && formData.ModalidadPago) {
      
      const cuotas = parseInt(formData.CantidadCuotas);
      if (isNaN(cuotas) || cuotas <= 0) return;

      // Creamos la fecha base a mediodía para evitar problemas de zona horaria
      const fechaBase = new Date(formData.FechaInicio + "T12:00:00");
      const modalidad = formData.ModalidadPago.toLowerCase();

      let diasAAgregar = 0;

      if (modalidad === 'mensual') {
        fechaBase.setMonth(fechaBase.getMonth() + cuotas);
      } else if (modalidad === 'quincenal') {
        diasAAgregar = cuotas * 15;
        fechaBase.setDate(fechaBase.getDate() + diasAAgregar);
      } else if (modalidad === 'semanal') {
        diasAAgregar = cuotas * 7;
        fechaBase.setDate(fechaBase.getDate() + diasAAgregar);
      } else if (modalidad === 'diario') {
         diasAAgregar = cuotas;
         fechaBase.setDate(fechaBase.getDate() + diasAAgregar);
      }

      const nuevaFechaFin = fechaBase.toISOString().split('T')[0];

      if (formData.FechaFinEstimada !== nuevaFechaFin) {
        updateField("FechaFinEstimada", nuevaFechaFin);
      }
    }
  }, [formData.FechaInicio, formData.CantidadCuotas, formData.ModalidadPago, isEditing]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-[#213685]">
            {isEditing ? <Wand2 className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
            {isEditing ? "Editar Préstamo" : "Nuevo Préstamo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los parámetros del préstamo." 
              : "Configura los términos financieros. La fecha final se calculará automáticamente."
            }
          </DialogDescription>
        </DialogHeader>

        {/* --- INICIO DEL FORMULARIO --- */}
        <div className="grid gap-6 py-6">
          
          {/* SECCIÓN 1: PERSONAS */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-gray-500">Cliente</Label>
              <Select 
                value={formData.IdCliente} 
                onValueChange={(val) => updateField("IdCliente", val)}
              >
                <SelectTrigger className="bg-gray-50/50">
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
              <Label className="text-xs font-semibold uppercase text-gray-500">Prestatario (Inversionista)</Label>
              <Select 
                value={formData.IdPrestatario} 
                onValueChange={(val) => updateField("IdPrestatario", val)}
              >
                <SelectTrigger className="bg-gray-50/50">
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
          
          <div className="border-t border-gray-100 my-1"></div>

          {/* SECCIÓN 2: TÉRMINOS FINANCIEROS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="MontoPrestado" className="text-blue-700 font-medium">Monto Principal ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                <Input
                  id="MontoPrestado"
                  type="number"
                  step="100"
                  className="pl-7 font-bold text-lg"
                  value={formData.MontoPrestado}
                  onChange={(e) => updateField("MontoPrestado", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="InteresPorcentaje">Tasa Interés (%)</Label>
              <div className="relative">
                <Input
                  id="InteresPorcentaje"
                  type="number"
                  step="0.1"
                  className="pr-8"
                  value={formData.InteresPorcentaje}
                  onChange={(e) => updateField("InteresPorcentaje", e.target.value)}
                  placeholder="Ej. 10"
                />
                <span className="absolute right-3 top-2.5 text-gray-400 font-bold">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="CantidadCuotas">Cantidad Cuotas</Label>
              <Input
                id="CantidadCuotas"
                type="number"
                value={formData.CantidadCuotas}
                onChange={(e) => updateField("CantidadCuotas", e.target.value)}
                placeholder="Ej. 12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Modalidad de Pago</Label>
              <Select 
                value={formData.ModalidadPago} 
                onValueChange={(val) => updateField("ModalidadPago", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual (Cada mes)</SelectItem>
                  <SelectItem value="quincenal">Quincenal (Cada 15 días)</SelectItem>
                  <SelectItem value="semanal">Semanal (Cada 7 días)</SelectItem>
                  <SelectItem value="diario">Diario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cálculo</Label>
              <Select 
                value={formData.TipoCalculo} 
                onValueChange={(val) => updateField("TipoCalculo", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capital+interes">Capital + Interés (Cuota Fija Flat)</SelectItem>
                  <SelectItem value="amortizable">Amortizable (Interés sobre Saldo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-gray-100 my-1"></div>

          {/* SECCIÓN 3: FECHAS AUTOMÁTICAS */}
          <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
            <div className="space-y-2">
              <Label htmlFor="FechaInicio" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600"/> Inicio del Préstamo
              </Label>
              <Input
                id="FechaInicio"
                type="date"
                className="bg-white"
                value={formData.FechaInicio}
                onChange={(e) => updateField("FechaInicio", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="FechaFinEstimada" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-600"/> Fecha Final (Estimada)
              </Label>
              <Input
                id="FechaFinEstimada"
                type="date"
                className="bg-white font-semibold text-gray-700"
                value={formData.FechaFinEstimada}
                onChange={(e) => updateField("FechaFinEstimada", e.target.value)}
                required
              />
              <p className="text-[10px] text-muted-foreground text-right">
                *Calculada automáticamente según cuotas
              </p>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="Observaciones">Notas / Garantía</Label>
            <Textarea
              id="Observaciones"
              className="resize-none"
              rows={2}
              value={formData.Observaciones}
              onChange={(e) => updateField("Observaciones", e.target.value)}
              placeholder="Detalles sobre garantía o condiciones especiales..."
            />
          </div>

          {/* BOTÓN DE SIMULACIÓN 
              Aquí hemos agregado el console.log para verificar que el clic funciona 
          */}
          {!isEditing && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                console.log("🔘 DEBUG: Botón 'Simular' presionado en el formulario.");
                onSimular(); // Llama a la función del padre
              }}
              disabled={isSimulating || !formData.MontoPrestado || !formData.InteresPorcentaje || !formData.CantidadCuotas}
              className="w-full bg-slate-800 text-white hover:bg-slate-700 h-12 shadow-sm"
            >
              {isSimulating ? (
                "Calculando..."
              ) : (
                <span className="flex items-center">
                   <Calculator className="h-4 w-4 mr-2" />
                   Generar Tabla de Pagos y Simular
                </span>
              )}
            </Button>
          )}
        </div>
        {/* --- FIN DEL FORMULARIO --- */}

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={() => onSubmit()} 
            className="bg-[#213685] hover:bg-[#213685]/90 min-w-[150px]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : (isEditing ? "Guardar Cambios" : "Crear Préstamo")}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}