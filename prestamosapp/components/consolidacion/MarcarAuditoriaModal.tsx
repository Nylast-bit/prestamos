"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

interface MarcarAuditoriaModalProps {
  isOpen: boolean
  onClose: () => void
  consolidacionId: number
  fechaInicio: string
  fechaFin: string
  capitalEntrante: number
  capitalSaliente: number
  balanceNeto: number
  totalRegistros: number
  formatDate: (iso: string) => string
  onSuccess: () => void
}

export function MarcarAuditoriaModal({
  isOpen,
  onClose,
  consolidacionId,
  fechaInicio,
  fechaFin,
  capitalEntrante,
  capitalSaliente,
  balanceNeto,
  totalRegistros,
  formatDate,
  onSuccess
}: MarcarAuditoriaModalProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const [observaciones, setObservaciones] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/consolidacioncapital/${consolidacionId}/auditar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al auditar consolidación")

      toast.success("¡Consolidación marcada como Buena y Válida!")
      setObservaciones("")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Error al marcar consolidación")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-inner">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg text-slate-900">
                Marcar como Buena y Válida
              </DialogTitle>
              <DialogDescription className="text-xs">
                Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Instantánea de Cuadre Actual:
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                Capital Entrante: <strong className="text-emerald-700 font-mono">RD${capitalEntrante.toLocaleString()}</strong>
              </div>
              <div>
                Capital Saliente: <strong className="text-rose-700 font-mono">RD${capitalSaliente.toLocaleString()}</strong>
              </div>
              <div>
                Balance Neto: <strong className={`font-mono ${balanceNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>RD${balanceNeto.toLocaleString()}</strong>
              </div>
              <div>
                Registros Auditados: <strong className="text-slate-800">{totalRegistros}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs-auditoria" className="text-xs font-semibold text-slate-700">
              Observaciones / Comentarios del Cuadre (Opcional)
            </Label>
            <Textarea
              id="obs-auditoria"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Verificado y cuadrado en caja física (RD$30k) y banco (RD$20k)."
              rows={3}
              className="text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldCheck className="h-4 w-4 mr-1.5" />}
            Confirmar Cuadre Válido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
