"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarClock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { inferirDiasPago, normalizarDiasPago, siguienteFechaPago, toISODate, describirDiasPago } from "@/lib/fechasPago"
import { DiasPagoFields, DiasPagoValor } from "@/components/prestamos/DiasPagoFields"

interface DiasPagoDialogProps {
  prestamo: any | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Cambia los días de pago acordados de un préstamo activo y recalcula los vencimientos pendientes
export function DiasPagoDialog({ prestamo, isOpen, onClose, onSuccess }: DiasPagoDialogProps) {
  const [valor, setValor] = useState<DiasPagoValor>({ dia1: null, dia2: null, primerPago: "" })
  const [guardando, setGuardando] = useState(false)

  const modalidad = prestamo?.ModalidadPago || "mensual"

  useEffect(() => {
    if (!prestamo || !isOpen) return
    let tabla: any[] = []
    try { tabla = JSON.parse(prestamo.TablaPagos || "[]") } catch (e) { /* sin tabla */ }
    const dias = inferirDiasPago(tabla, modalidad, prestamo.FechaInicio)
    setValor({ dia1: dias.dia1 ?? null, dia2: dias.dia2 ?? null, primerPago: "" })
  }, [prestamo, isOpen, modalidad])

  if (!prestamo) return null

  const dias = normalizarDiasPago(modalidad, prestamo.FechaInicio, { dia1: valor.dia1, dia2: valor.dia2 })
  // Próximo pago sugerido: la siguiente fecha acordada desde hoy (incluido)
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  const sugerida = toISODate(siguienteFechaPago(ayer, modalidad, dias))

  const guardar = async () => {
    setGuardando(true)
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/prestamos/${prestamo.IdPrestamo}/dias-pago`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ DiaPago1: dias.dia1, DiaPago2: dias.dia2, FechaProximoPago: valor.primerPago || sugerida }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.message || "No se pudieron cambiar los días de pago")
      toast.success(`Días de pago actualizados: ${describirDiasPago(modalidad, dias)}`)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] grid-cols-[minmax(0,1fr)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#213685] dark:text-blue-300" /> Días de pago
          </DialogTitle>
          <DialogDescription>
            {prestamo.clienteNombre} · Préstamo #{prestamo.NumeroEmpresa ?? prestamo.IdPrestamo}. Se recalculan los vencimientos de las cuotas pendientes; las pagadas no cambian.
          </DialogDescription>
        </DialogHeader>

        <DiasPagoFields
          modalidad={modalidad}
          valor={valor}
          onChange={setValor}
          fechaSugerida={sugerida}
          etiquetaFecha="Próximo pago"
        />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando} className="bg-[#213685] text-white hover:bg-[#213685]/90">
            {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Guardar días
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
