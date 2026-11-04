import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, DollarSign, AlertCircle, Calculator, Loader2, ChevronDown, ChevronUp, Table as TableIcon } from "lucide-react"
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

  // Calcular el saldo pendiente a liquidar del préstamo actual (Capital Restante + Interés de período actual)
  const calcularSaldoPendiente = (p: any): number => {
    if (!p) return 0;
    const capRestante = Number(p.CapitalRestante ?? p.MontoPrestado ?? 0);

    if (p.TipoCalculo === 'solo_interes') {
      return capRestante;
    }

    let interesPeriodo = 0;
    if (p.TablaPagos) {
      try {
        const tabla = JSON.parse(p.TablaPagos);
        const primeraPendiente = tabla.find((c: any) => !c.pagado);
        if (primeraPendiente) {
          interesPeriodo = Number(primeraPendiente.interes || 0);
        }
      } catch (e) {}
    } else {
      const tipoCalc = (p.TipoCalculo || '').toLowerCase();
      const baseInt = tipoCalc.includes('amortiza') ? capRestante : Number(p.MontoPrestado || 0);
      interesPeriodo = baseInt * (Number(p.InteresPorcentaje || 0) / 100);
    }

    return capRestante + interesPeriodo;
  };

  const saldoPendiente = calcularSaldoPendiente(prestamo);
  const nuevoMontoNum = parseFloat(montoNuevo) || 0;
  const efectivoNetoAEntregar = Math.max(0, nuevoMontoNum - saldoPendiente);
  const esValidoMonto = nuevoMontoNum > saldoPendiente;

  // Simulación del nuevo préstamo: usa el mismo simulador con el que el backend genera su TablaPagos
  const [simulacion, setSimulacion] = useState<any | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [errorSimulacion, setErrorSimulacion] = useState<string | null>(null);
  const [verTabla, setVerTabla] = useState(false);

  useEffect(() => {
    if (!isOpen || !prestamo) return;
    const monto = parseFloat(montoNuevo);
    const tasa = parseFloat(interesPorcentaje);
    const cuotas = parseInt(cantidadCuotas);
    if (!(monto > 0) || isNaN(tasa) || tasa < 0 || !(cuotas > 0)) {
      setSimulacion(null);
      return;
    }

    let cancelado = false;
    const timer = setTimeout(async () => {
      setSimulando(true);
      setErrorSimulacion(null);
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/prestamos/simular`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monto, tasaInteres: tasa, numeroCuotas: cuotas, tipoCalculo }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelado) return;
        if (!res.ok || !data.success) throw new Error(data.error || "No se pudo simular el préstamo");
        setSimulacion(data);
      } catch (err: any) {
        if (!cancelado) {
          setSimulacion(null);
          setErrorSimulacion(err?.message || "No se pudo simular el préstamo");
        }
      } finally {
        if (!cancelado) setSimulando(false);
      }
    }, 400);

    return () => { cancelado = true; clearTimeout(timer); };
  }, [isOpen, prestamo, montoNuevo, interesPorcentaje, cantidadCuotas, tipoCalculo]);

  useEffect(() => {
    if (prestamo) {
      const saldo = calcularSaldoPendiente(prestamo);
      setMontoNuevo((saldo + 5000).toString());
      // Reenganches viejos guardaban "cuota_fija", que el simulador calcula igual que capital+interes (flat)
      setTipoCalculo(!prestamo.TipoCalculo || prestamo.TipoCalculo === "cuota_fija" ? "capital+interes" : prestamo.TipoCalculo);
      setVerTabla(false);
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
    if (!prestamo || submitting) return;

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
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2 text-[#213685] dark:text-blue-300">
            <RefreshCw className="h-5 w-5 animate-spin-slow" />
            <DialogTitle className="text-xl font-bold">Reenganche de Préstamo</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Liquida la deuda del préstamo #{prestamo.NumeroEmpresa ?? prestamo.IdPrestamo} e inicia uno nuevo de mayor monto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 min-w-0">
          {/* Card Resumen Préstamo Actual */}
          <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg p-3 space-y-1 text-xs">
            <div className="flex justify-between items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
              <span>Cliente: <strong className="text-amber-950 dark:text-amber-100">{prestamo.clienteNombre || "Cliente"}</strong></span>
              <span className="bg-amber-200/60 px-2 py-0.5 rounded text-[11px]">Préstamo #{prestamo.NumeroEmpresa ?? prestamo.IdPrestamo}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-amber-200/50">
              <span className="text-muted-foreground">Saldo Pendiente a Liquidar:</span>
              <span className="font-bold text-base text-amber-900 dark:text-amber-200 whitespace-nowrap">{formatMoney(saldoPendiente)}</span>
            </div>
          </div>

          {/* Campos Nuevo Préstamo */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Monto Nuevo Préstamo</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Cálculo</Label>
              <Select value={tipoCalculo} onValueChange={setTipoCalculo}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Mismos valores que el formulario de nuevo préstamo */}
                  <SelectItem value="capital+interes">Capital + Interés</SelectItem>
                  <SelectItem value="amortizable">Amortizable</SelectItem>
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

          {/* Simulación del nuevo préstamo con su tabla de amortización */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-muted px-3 py-2 border-b border-border">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Calculator className="h-4 w-4 text-[#213685] dark:text-blue-300" /> Simulación del nuevo préstamo
              </span>
              {simulando && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {errorSimulacion ? (
              <p className="flex items-center gap-1.5 p-3 text-xs text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{errorSimulacion}</p>
            ) : !simulacion ? (
              <p className="p-3 text-xs text-muted-foreground">Completa monto, tasa y cuotas para ver la simulación.</p>
            ) : (
              <div className={`space-y-3 p-2 sm:p-3 transition-opacity ${simulando ? 'opacity-60' : ''}`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-md bg-background border border-border p-2">
                    <p className="text-muted-foreground">Cuota {modalidadPago}</p>
                    <p className="font-bold text-sm text-[#213685] dark:text-blue-300 tabular-nums whitespace-nowrap">{formatMoney(simulacion.montoCuota)}</p>
                  </div>
                  <div className="rounded-md bg-background border border-border p-2">
                    <p className="text-muted-foreground">Cuotas</p>
                    <p className="font-bold text-sm tabular-nums">{simulacion.numeroCuotas ?? simulacion.tablaAmortizacion?.length}</p>
                  </div>
                  <div className="rounded-md bg-background border border-border p-2">
                    <p className="text-muted-foreground">Interés total</p>
                    <p className="font-bold text-sm text-orange-600 tabular-nums whitespace-nowrap">{formatMoney(simulacion.montoTotalInteres)}</p>
                  </div>
                  <div className="rounded-md bg-background border border-border p-2">
                    <p className="text-muted-foreground">Total a pagar</p>
                    <p className="font-bold text-sm text-green-700 dark:text-green-400 tabular-nums whitespace-nowrap">{formatMoney(simulacion.montoTotalAPagar)}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => setVerTabla((v) => !v)}
                  aria-expanded={verTabla}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  {verTabla ? "Ocultar tabla de amortización" : "Ver tabla de amortización"}
                  {verTabla ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>

                {verTabla && (
                  <div className="max-h-[260px] overflow-auto rounded-md border border-border">
                    <table className="w-full text-[11px] sm:text-xs">
                      <thead className="sticky top-0 bg-muted text-foreground">
                        <tr>
                          <th className="px-1.5 sm:px-2 py-1.5 text-center font-semibold">#</th>
                          <th className="px-1.5 sm:px-2 py-1.5 text-right font-semibold">Capital</th>
                          <th className="px-1.5 sm:px-2 py-1.5 text-right font-semibold">Interés</th>
                          <th className="px-1.5 sm:px-2 py-1.5 text-right font-semibold text-green-700 dark:text-green-400">Cuota</th>
                          <th className="hidden sm:table-cell px-1.5 sm:px-2 py-1.5 text-right font-semibold">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(simulacion.tablaAmortizacion || []).map((c: any) => (
                          <tr key={c.numeroCuota} className="border-t border-border">
                            <td className="px-1.5 sm:px-2 py-1.5 text-center text-muted-foreground">{c.numeroCuota}</td>
                            <td className="px-1.5 sm:px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{formatMoney(c.capital)}</td>
                            <td className="px-1.5 sm:px-2 py-1.5 text-right tabular-nums whitespace-nowrap text-muted-foreground">{formatMoney(c.interes)}</td>
                            <td className="px-1.5 sm:px-2 py-1.5 text-right tabular-nums whitespace-nowrap font-semibold text-green-700 dark:text-green-400">{formatMoney(c.cuota)}</td>
                            <td className="hidden sm:table-cell px-1.5 sm:px-2 py-1.5 text-right tabular-nums whitespace-nowrap">{formatMoney(c.saldo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Resumen de Desembolso Neto */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Nuevo Préstamo Solicitado:</span>
              <span className="font-semibold text-foreground">{formatMoney(nuevoMontoNum)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>- Saldo Préstamo Anterior (a Liquidar):</span>
              <span className="font-semibold text-amber-700">-{formatMoney(saldoPendiente)}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-emerald-300 font-bold text-sm text-emerald-900 dark:text-emerald-200">
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
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting || !esValidoMonto}
              className="bg-[#213685] text-white dark:text-white hover:bg-[#213685] text-white dark:text-white/90 text-white font-semibold"
            >
              {submitting ? "Procesando Reenganche..." : `Confirmar y Entregar ${formatMoney(efectivoNetoAEntregar)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
