import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, CalendarClock, Banknote, CheckCircle2, Loader2 } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"

// --- HELPERS (Formato Moneda y Fecha) ---
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "----";
  return new Date(dateString).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const getProximoPago = (fechaInicioStr: string, modalidad: string, cuotasPagadas: number) => {
  if (!fechaInicioStr) return "----";
  const fechaISO = fechaInicioStr.split('T')[0]; 
  let fechaCalculada = new Date(`${fechaISO}T12:00:00`); 
  const saltosNecesarios = cuotasPagadas + 1;

  for (let i = 0; i < saltosNecesarios; i++) {
    if (modalidad.toLowerCase() === 'quincenal') {
      const year = fechaCalculada.getFullYear();
      const mes = fechaCalculada.getMonth();
      const dia = fechaCalculada.getDate();
      const ultimoDiaDelMes = new Date(year, mes + 1, 0).getDate();
      if (dia < 15) { fechaCalculada = new Date(year, mes, 15, 12, 0, 0); } 
      else if (dia >= 15 && dia < ultimoDiaDelMes) { fechaCalculada = new Date(year, mes + 1, 0, 12, 0, 0); } 
      else { fechaCalculada = new Date(year, mes + 1, 15, 12, 0, 0); }
    } else if (modalidad.toLowerCase() === 'mensual') {
      fechaCalculada.setMonth(fechaCalculada.getMonth() + 1);
    } else if (modalidad.toLowerCase() === 'semanal') {
      fechaCalculada.setDate(fechaCalculada.getDate() + 7);
    }
  }
  return fechaCalculada.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// --- COMPONENTE PRINCIPAL ---
export function PrestamoTable({ prestamos, onEdit, onDelete, onPaymentSuccess }: any) {
  
  // Estados
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null);
  const [paymentType, setPaymentType] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Estados Detalle (Historial)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);

  // --- HANDLERS ---
  const handleOpenPay = (e: React.MouseEvent, prestamo: any) => {
    e.stopPropagation();
    setSelectedPrestamo(prestamo);
    setPaymentType("Efectivo");
    setObservaciones("");
    setIsPayOpen(true);
  };

  const handleConfirmarPago = async () => {
    if (!selectedPrestamo) return;
    setIsPaying(true);

    try {
      if (!selectedPrestamo.IdPrestamo) {
          throw new Error("Error crítico: No se encuentra el ID del préstamo.");
      }

      let interesAPagar = 0;
      let capitalAPagar = 0;
      let numeroCuotaActual = 1;

      if (selectedPrestamo.TablaPagos) {
         try {
             const tabla = JSON.parse(selectedPrestamo.TablaPagos);
             const indiceCuota = selectedPrestamo.CantidadCuotas - selectedPrestamo.CuotasRestantes;
             if (tabla[indiceCuota]) {
                 interesAPagar = Number(tabla[indiceCuota].interes);
                 capitalAPagar = Number(tabla[indiceCuota].capital);
                 numeroCuotaActual = Number(tabla[indiceCuota].numeroCuota);
             }
         } catch (e) {
             console.error("Error al parsear TablaPagos", e);
         }
      }

      const payload = {
        IdPrestamo: Number(selectedPrestamo.IdPrestamo),
        MontoPagado: Number(selectedPrestamo.MontoCuota),
        TipoPago: paymentType,
        Observaciones: observaciones || "Pago de cuota estándar",
        MontoInteresPagado: interesAPagar,
        MontoCapitalAbonado: capitalAPagar,
        NumeroCuota: numeroCuotaActual
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al procesar el pago");

      alert("¡Pago registrado correctamente!");
      setIsPayOpen(false);
      if (onPaymentSuccess) onPaymentSuccess();
      
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsPaying(false);
    }
  };
  
  const handlePagoPersonalizado = () => { alert("Próximamente"); };

  const handleRowClick = async (prestamo: any) => {
    setSelectedPrestamo(prestamo);
    setIsDetailsOpen(true);
    setIsLoadingHistorial(true);
    setHistorialPagos([]); 

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagos/historial/${prestamo.IdPrestamo}`);
      if (res.ok) {
        const data = await res.json();
        setHistorialPagos(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingHistorial(false);
    }
  };

  const getTablaAmortizacionFusionada = () => {
    if (!selectedPrestamo || !selectedPrestamo.TablaPagos) return [];
    let tablaProyeccion = [];
    try { tablaProyeccion = JSON.parse(selectedPrestamo.TablaPagos); } 
    catch (e) { return []; }

    return tablaProyeccion.map((cuotaProyectada: any) => {
        const pagoReal = historialPagos.find((p: any) => p.NumeroCuota === cuotaProyectada.numeroCuota);
        return {
            ...cuotaProyectada,
            estado: pagoReal ? 'Pagado' : 'Pendiente',
            fechaPagoReal: pagoReal ? pagoReal.FechaPago : null,
            metodoPago: pagoReal ? pagoReal.TipoPago : null,
            idPago: pagoReal ? pagoReal.IdPago : null
        };
    });
  };

  const prestamosVisibles = prestamos.filter((p: any) => p.Estado !== 'Eliminado');

  return (
    <>
      <div className="rounded-xl border-2 border-slate-200 shadow-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 hover:bg-gradient-to-r">
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider py-4">Cliente</TableHead>
                <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider">Capital</TableHead>
                <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider">Interés</TableHead>
                <TableHead className="text-center font-bold text-slate-800 text-xs uppercase tracking-wider">Tasa</TableHead>
                <TableHead className="text-right font-bold text-[#213685] text-xs uppercase tracking-wider">Saldo Restante</TableHead>
                <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider">Cuota</TableHead>
                <TableHead className="text-center font-bold text-slate-800 text-xs uppercase tracking-wider">Progreso</TableHead>
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Modalidad</TableHead>
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Inicio</TableHead>
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Fin</TableHead>
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider">Último Pago</TableHead>
                <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider sticky right-0 bg-gradient-to-l from-slate-100 to-slate-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prestamosVisibles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <Banknote className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-lg font-medium">No hay préstamos activos</p>
                      <p className="text-sm text-slate-400">Los préstamos aparecerán aquí una vez creados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                prestamosVisibles.map((prestamo: any, idx: number) => {
                  const cuotasTotales = prestamo.CantidadCuotas || 0;
                  const cuotasPagadas = cuotasTotales - (prestamo.CuotasRestantes || 0);
                  const progreso = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0;
                  
                  const interesCalculado = prestamo.MontoPrestado * (prestamo.InteresPorcentaje / 100);
                  const restanteAPagar = prestamo.MontoCuota * (prestamo.CuotasRestantes || 0);

                  return (
                    <TableRow 
                      key={prestamo.IdPrestamo} 
                      className={`
                        cursor-pointer transition-all duration-150
                        ${idx % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50/30 hover:bg-blue-50/50'}
                        border-b border-slate-100
                        group
                      `}
                      onClick={() => handleRowClick(prestamo)}
                    >
                      <TableCell className="font-semibold text-slate-900 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {prestamo.clienteNombre?.charAt(0) || '?'}
                          </div>
                          <span className="group-hover:text-blue-700 transition-colors">{prestamo.clienteNombre}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-semibold text-slate-700">
                        {formatMoney(prestamo.MontoPrestado)}
                      </TableCell>

                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatMoney(interesCalculado)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold px-3 py-1">
                          {prestamo.InteresPorcentaje}%
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-bold text-[#213685] text-lg">
                        {formatMoney(restanteAPagar)}
                      </TableCell>

                      <TableCell className="text-right font-semibold text-slate-900">
                        {formatMoney(prestamo.MontoCuota)}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                progreso === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-600">
                            {cuotasPagadas}/{cuotasTotales}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="capitalize font-medium text-slate-600 border-slate-300">
                          {prestamo.ModalidadPago}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-slate-600 font-medium text-sm">
                        {formatDate(prestamo.FechaInicio)}
                      </TableCell>

                      <TableCell className="text-slate-600 font-medium text-sm">
                        {formatDate(prestamo.FechaFinEstimada)}
                      </TableCell>

                      <TableCell className="text-slate-600 font-medium text-sm">
                        {formatDate(prestamo.FechaUltimoPago)}
                      </TableCell>

                      <TableCell className="text-right sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.15)] transition-colors">
                        <div className="flex justify-end gap-2">
                          {prestamo.Estado !== 'Pagado' && (
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all h-9 px-3"
                              onClick={(e) => handleOpenPay(e, prestamo)}
                              title="Registrar Pago"
                            >
                              <Banknote className="h-4 w-4 mr-1" />
                              Cobrar
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all"
                            onClick={(e) => { e.stopPropagation(); onEdit(prestamo); }}
                          >
                            <Edit className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 border-slate-300 hover:bg-red-50 hover:border-red-300 transition-all"
                            onClick={(e) => { e.stopPropagation(); onDelete(prestamo.IdPrestamo); }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- MODAL DE PAGO --- */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Banknote className="text-green-600" />
              Registrar Cobro
            </DialogTitle>
            <DialogDescription>Confirma los detalles para procesar el pago.</DialogDescription>
          </DialogHeader>

          {selectedPrestamo && (
            <div className="grid gap-6 py-4">
              <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">Cliente</span>
                  <span className="font-semibold">{selectedPrestamo.clienteNombre}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Monto Cuota</span>
                  <span className="text-xl font-bold text-green-700">
                    {formatMoney(selectedPrestamo.MontoCuota)}
                  </span>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="metodo" className="text-right">Método</Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Efectivo">Efectivo</SelectItem>
                      <SelectItem value="Transferencia">Transferencia</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="obs" className="text-right">Notas</Label>
                  <Input id="obs" placeholder="Opcional..." className="col-span-3" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handlePagoPersonalizado}>Personalizado</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmarPago} disabled={isPaying}>
              {isPaying ? "Procesando..." : "Cobrar Cuota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- MODAL DE DETALLES E HISTORIAL --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  {selectedPrestamo?.clienteNombre}
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  Detalle de movimientos y tabla de amortización
                </DialogDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-1.5 bg-white shadow-sm font-semibold">
                {selectedPrestamo?.Estado}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-2 border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Monto Prestado</div>
                  <div className="text-xl font-bold text-slate-800">{selectedPrestamo ? formatMoney(selectedPrestamo.MontoPrestado) : 0}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">Capital Restante</div>
                  <div className="text-xl font-bold text-[#213685]">{selectedPrestamo ? formatMoney(selectedPrestamo.CapitalRestante || selectedPrestamo.MontoPrestado) : 0}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-2 border-emerald-200 bg-emerald-50">
                <CardContent className="p-4">
                  <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">Cuota Actual</div>
                  <div className="text-xl font-bold text-emerald-700">{selectedPrestamo ? formatMoney(selectedPrestamo.MontoCuota) : 0}</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-2 border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="text-xs text-orange-700 font-bold uppercase tracking-wider mb-1">Próx. Vencimiento</div>
                  <div className="text-xl font-bold text-orange-600">
                    {selectedPrestamo && selectedPrestamo.Estado !== 'Pagado' 
                      ? getProximoPago(selectedPrestamo.FechaInicio, selectedPrestamo.ModalidadPago, (selectedPrestamo.CantidadCuotas - selectedPrestamo.CuotasRestantes))
                      : '---'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden bg-white">
            {isLoadingHistorial ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin mb-3 text-[#213685]" />
                <p>Cargando historial financiero...</p>
              </div>
            ) : (
              <ScrollArea className="h-full w-full">
                <div className="p-6">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10 shadow-sm">
                      <TableRow className="border-b-2 border-slate-200">
                        <TableHead className="w-[60px] text-center font-bold text-slate-800">#</TableHead>
                        <TableHead className="font-bold text-slate-800">Estado</TableHead>
                        <TableHead className="font-bold text-slate-800 text-right">Cuota</TableHead>
                        <TableHead className="font-bold text-slate-800 text-right">Interés</TableHead>
                        <TableHead className="font-bold text-slate-800 text-right">Capital</TableHead>
                        <TableHead className="font-bold text-slate-800 text-right">Saldo</TableHead>
                        <TableHead className="text-right font-bold text-slate-800">Detalle Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getTablaAmortizacionFusionada().map((fila: any) => {
                        const esPagado = fila.estado === 'Pagado';
                        return (
                          <TableRow 
                            key={fila.numeroCuota} 
                            className={`
                              ${esPagado ? "bg-green-50/70 hover:bg-green-50" : "hover:bg-slate-50"} 
                              transition-colors border-b border-slate-100
                            `}
                          >
                            <TableCell className="text-center font-bold text-slate-600">
                              {fila.numeroCuota}
                            </TableCell>
                            <TableCell>
                              {esPagado ? (
                                <Badge variant="outline" className="bg-white text-green-700 border-green-300 font-bold shadow-sm flex w-fit items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-300 font-medium">
                                  Pendiente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-700 font-semibold">
                              {formatMoney(fila.cuota)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-600 text-sm">
                              {formatMoney(fila.interes)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-600 text-sm">
                              {formatMoney(fila.capital)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-slate-800">
                              {formatMoney(fila.saldo)}
                            </TableCell>
                            <TableCell className="text-right">
                              {esPagado ? (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    {formatDate(fila.fechaPagoReal)}
                                  </span>
                                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                                    {fila.metodoPago}
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
          </div>
          
          <DialogFooter className="border-t-2 border-slate-200 p-4 bg-slate-50">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="font-semibold">
              Cerrar Detalle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}