"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, Trash2, Banknote, TrendingUp, Loader2, ArrowDownLeft, Printer,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Sparkles, Calendar, DollarSign, Zap, CreditCard
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import { VolantePago } from "@/components/VolantePagoPDF"

interface Pago {
  IdPago: number
  IdPrestamo: number
  FechaPago: string
  TipoPago: string
  MontoPagado: number
  MontoInteresPagado: number
  MontoCapitalAbonado: number
  CuotasRestantes: number
  Observaciones: string
  NumeroCuota: number
  Prestamo?: {
    IdPrestamo: number;
    FechaInicio: string;
    FechaFinEstimada: string;
    CapitalRestante: number;
    MontoCuota: number;
    CantidadCuotas: number;
    TipoCalculo?: string;
    InteresPorcentaje?: number;
    Cliente?: {
      Nombre: string;
    };
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount)
}

export function PagosContent() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'cuota' | 'personalizado'>('todos')
  
  // Estados para Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Estados para Reversión
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pagoToDelete, setPagoToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Impresión
  const [pagoParaImprimir, setPagoParaImprimir] = useState<any>(null)
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Recibo-${pagoParaImprimir?.IdPago || 'Generico'}`,
  })

  // Resetear la página al filtrar o buscar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filtroTipo])

  const prepararImpresion = (pago: Pago) => {
    const esSoloInteres = pago.Prestamo?.TipoCalculo === "solo_interes";
    const capitalRegular = Number(pago.MontoCapitalAbonado || 0);
    const capitalExtra = 0;

    const montoCuota = (pago.Prestamo?.MontoCuota && Number(pago.Prestamo.MontoCuota) > 0)
      ? Number(pago.Prestamo.MontoCuota)
      : Number(pago.MontoPagado || 0);

    const cuotasTotales = Number(pago.Prestamo?.CantidadCuotas || 0);
    const cuotasRestantes = (pago.CuotasRestantes !== undefined && pago.CuotasRestantes !== null)
      ? Number(pago.CuotasRestantes)
      : Math.max(0, cuotasTotales - Number(pago.NumeroCuota));

    const capRestante = pago.Prestamo?.CapitalRestante !== undefined && pago.Prestamo?.CapitalRestante !== null ? Number(pago.Prestamo.CapitalRestante) : 0;
    const interesPorc = pago.Prestamo?.InteresPorcentaje !== undefined ? Number(pago.Prestamo.InteresPorcentaje) : 0;

    let montoPendienteCalculado = esSoloInteres
      ? (capRestante + (capRestante * (interesPorc / 100)))
      : (montoCuota * cuotasRestantes);

    if (montoPendienteCalculado === 0 && pago.Prestamo?.CapitalRestante && Number(pago.Prestamo.CapitalRestante) > 0) {
      montoPendienteCalculado = Number(pago.Prestamo.CapitalRestante);
    }

    const datosVolante = {
        IdPago: pago.IdPago,
        FechaPago: pago.FechaPago,
        MontoPagado: Number(pago.MontoPagado),
        Cliente: pago.Prestamo?.Cliente?.Nombre || "Cliente Desconocido",
        IdPrestamo: pago.IdPrestamo,
        NumeroCuota: pago.NumeroCuota,
        Observaciones: pago.Observaciones || "",
        TipoPago: pago.TipoPago,
        PagoCapital: capitalRegular,
        PagoInteres: Number(pago.MontoInteresPagado),
        PagoAbono: capitalExtra,
        PagoMora: 0,
        InicioPrestamo: pago.Prestamo?.FechaInicio || "",
        TerminoPrestamo: pago.Prestamo?.FechaFinEstimada || "",
        MontoPendiente: montoPendienteCalculado,
        CuotasTotales: cuotasTotales,
        CuotasRestantes: cuotasRestantes,
        MontoCuota: montoCuota
    }

    setPagoParaImprimir(datosVolante)

    setTimeout(() => {
        handlePrint()
    }, 150)
  }

  useEffect(() => {
    fetchPagos()
  }, [])

  async function fetchPagos() {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/pagos`)
      if (!res.ok) throw new Error('Error al cargar pagos')
      const data = await res.json()
      const dataOrdenada = data.sort((a: Pago, b: Pago) => 
        new Date(b.FechaPago).getTime() - new Date(a.FechaPago).getTime()
      )
      setPagos(dataOrdenada)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Filtrado
  const filteredPagos = pagos.filter(pago => {
    const term = searchTerm.toLowerCase()
    const clienteNombre = pago.Prestamo?.Cliente?.Nombre?.toLowerCase() || ""
    const idPago = pago.IdPago.toString()
    const idPrestamo = pago.IdPrestamo.toString()

    const matchSearch = clienteNombre.includes(term) || idPago.includes(term) || idPrestamo.includes(term)
    const matchTipo = filtroTipo === 'todos' ? true 
      : filtroTipo === 'personalizado' ? (pago.TipoPago === 'Personalizado' || pago.TipoPago === 'Liquidación')
      : (pago.TipoPago !== 'Personalizado' && pago.TipoPago !== 'Liquidación')
    return matchSearch && matchTipo
  })

  // Paginación
  const totalItems = filteredPagos.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const validPage = Math.min(currentPage, totalPages)
  const startIndex = (validPage - 1) * pageSize
  const endIndex = Math.min(totalItems, validPage * pageSize)
  const paginatedPagos = filteredPagos.slice(startIndex, endIndex)

  // -------------------------------------------------------------
  // 💡 INSIGHTS & CÁLCULOS FINANCIEROS INTELIGENTES
  // -------------------------------------------------------------
  const totalCobrado = pagos.reduce((sum, p) => sum + Number(p.MontoPagado), 0)
  const totalCapital = pagos.reduce((sum, p) => sum + Number(p.MontoCapitalAbonado), 0)
  const totalInteres = pagos.reduce((sum, p) => sum + Number(p.MontoInteresPagado), 0)

  // Filtros de fecha para Insights
  const hoyStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
  const mesActual = new Date().getMonth()
  const anioActual = new Date().getFullYear()

  const pagosHoy = pagos.filter(p => {
    try {
      return new Date(p.FechaPago).toLocaleDateString('en-CA') === hoyStr
    } catch { return false }
  })
  const cobradoHoy = pagosHoy.reduce((sum, p) => sum + Number(p.MontoPagado), 0)

  const pagosMes = pagos.filter(p => {
    try {
      const d = new Date(p.FechaPago)
      return d.getMonth() === mesActual && d.getFullYear() === anioActual
    } catch { return false }
  })
  const cobradoMes = pagosMes.reduce((sum, p) => sum + Number(p.MontoPagado), 0)

  const ticketPromedio = pagos.length > 0 ? totalCobrado / pagos.length : 0
  const pctInteres = totalCobrado > 0 ? ((totalInteres / totalCobrado) * 100).toFixed(1) : '0'
  const pctCapital = totalCobrado > 0 ? ((totalCapital / totalCobrado) * 100).toFixed(1) : '0'

  const countEfectivo = pagos.filter(p => p.TipoPago === 'Efectivo').length
  const countTransferencia = pagos.filter(p => p.TipoPago === 'Transferencia').length
  const metodoLider = countEfectivo >= countTransferencia ? 'Efectivo' : 'Transferencia'

  // Reversión
  const confirmDelete = (id: number) => {
    setPagoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!pagoToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/pagos/${pagoToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al revertir pago')
      }
      
      await fetchPagos()
      toast.success('Pago revertido exitosamente.') 
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setPagoToDelete(null)
    }
  }

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2 text-[#213685]" />
          <p className="font-medium text-sm text-slate-600">Cargando historial de pagos...</p>
      </div>
  )

  return (
    <div className="space-y-6">
      
      {/* Componente Oculto para Impresión */}
      <div style={{ display: "none" }}>
        <VolantePago ref={componentRef} data={pagoParaImprimir} />
      </div>

      {/* --- DASHBOARD DE INSIGHTS FINANCIEROS (4 CARDS) --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Histórico</CardTitle>
            <Banknote className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{formatMoney(totalCobrado)}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {pagos.length} cobros registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cobrado Este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{formatMoney(cobradoMes)}</div>
            <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              Hoy: {formatMoney(cobradoHoy)} ({pagosHoy.length} cobros)
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ganancia Neta (Intereses)</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatMoney(totalInteres)}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Margen de Ganancia: <strong className="text-amber-700 font-bold">{pctInteres}%</strong> del total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pago Promedio</CardTitle>
            <CreditCard className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">{formatMoney(ticketPromedio)}</div>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              Método líder: <strong className="text-indigo-800 font-semibold">{metodoLider}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- BANNER FINANCIERO CREATIVO --- */}
      <div className="bg-gradient-to-r from-[#213685] via-blue-900 to-indigo-900 text-white rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              Resumen de Recuperación Financiera
            </h4>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Del total ingresado ({formatMoney(totalCobrado)}), el <span className="font-bold text-emerald-300">{pctCapital}%</span> corresponde a devolución de capital recuperado ({formatMoney(totalCapital)}) y el <span className="font-bold text-amber-300">{pctInteres}%</span> a intereses ganados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center bg-white/10 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border border-white/10">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>Cobros de Hoy: <strong>{formatMoney(cobradoHoy)}</strong></span>
        </div>
      </div>

      {/* --- TABLA DE PAGOS --- */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-slate-800 text-lg">Historial de Pagos</CardTitle>
              <CardDescription className="text-xs">Registro detallado y auditable de todas las transacciones recibidas</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Buscador y Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 bg-slate-50 border-y border-slate-200">
            <div className="flex items-center space-x-2 flex-1 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
              <Search className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente, recibo o préstamo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent text-xs focus-visible:ring-0 focus-visible:ring-offset-0 h-7"
              />
            </div>
            
            <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 shadow-sm">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${filtroTipo === 'todos' ? 'bg-[#213685] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >Todos ({pagos.length})</button>
              <button
                onClick={() => setFiltroTipo('cuota')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${filtroTipo === 'cuota' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >Cuotas Regular</button>
              <button
                onClick={() => setFiltroTipo('personalizado')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${filtroTipo === 'personalizado' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >Personalizados / Liq.</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  <TableHead className="font-bold text-slate-700 text-xs py-3.5"># Recibo</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Fecha</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Cliente / Préstamo</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Cuota</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 text-xs">Monto Total</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 text-xs">Desglose</TableHead>
                  <TableHead className="text-center font-bold text-slate-700 text-xs">Método</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 text-xs pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      No se encontraron pagos con los criterios seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPagos.map((pago) => (
                    <TableRow key={pago.IdPago} className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-slate-600">
                        #{pago.IdPago.toString().padStart(4, '0')}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800">
                            {new Date(pago.FechaPago).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(pago.FechaPago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-[#213685]">
                            {pago.Prestamo?.Cliente?.Nombre || "Cliente Desconocido"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Préstamo #{pago.IdPrestamo}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5 bg-slate-50">
                          {pago.TipoPago === 'Liquidación' ? 'Liquidación' : `Cuota ${pago.NumeroCuota}`}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-bold text-emerald-700 text-sm font-mono">
                          {formatMoney(pago.MontoPagado)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                         <div className="flex flex-col text-[11px]">
                            <span className="text-slate-700">Cap: <b>{formatMoney(pago.MontoCapitalAbonado)}</b></span>
                            <span className="text-slate-400">Int: {formatMoney(pago.MontoInteresPagado)}</span>
                         </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            pago.TipoPago === 'Personalizado' ? 'bg-blue-100 text-blue-800' :
                            pago.TipoPago === 'Liquidación' ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pago.TipoPago}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => prepararImpresion(pago)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Imprimir Recibo"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(pago.IdPago)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Revertir Pago"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* --- BARRA DE PAGINACIÓN DE PAGOS --- */}
          {filteredPagos.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-600">
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
                <span>pagos por página</span>
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
        </CardContent>
      </Card>

      {/* --- DIÁLOGO DE CONFIRMACIÓN DE REVERSIÓN --- */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                ¿Revertir este pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2 text-slate-600">
              <span>Estás a punto de eliminar el registro de pago.</span>
              <br/>
              <span className="font-semibold text-slate-700">Acciones automáticas que se tomarán:</span>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-slate-600">
                  <li>Se eliminará el recibo de pago #{pagoToDelete}.</li>
                  <li>Se restaurará el saldo y capital del préstamo correspondientes.</li>
                  <li>Se anulará el registro en la consolidación de caja.</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setPagoToDelete(null)}>
                Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Revirtiendo..." : "Confirmar Reversión"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}