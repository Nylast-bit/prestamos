import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, DollarSign, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { fetchWithAuth } from "@/lib/fetchWithAuth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface ReengancheModalProps {
  isOpen: boolean
  onClose: () => void
  prestamo: any
  prestatarios: any[]
  onSuccess: () => void
}

export function ReengancheModal({
  isOpen,
  onClose,
  prestamo,
  prestatarios,
  onSuccess
}: ReengancheModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [montoNuevo, setMontoNuevo] = useState<string>("")
  const [tipoCalculo, setTipoCalculo] = useState<string>("amortizable")
  const [interesPorcentaje, setInteresPorcentaje] = useState<string>("10")
  const [cantidadCuotas, setCantidadCuotas] = useState<string>("4")
  const [modalidadPago, setModalidadPago] = useState<string>("mensual")
  const [idPrestatario, setIdPrestatario] = useState<string>("")
  const [observaciones, setObservaciones] = useState<string>("")

  // Calcular el saldo pendiente del préstamo actual
  const calcularSaldoPendiente = (p: any): number => {
    if (!p) return 0;
    if (p.TipoCalculo === 'solo_interes') {
      return Number(p.CapitalRestante ?? p.MontoPrestado ?? 0);
    }
    if (p.TablaPagos) {
      try {
        const tabla = JSON.parse(p.TablaPagos);
        const pendientes = tabla.filter((c: any) => !c.pagado);
        if (pendientes.length > 0) {
          return pendientes.reduce((sum: number, c: any) => sum + Number(c.cuota || 0), 0);
        }
      } catch (e) {}
    }
    return Number(p.CuotasRestantes || 0) * Number(p.MontoCuota || 0);
  };

  const saldoPendiente = calcularSaldoPendiente(prestamo);
  const nuevoMontoNum = parseFloat(montoNuevo) || 0;
  const efectivoNetoAEntregar = Math.max(0, nuevoMontoNum - saldoPendiente);
  const esValidoMonto = nuevoMontoNum > saldoPendiente;

  useEffect(() => {
    if (prestamo) {
      const saldo = calcularSaldoPendiente(prestamo);
      setMontoNuevo((saldo + 5000).toString());
      setTipoCalculo(prestamo.TipoCalculo || "amortizable");
      setInteresPorcentaje((prestamo.InteresPorcentaje || 10).toString());
      setCantidadCuotas((prestamo.CantidadCuotas || 4).toString());
      setModalidadPago((prestamo.ModalidadPago || "mensual").toLowerCase());
      setIdPrestatario(prestamo.IdPrestatario ? prestamo.IdPrestatario.toString() : "");
      setObservaciones("");
    }
  }, [prestamo]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestamo) return;

    if (!esValidoMonto) {
      toast.error(`El nuevo préstamo debe ser mayor al saldo pendiente a liquidar (${formatMoney(saldoPendiente)})`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        MontoPrestado: nuevoMontoNum,
        TipoCalculo: tipoCalculo,
        InteresPorcentaje: parseFloat(interesPorcentaje),
        CantidadCuotas: parseInt(cantidadCuotas),
        ModalidadPago: modalidadPago,
        IdPrestatario: parseInt(idPrestatario) || prestamo.IdPrestatario,
        Observaciones: observaciones || undefined,
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/api/prestamos/${prestamo.IdPrestamo}/reenganchar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(resData.error || resData.message || "Error al realizar el reenganche");
        return;
      }

      toast.success(`Reenganche completado exitosamente. Efectivo entregado: ${formatMoney(efectivoNetoAEntregar)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Ocurrió un error al procesar el reenganche");
    } finally {
      setSubmitting(false);
    }
  };

  if (!prestamo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2 text-[#213685]">
            <RefreshCw className="h-5 w-5 animate-spin-slow" />
            <DialogTitle className="text-xl font-bold">Reenganche de Préstamo</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Liquida la deuda del préstamo #{prestamo.NumeroEmpresa ?? prestamo.IdPrestamo} e inicia uno nuevo de mayor monto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Card Resumen Préstamo Actual */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-1 text-xs">
            <div className="flex justify-between items-center text-amber-900 font-medium">
              <span>Cliente: <strong className="text-amber-950">{prestamo.clienteNombre || "Cliente"}</strong></span>
              <span className="bg-amber-200/60 px-2 py-0.5 rounded text-[11px]">Préstamo #{prestamo.NumeroEmpresa ?? prestamo.IdPrestamo}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-amber-200/50">
              <span className="text-slate-600">Saldo Pendiente a Liquidar:</span>
              <span className="font-bold text-base text-amber-900">{formatMoney(saldoPendiente)}</span>
            </div>
          </div>

          {/* Campos Nuevo Préstamo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Monto Nuevo Préstamo</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  className="pl-8 font-bold text-sm"
                  value={montoNuevo}
                  onChange={(e) => setMontoNuevo(e.target.value)}
                  placeholder="10000"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tasa de Interés (%)</Label>
              <Input
                type="number"
                step="0.01"
                className="text-sm font-semibold"
                value={interesPorcentaje}
                onChange={(e) => setInteresPorcentaje(e.target.value)}
                placeholder="10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Cálculo</Label>
              <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amortizable">Amortizable</SelectItem>
                  <SelectItem value="cuota_fija">Cuota Fija</SelectItem>
                  <SelectItem value="solo_interes">Solo Interés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cantidad Cuotas</Label>
              <Input
                type="number"
                className="text-sm font-semibold"
                value={cantidadCuotas}
                onChange={(e) => setCantidadCuotas(e.target.value)}
                placeholder="4"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Modalidad</Label>
              <Select value={modalidadPago} onValueChange={setModalidadPago}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="diario">Diario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Prestamista / Responsable</Label>
            <Select value={idPrestatario} onValueChange={setIdPrestatario}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Seleccionar prestamista" />
              </SelectTrigger>
              <SelectContent>
                {prestatarios.map((p) => (
                  <SelectItem key={p.IdPrestatario} value={p.IdPrestatario.toString()}>
                    {p.Nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Observaciones (Opcional)</Label>
            <Textarea
              className="text-xs h-16 resize-none"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles adicionales del reenganche..."
            />
          </div>

          {/* Card Resumen de Desembolso Neto */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Nuevo Préstamo Solicitado:</span>
              <span className="font-semibold text-slate-800">{formatMoney(nuevoMontoNum)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>- Saldo Préstamo Anterior (a Liquidar):</span>
              <span className="font-semibold text-amber-700">-{formatMoney(saldoPendiente)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-emerald-300 font-bold text-sm text-emerald-900">
              <span>Efectivo Neto a Entregar (Sale de Caja):</span>
              <span className="text-base text-emerald-700">{formatMoney(efectivoNetoAEntregar)}</span>
            </div>

            {!esValidoMonto && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 pt-1 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>El nuevo monto debe superar los {formatMoney(saldoPendiente)} para realizar el reenganche.</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !esValidoMonto}
              className="bg-[#213685] hover:bg-[#213685]/90 text-white font-semibold"
            >
              {submitting ? "Procesando Reenganche..." : `Confirmar y Entregar ${formatMoney(efectivoNetoAEntregar)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
