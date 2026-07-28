"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, ShieldCheck, Loader2, User, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { fetchWithAuth } from "@/lib/fetchWithAuth"

export interface AuditEntry {
  idRegistro: number
  fechaAuditoria: string
  nombreUsuario: string
  observaciones: string
  capitalEntrante: number
  capitalSaliente: number
  balanceNeto: number
  cantidadRegistros: number
}

interface HistorialAuditoriaModalProps {
  isOpen: boolean
  onClose: () => void
  consolidacionId: number
  fechaInicio: string
  fechaFin: string
  formatDate: (iso: string) => string
}

export function HistorialAuditoriaModal({
  isOpen,
  onClose,
  consolidacionId,
  fechaInicio,
  fechaFin,
  formatDate
}: HistorialAuditoriaModalProps) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  const [historial, setHistorial] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && consolidacionId) {
      fetchHistorial()
    }
  }, [isOpen, consolidacionId])

  const fetchHistorial = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/consolidacioncapital/${consolidacionId}/auditorias`)
      if (res.ok) {
        const data: AuditEntry[] = await res.json()
        setHistorial(data)
        if (data.length > 0) setExpandedId(data[0].idRegistro)
      }
    } catch (e) {
      console.error("Error cargando historial de auditorías:", e)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (iso: string) => {
    if (!iso) return ''
    try {
      const date = new Date(iso)
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch (e) {
      return iso
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-[#213685] flex items-center justify-center font-bold shadow-inner">
              <History className="h-5 w-5 text-[#213685]" />
            </div>
            <div>
              <DialogTitle className="text-lg text-slate-900 flex items-center gap-2">
                Historial de Verificaciones
              </DialogTitle>
              <DialogDescription className="text-xs">
                Período: {formatDate(fechaInicio)} al {formatDate(fechaFin)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mb-2 text-[#213685]" />
            <p className="text-xs">Cargando historial de marcados...</p>
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border text-xs">
            No hay registros de auditoría para esta consolidación.
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 py-1">
            {historial.map((entry, idx) => {
              const isExpanded = expandedId === entry.idRegistro
              const isLatest = idx === 0

              return (
                <div
                  key={entry.idRegistro}
                  className={`border rounded-lg p-3 transition-all ${
                    isLatest ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setExpandedId(isExpanded ? null : entry.idRegistro)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-full ${isLatest ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {entry.nombreUsuario}
                          </span>
                          {isLatest && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px] px-1.5 py-0">
                              Más reciente
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {formatDateTime(entry.fechaAuditoria)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono bg-white">
                        RD${entry.balanceNeto.toLocaleString()}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-xs space-y-2">
                      {entry.observaciones && (
                        <div className="bg-white p-2 rounded border text-slate-700 flex items-start gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="italic">{entry.observaciones}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border text-slate-600 font-mono">
                        <div>Entrante: <span className="text-emerald-700 font-semibold">RD${entry.capitalEntrante.toLocaleString()}</span></div>
                        <div>Saliente: <span className="text-rose-700 font-semibold">RD${entry.capitalSaliente.toLocaleString()}</span></div>
                        <div>Balance: <span className={`font-semibold ${entry.balanceNeto >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>RD${entry.balanceNeto.toLocaleString()}</span></div>
                        <div># Registros: <span className="text-slate-800 font-semibold">{entry.cantidadRegistros}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
