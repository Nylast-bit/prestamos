import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState } from "react"
import { useAuthStore } from "@/store/authStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, CalendarClock, Banknote, CheckCircle2, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Zap, TrendingDown, AlertCircle } from 'lucide-react'
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
export function PrestamoTable({ prestamos, onEdit, onDelete, onPaymentSuccess, onReenganchar }: any) {
  const { user } = useAuthStore();
  
  // Estados
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null);
  const [paymentType, setPaymentType] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Estados para los 5 modos de pago
  const [payMode, setPayMode] = useState<'cuota' | 'personalizado' | 'extraordinario' | 'liquidar' | 'reenganche'>('cuota');
  const [montoPersonalizado, setMontoPersonalizado] = useState("");
  const [montoLiquidar, setMontoLiquidar] = useState("");
  const [montoExtraordinario, setMontoExtraordinario] = useState("");
  const [interesPagadoEnPeriodo, setInteresPagadoEnPeriodo] = useState<number>(0);
  const [cargandoInteresCheck, setCargandoInteresCheck] = useState<boolean>(false);

  // Estados Detalle (Historial)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [historialPagos, setHistorialPagos] = useState<any[]>([]);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- CÁLCULOS DERIVADOS ---
  const capitalRestanteReal = selectedPrestamo 
    ? (selectedPrestamo.CapitalRestante ?? selectedPrestamo.MontoPrestado)
    : 0;

  // capital+interes: interés FIJO basado en MontoPrestado original
  // amortizable: interés VARIABLE basado en CapitalRestante actual
  const tipoCalculo = (selectedPrestamo?.TipoCalculo || '').toLowerCase();
  const baseInteres = (tipoCalculo.includes('amortiza') || tipoCalculo.includes('solo_interes') || tipoCalculo.includes('solo')) 
    ? capitalRestanteReal 
    : (selectedPrestamo?.MontoPrestado || 0);
  const interesMinimo = selectedPrestamo 
    ? baseInteres * (selectedPrestamo.InteresPorcentaje / 100)
    : 0;

  const yaPagoInteresPeriodo = interesPagadoEnPeriodo >= (interesMinimo - 0.01);

  const montoLiquidacionDefecto = selectedPrestamo
    ? capitalRestanteReal + interesMinimo
    : 0;

  const montoLiquidarNum = montoLiquidar !== "" ? parseFloat(montoLiquidar) || 0 : montoLiquidacionDefecto;
  const minimoLiquidacion = interesMinimo + (capitalRestanteReal * 0.5);
  const esMontoLiquidarValido = montoLiquidarNum >= minimoLiquidacion && montoLiquidarNum > 0;
  const descuentoOtorgado = Math.max(0, montoLiquidacionDefecto - montoLiquidarNum);

  const montoPersonalizadoNum = parseFloat(montoPersonalizado) || 0;
  const desgloseCapital = Math.max(0, montoPersonalizadoNum - interesMinimo);
  const desgloseInteres = Math.min(montoPersonalizadoNum, interesMinimo);
  const esMontoValido = montoPersonalizadoNum >= interesMinimo && montoPersonalizadoNum > 0;

  const montoExtraordinarioNum = parseFloat(montoExtraordinario) || 0;
  const nuevoCapitalPostExtraordinario = Math.max(0, capitalRestanteReal - montoExtraordinarioNum);

  // --- HANDLERS ---
  const checkInteresPeriodo = async (idPrestamo: number) => {
    try {
      setCargandoInteresCheck(true);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagos/historial/${idPrestamo}`);
      if (res.ok) {
        const historial = await res.json();
        const hoy = new Date();
        const hace15Dias = new Date(hoy.setDate(hoy.getDate() - 15));
        const pagosRecientes = (historial || []).filter((p: any) => new Date(p.FechaPago) >= hace15Dias);
        const totalInteres = pagosRecientes.reduce((sum: number, p: any) => sum + Number(p.MontoInteresPagado || 0), 0);
        setInteresPagadoEnPeriodo(totalInteres);
      }
    } catch (e) {
      console.error("Error verificando historial de interés:", e);
    } finally {
      setCargandoInteresCheck(false);
    }
  };

  const handleOpenPay = (e: React.MouseEvent, prestamo: any) => {
    e.stopPropagation();
    setSelectedPrestamo(prestamo);
    setPaymentType("Efectivo");
    setObservaciones("");
    const esSoloInteres = prestamo.TipoCalculo === "solo_interes";
    setPayMode(esSoloInteres ? 'personalizado' : 'cuota');
    setMontoPersonalizado("");
    setMontoLiquidar("");
    setMontoExtraordinario("");
    setInteresPagadoEnPeriodo(0);
    setIsPayOpen(true);
    checkInteresPeriodo(prestamo.IdPrestamo);
  };

  const getIdConsolidacionActiva = async () => {
    const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/consolidacioncapital/activa`);
    if (!res.ok) throw new Error("No se pudo obtener la consolidación activa. Verifica que exista una abierta.");
    const data = await res.json();
    return data.IdConsolidacion;
  };

  const handleConfirmarPago = async () => {
    if (!selectedPrestamo || isPaying) return;
    setIsPaying(true);

    try {
      if (!selectedPrestamo.IdPrestamo) {
          throw new Error("Error crítico: No se encuentra el ID del préstamo.");
      }

      if (payMode === 'cuota') {
        // === MODO 1: CUOTA ESTÁNDAR ===
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

        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al procesar el pago");

      } else if (payMode === 'personalizado') {
        // === MODO 2: PAGO PERSONALIZADO ===
        if (!esMontoValido) {
          throw new Error(`El monto mínimo es ${formatMoney(interesMinimo)} (interés del periodo).`);
        }

        const idConsolidacion = await getIdConsolidacionActiva();

        const payload = {
          idPrestamo: Number(selectedPrestamo.IdPrestamo),
          idConsolidacion,
          montoPagado: montoPersonalizadoNum,
          fechaPago: new Date().toISOString(),
          concepto: observaciones || `Pago personalizado - ${paymentType}`
        };

        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagospersonalizados`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al procesar el pago personalizado");

      } else if (payMode === 'extraordinario') {
        // === MODO 3: ABONO EXTRAORDINARIO A CAPITAL (100% DIRECTO A CAPITAL) ===
        if (montoExtraordinarioNum <= 0) {
          throw new Error("El monto del abono extraordinario debe ser mayor a RD$0.00.");
        }

        const idConsolidacion = await getIdConsolidacionActiva();

        const payload = {
          idPrestamo: Number(selectedPrestamo.IdPrestamo),
          idConsolidacion,
          montoPagado: montoExtraordinarioNum,
          fechaPago: new Date().toISOString(),
          concepto: observaciones || `Abono Extraordinario a Capital - ${paymentType}`,
          esAbonoExtraordinario: true
        };

        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagospersonalizados`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al procesar el abono extraordinario");

      } else if (payMode === 'liquidar') {
        // === MODO 4: LIQUIDACIÓN TOTAL (CON O SIN REBAJA) ===
        const idConsolidacion = await getIdConsolidacionActiva();

        const payload = {
          idPrestamo: Number(selectedPrestamo.IdPrestamo),
          idConsolidacion,
          montoPagado: montoLiquidarNum,
          fechaPago: new Date().toISOString(),
          concepto: observaciones || `Liquidación final del préstamo - ${paymentType}${descuentoOtorgado > 0 ? ` (Rebaja de ${formatMoney(descuentoOtorgado)})` : ''}`,
          esLiquidacion: true
        };

        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagospersonalizados`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al liquidar el préstamo");
      } else if (payMode === 'reenganche') {
        setIsPayOpen(false);
        if (onReenganchar) onReenganchar(selectedPrestamo);
        return;
      }

      alert(
        payMode === 'liquidar' 
          ? "¡Préstamo liquidado exitosamente!" 
          : (payMode === 'extraordinario' ? "¡Abono extraordinario a capital registrado correctamente!" : "¡Pago registrado correctamente!")
      );
      setIsPayOpen(false);
      if (onPaymentSuccess) onPaymentSuccess();
      
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleRowClick = async (prestamo: any) => {
    setSelectedPrestamo(prestamo);
    setIsDetailsOpen(true);
    setIsLoadingHistorial(true);
    setHistorialPagos([]); 

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagos/historial/${prestamo.IdPrestamo}`);
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
        // Si la entrada ya viene marcada como pagada desde el backend (pago personalizado)
        if (cuotaProyectada.pagado) {
            const pagoReal = historialPagos.find((p: any) => p.NumeroCuota === cuotaProyectada.numeroCuota);
            return {
                ...cuotaProyectada,
                estado: 'Pagado',
                fechaPagoReal: pagoReal ? pagoReal.FechaPago : null,
                metodoPago: pagoReal ? pagoReal.TipoPago : (cuotaProyectada.tipo === 'personalizado' ? 'Personalizado' : null),
                idPago: pagoReal ? pagoReal.IdPago : null
            };
        }
        // Si no, buscamos en el historial de pagos por NumeroCuota
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

  // Helper para el label del botón de confirmar
  const getBotonLabel = () => {
    if (isPaying) return "Procesando...";
    if (payMode === 'cuota') return "Cobrar Cuota";
    if (payMode === 'personalizado') return `Cobrar ${montoPersonalizadoNum > 0 ? formatMoney(montoPersonalizadoNum) : 'Personalizado'}`;
    if (payMode === 'extraordinario') return `Abonar ${montoExtraordinarioNum > 0 ? formatMoney(montoExtraordinarioNum) : 'a Capital'}`;
    if (payMode === 'reenganche') return "Ir a Reenganche";
    return `Liquidar ${montoLiquidarNum > 0 ? formatMoney(montoLiquidarNum) : ''}`;
  };

  const prestamosVisibles = prestamos.filter((p: any) => p.Estado !== 'Eliminado');

  // Cálculos de Paginación
  const totalItems = prestamosVisibles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(totalItems, validPage * pageSize);
  const paginatedPrestamos = prestamosVisibles.slice(startIndex, endIndex);

  return (
    <>
      <div className="rounded-xl border-2 border-slate-200 shadow-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200 hover:bg-gradient-to-r">
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider py-4 w-16">ID</TableHead>
                <TableHead className="font-bold text-slate-800 text-xs uppercase tracking-wider py-4">Cliente</TableHead>
                <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider">Capital Restante</TableHead>
                <TableHead className="text-right font-bold text-slate-800 text-xs uppercase tracking-wider">Interés Actual</TableHead>
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
              {paginatedPrestamos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-16 text-slate-400">
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
                paginatedPrestamos.map((prestamo: any, idx: number) => {
                  // Contar progreso desde TablaPagos para incluir pagos personalizados insertados
                  let cuotasTotales = prestamo.CantidadCuotas || 0;
                  let cuotasPagadas = cuotasTotales - (prestamo.CuotasRestantes || 0);
                  try {
                    const tabla = JSON.parse(prestamo.TablaPagos || '[]');
                    const pagadasEnTabla = tabla.filter((c: any) => c.pagado).length;
                    if (pagadasEnTabla > 0) {
                      cuotasTotales = tabla.length;
                      cuotasPagadas = pagadasEnTabla;
                    }
                  } catch (e) { /* fallback a CantidadCuotas */ }
                  const progreso = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0;
                  
                  const capRestante = prestamo.CapitalRestante !== undefined && prestamo.CapitalRestante !== null ? Number(prestamo.CapitalRestante) : Number(prestamo.MontoPrestado);
                  const interesActual = capRestante * (prestamo.InteresPorcentaje / 100);
                  const restanteAPagar = prestamo.TipoCalculo === "solo_interes"
                    ? (capRestante + (capRestante * (Number(prestamo.InteresPorcentaje) / 100)))
                    : (prestamo.MontoCuota * (prestamo.CuotasRestantes || 0));

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
                      <TableCell className="py-4">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold tabular-nums" title={`ID Interno: ${prestamo.IdPrestamo}`}>
                          #{prestamo.NumeroEmpresa ?? prestamo.IdPrestamo}
                        </span>
                      </TableCell>

                      <TableCell className="font-semibold text-slate-900 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {prestamo.clienteNombre?.charAt(0) || '?'}
                          </div>
                          <span className="group-hover:text-blue-700 transition-colors">{prestamo.clienteNombre}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-semibold text-slate-700">
                        {formatMoney(capRestante)}
                      </TableCell>

                      <TableCell className="text-right text-slate-600 font-medium">
                        {formatMoney(interesActual)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold px-3 py-1" title={`Tasa real guardada: ${prestamo.InteresPorcentaje}%`}>
                          {Number(prestamo.InteresPorcentaje).toFixed(2)}%
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
                          {(() => {
                            const isCajero = user?.rol === 'Cajero';
                            const isPrestamista = user?.rol === 'Prestamista';
                            const esMio = prestamo.IdPrestatario === user?.idPrestatario;
                            const puedeCobrar = !isPrestamista || esMio;
                            const puedeEditarOEliminar = !isCajero && (!isPrestamista || esMio);

                            return (
                              <>
                                {prestamo.Estado !== 'Pagado' && (
                                  <>
                                    <Button 
                                      variant="default" 
                                      size="sm" 
                                      disabled={!puedeCobrar}
                                      className={`shadow-md hover:shadow-lg transition-all h-9 px-3 ${
                                        puedeCobrar 
                                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white' 
                                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                      }`}
                                      onClick={(e) => puedeCobrar && handleOpenPay(e, prestamo)}
                                      title={puedeCobrar ? "Registrar Cobro u Opciones de Pago" : "Solo el prestamista asignado puede cobrar este préstamo"}
                                    >
                                      <Banknote className="h-4 w-4 mr-1" />
                                      Cobrar
                                    </Button>
                                  </>
                                )}
                                {puedeEditarOEliminar && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-9 px-3 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all"
                                      onClick={(e) => { e.stopPropagation(); onEdit(prestamo); }}
                                      title="Editar Préstamo"
                                    >
                                      <Edit className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-9 px-3 border-slate-300 hover:bg-red-50 hover:border-red-300 transition-all"
                                      onClick={(e) => { e.stopPropagation(); onDelete(prestamo.IdPrestamo); }}
                                      title="Eliminar Préstamo"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- BARRA DE PAGINACIÓN DE PRÉSTAMOS --- */}
        {prestamosVisibles.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>registros por página</span>
              <span className="text-slate-400 ml-2">
                (Mostrando {totalItems > 0 ? startIndex + 1 : 0} - {endIndex} de {totalItems})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={validPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={validPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="px-3 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800">
                Página {validPage} de {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DE PAGO (3 MODOS) --- */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Banknote className="text-green-600" />
              Registrar Cobro — {selectedPrestamo?.clienteNombre}
            </DialogTitle>
            <DialogDescription>Selecciona el tipo de cobro que deseas aplicar.</DialogDescription>
          </DialogHeader>

          {selectedPrestamo && (
            <div className="grid gap-5 py-2">
              
              {/* === SELECTOR DE MODO (5 OPCIONES) === */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedPrestamo.TipoCalculo !== 'solo_interes' && (
                  <button
                    type="button"
                    onClick={() => setPayMode('cuota')}
                    className={`px-2.5 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                      payMode === 'cuota' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarClock className="h-4 w-4 mx-auto mb-1" />
                    Cuota
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPayMode('personalizado')}
                  className={`px-2.5 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                    payMode === 'personalizado' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="h-4 w-4 mx-auto mb-1" />
                  Personalizado
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('extraordinario')}
                  className={`px-2.5 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                    payMode === 'extraordinario' 
                      ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Zap className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                  Abono Capital
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('liquidar')}
                  className={`px-2.5 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                    payMode === 'liquidar' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />
                  Liquidar
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('reenganche')}
                  className={`px-2.5 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all col-span-2 sm:col-span-1 ${
                    payMode === 'reenganche' 
                      ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-sm' 
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <RefreshCw className="h-4 w-4 mx-auto mb-1 text-amber-700" />
                  Reenganchar
                </button>
              </div>

              {/* === CONTENIDO SEGÚN MODO === */}
              
              {payMode === 'cuota' && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                    <span className="text-sm text-emerald-700">Cuota #{(selectedPrestamo.CantidadCuotas - selectedPrestamo.CuotasRestantes) + 1} de {selectedPrestamo.CantidadCuotas}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">{selectedPrestamo.CuotasRestantes} restantes</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700 font-medium">Monto a cobrar</span>
                    <span className="text-2xl font-bold text-emerald-800">
                      {formatMoney(selectedPrestamo.MontoCuota)}
                    </span>
                  </div>
                </div>
              )}

              {payMode === 'personalizado' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">Interés mínimo del periodo</span>
                      <span className="font-bold text-blue-800">{formatMoney(interesMinimo)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">Capital restante</span>
                      <span className="font-bold text-blue-800">{formatMoney(capitalRestanteReal)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-semibold">Monto a cobrar</Label>
                    <Input
                      type="number"
                      placeholder={`Mínimo ${formatMoney(interesMinimo)}`}
                      value={montoPersonalizado}
                      onChange={(e) => setMontoPersonalizado(e.target.value)}
                      className={`text-lg font-semibold ${montoPersonalizadoNum > 0 && !esMontoValido ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                      min={0}
                      step="0.01"
                    />
                    {montoPersonalizadoNum > 0 && !esMontoValido && (
                      <p className="text-xs text-red-500 font-medium">⚠️ El monto debe cubrir al menos el interés: {formatMoney(interesMinimo)}</p>
                    )}
                  </div>

                  {montoPersonalizadoNum > 0 && esMontoValido && (
                    <div className="bg-slate-50 p-3 rounded-lg border space-y-1 text-sm">
                      <p className="font-semibold text-slate-700 mb-2">Desglose estimado:</p>
                      <div className="flex justify-between">
                        <span className="text-slate-500">→ Interés cobrado</span>
                        <span className="font-mono font-semibold text-orange-600">{formatMoney(desgloseInteres)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">→ Abono a capital</span>
                        <span className="font-mono font-semibold text-green-600">{formatMoney(desgloseCapital)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {payMode === 'extraordinario' && (
                <div className="space-y-4">
                  {!yaPagoInteresPeriodo ? (
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                        Barrera del Interés Pendiente
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Para registrar un <strong>Abono Directo a Capital</strong> (0% Interés), el préstamo debe tener el interés del período (<strong>{formatMoney(interesMinimo)}</strong>) cubierto previamente. En este período se ha registrado <strong>{formatMoney(interesPagadoEnPeriodo)}</strong> de interés.
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium pt-1">
                        💡 Utiliza primero la opción <strong>Personalizado</strong> o <strong>Cuota</strong> para registrar el cobro de interés del período.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-purple-50 p-3.5 rounded-lg border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-purple-600" />
                          Barrera Cumplida — Abono Directo a Capital
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                          0% Interés — 100% Capital
                        </Badge>
                      </div>
                      <p className="text-xs text-purple-700">
                        El interés del período (<strong>{formatMoney(interesMinimo)}</strong>) ya fue cubierto. El 100% del dinero ingresado se descontará directamente del Capital Restante.
                      </p>
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-purple-200">
                        <span className="text-purple-800">Capital Restante Actual:</span>
                        <span className="font-bold text-purple-950 text-sm">{formatMoney(capitalRestanteReal)}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="montoExtraordinario" className="text-xs font-bold text-slate-800">
                      Monto a Abonar al Capital ($)
                    </Label>
                    <Input
                      id="montoExtraordinario"
                      type="number"
                      placeholder={yaPagoInteresPeriodo ? "Ej. 5000.00" : "Bloqueado (Cubre el interés primero)"}
                      disabled={!yaPagoInteresPeriodo}
                      value={montoExtraordinario}
                      onChange={(e) => setMontoExtraordinario(e.target.value)}
                      className={`text-lg font-bold bg-white ${!yaPagoInteresPeriodo ? 'opacity-60 cursor-not-allowed border-amber-300' : 'text-purple-900 border-purple-300 focus:border-purple-500'}`}
                      min={0}
                      step="0.01"
                    />
                  </div>

                  {montoExtraordinarioNum > 0 && yaPagoInteresPeriodo && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Capital Actual:</span>
                        <span className="font-mono font-medium">{formatMoney(capitalRestanteReal)}</span>
                      </div>
                      <div className="flex justify-between text-purple-700 font-semibold">
                        <span>- Abono Directo a Capital (100%):</span>
                        <span className="font-mono">-{formatMoney(montoExtraordinarioNum)}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900 text-sm">
                        <span>Nuevo Capital Restante:</span>
                        <span className="text-emerald-700">{formatMoney(nuevoCapitalPostExtraordinario)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {payMode === 'liquidar' && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-3">
                  <div className="flex justify-between items-center text-xs text-orange-800 font-semibold border-b border-orange-200 pb-2">
                    <span>Resumen del Préstamo</span>
                    <span>Mínimo liquidable: {formatMoney(minimoLiquidacion)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-b border-orange-200 pb-2">
                    <div>
                      <span className="text-slate-500">Capital Restante:</span>
                      <p className="font-semibold text-slate-800">{formatMoney(capitalRestanteReal)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Interés del período:</span>
                      <p className="font-semibold text-slate-800">{formatMoney(interesMinimo)}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="montoLiquidar" className="text-xs font-bold text-orange-900">
                        Monto Final de Liquidación ($)
                      </Label>
                      {descuentoOtorgado > 0 && esMontoLiquidarValido && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Rebaja: {formatMoney(descuentoOtorgado)}
                        </span>
                      )}
                    </div>
                    <Input
                      id="montoLiquidar"
                      type="number"
                      step="50"
                      className="font-bold text-lg text-orange-900 border-orange-300 focus:border-orange-500 bg-white"
                      value={montoLiquidar}
                      onChange={(e) => setMontoLiquidar(e.target.value)}
                      placeholder={montoLiquidacionDefecto.toString()}
                    />
                    {!esMontoLiquidarValido && (
                      <p className="text-xs text-red-600 font-medium pt-1">
                        ⚠️ Para liquidar, el monto mínimo es de {formatMoney(minimoLiquidacion)} (Interés + 50% de Capital restante).
                      </p>
                    )}
                  </div>
                </div>
              )}

              {payMode === 'reenganche' && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <RefreshCw className="h-4 w-4 text-amber-700" />
                    Reenganche de Préstamo
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Permite a <strong>{selectedPrestamo.clienteNombre}</strong> solicitar un nuevo préstamo por un monto mayor, liquidando automáticamente el saldo pendiente actual de <strong>{formatMoney(capitalRestanteReal)}</strong> y entregando en efectivo únicamente la diferencia neta.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsPayOpen(false);
                      if (onReenganchar) onReenganchar(selectedPrestamo);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold h-10 shadow-sm mt-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Abrir Formulario de Reenganche
                  </Button>
                </div>
              )}

              {/* === CAMPOS COMUNES (MÉTODO Y NOTAS) === */}
              {payMode !== 'reenganche' && (
                <div className="grid gap-4 pt-1">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="metodo" className="text-right text-xs font-semibold">Método</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger className="col-span-3 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Efectivo">Efectivo</SelectItem>
                        <SelectItem value="Transferencia">Transferencia</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="obs" className="text-right text-xs font-semibold">Notas</Label>
                    <Input id="obs" placeholder="Opcional..." className="col-span-3 h-9 text-xs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsPayOpen(false)} disabled={isPaying}>Cancelar</Button>
            {payMode !== 'reenganche' && (
              <Button 
                size="sm"
                className={`text-white font-semibold text-xs ${
                  payMode === 'cuota' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                  payMode === 'personalizado' ? 'bg-blue-600 hover:bg-blue-700' : 
                  payMode === 'extraordinario' ? 'bg-purple-600 hover:bg-purple-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
                onClick={handleConfirmarPago} 
                disabled={
                  isPaying || 
                  (payMode === 'personalizado' && !esMontoValido) || 
                  (payMode === 'liquidar' && !esMontoLiquidarValido) ||
                  (payMode === 'extraordinario' && (!yaPagoInteresPeriodo || !montoExtraordinarioNum || montoExtraordinarioNum <= 0))
                }
              >
                {isPaying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {getBotonLabel()}
              </Button>
            )}
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
              <Badge variant="outline" className="text-md px-4 mr-4 py-1.5 bg-white shadow-sm font-semibold">
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