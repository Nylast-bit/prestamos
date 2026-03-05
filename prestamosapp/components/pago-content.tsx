"use client"

import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print" // <--- Importante
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trash2, Banknote, TrendingUp, Loader2, ArrowDownLeft, Printer } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Importamos el diseño de la factura (Asegúrate de haber creado este archivo)
import { VolantePago } from "@/components/VolantePagoPDF"

// Definimos la interfaz basada en tu JSON exacto
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
  // Estructura anidada
  Prestamo?: {
    IdPrestamo: number
    Cliente?: {
      Nombre: string
    }
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// Helper para formato de moneda
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount)
}

export function PagosContent() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para el borrado (Reversión)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pagoToDelete, setPagoToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // --- LÓGICA DE IMPRESIÓN ---
  const [pagoParaImprimir, setPagoParaImprimir] = useState<any>(null)
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Recibo-${pagoParaImprimir?.IdPago || 'Generico'}`,
  })

  const prepararImpresion = (pago: Pago) => {
    // 1. Preparamos los datos planos para el componente VolantePago
    const datosVolante = {
        IdPago: pago.IdPago,
        FechaPago: pago.FechaPago,
        MontoPagado: pago.MontoPagado,
        Cliente: pago.Prestamo?.Cliente?.Nombre || "Cliente",
        IdPrestamo: pago.IdPrestamo,
        NumeroCuota: pago.NumeroCuota,
        Observaciones: pago.Observaciones,
        TipoPago: pago.TipoPago
    }

    setPagoParaImprimir(datosVolante)

    // 2. Esperamos un momento a que React renderice los datos en el div oculto antes de imprimir
    setTimeout(() => {
        handlePrint()
    }, 100)
  }
  // ---------------------------

  useEffect(() => {
    fetchPagos()
  }, [])

  async function fetchPagos() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/pagos`)
      if (!res.ok) throw new Error('Error al cargar pagos')
      const data = await res.json()
      // Ordenamos por fecha descendente (lo más nuevo primero)
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

  // Filtrado inteligente
  const filteredPagos = pagos.filter(pago => {
    const term = searchTerm.toLowerCase()
    const clienteNombre = pago.Prestamo?.Cliente?.Nombre?.toLowerCase() || ""
    const idPago = pago.IdPago.toString()
    const idPrestamo = pago.IdPrestamo.toString()

    return clienteNombre.includes(term) || idPago.includes(term) || idPrestamo.includes(term)
  })

  // Cálculos de Totales
  const totalCobrado = pagos.reduce((sum, p) => sum + Number(p.MontoPagado), 0)
  const totalCapital = pagos.reduce((sum, p) => sum + Number(p.MontoCapitalAbonado), 0)
  const totalInteres = pagos.reduce((sum, p) => sum + Number(p.MontoInteresPagado), 0)

  // Manejo de la reversión
  const confirmDelete = (id: number) => {
    setPagoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!pagoToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/pagos/${pagoToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al revertir pago')
      }
      
      await fetchPagos()
      alert('Pago revertido exitosamente.') 
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setPagoToDelete(null)
    }
  }

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Cargando historial de pagos...</p>
      </div>
  )

  return (
    <div className="space-y-6">
      
      {/* --- COMPONENTE OCULTO PARA IMPRESIÓN --- */}
      <div style={{ display: "none" }}>
        <VolantePago ref={componentRef} data={pagoParaImprimir} />
      </div>

      {/* --- DASHBOARD DE RESUMEN --- */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-[#213685] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cobrado</CardTitle>
            <Banknote className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{formatMoney(totalCobrado)}</div>
            <p className="text-xs text-muted-foreground">Ingresos brutos totales</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Capital Recuperado</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatMoney(totalCapital)}</div>
            <p className="text-xs text-muted-foreground">Retorno de inversión</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Intereses Ganados</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatMoney(totalInteres)}</div>
            <p className="text-xs text-muted-foreground">Ganancia neta</p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLA DE PAGOS --- */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Registro detallado de todas las transacciones recibidas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Buscador */}
          <div className="flex items-center space-x-2 mb-4 bg-gray-50 p-2 rounded-md border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, ID de pago o préstamo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-gray-700"># Recibo</TableHead>
                  <TableHead className="font-bold text-gray-700">Fecha</TableHead>
                  <TableHead className="font-bold text-gray-700">Cliente / Préstamo</TableHead>
                  <TableHead className="font-bold text-gray-700">Cuota</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Monto Total</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Desglose</TableHead>
                  <TableHead className="text-center font-bold text-gray-700">Método</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPagos.map((pago) => (
                    <TableRow key={pago.IdPago} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs font-medium text-gray-500">
                        #{pago.IdPago.toString().padStart(4, '0')}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">
                                {new Date(pago.FechaPago).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-gray-400">
                                {new Date(pago.FechaPago).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold text-[#213685]">
                                {pago.Prestamo?.Cliente?.Nombre || "Cliente Desconocido"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Préstamo ID: {pago.IdPrestamo}
                            </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                            Cuota {pago.NumeroCuota}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-bold text-green-700 text-base">
                            {formatMoney(pago.MontoPagado)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                         <div className="flex flex-col text-xs">
                            <span className="text-gray-600">Cap: <b>{formatMoney(pago.MontoCapitalAbonado)}</b></span>
                            <span className="text-gray-400">Int: {formatMoney(pago.MontoInteresPagado)}</span>
                         </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                            {pago.TipoPago}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                            {/* BOTÓN IMPRIMIR */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => prepararImpresion(pago)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                title="Imprimir Recibo"
                            >
                                <Printer className="h-4 w-4" />
                            </Button>

                            {/* BOTÓN REVERTIR */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(pago.IdPago)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
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
            <AlertDialogDescription>
              Estás a punto de eliminar el registro de pago.
              <br/><br/>
              <span className="font-semibold text-gray-700">Acciones que se tomarán:</span>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                  <li>Se eliminará el registro de pago #{pagoToDelete}.</li>
                  <li>Se debería revertir el saldo del préstamo (Sumar cuota pendiente).</li>
                  <li>Se debería anular el registro en la consolidación.</li>
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