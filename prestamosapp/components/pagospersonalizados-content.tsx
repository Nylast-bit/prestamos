"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect, useRef } from "react"
import { useReactToPrint } from "react-to-print" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trash2, Banknote, TrendingUp, Loader2, ArrowDownLeft, Printer } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import { VolantePago } from "@/components/VolantePagoPDF"

interface PagoPersonalizado {
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
    Prestatario?: {
      Nombre: string
    }
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// Helper para formato de moneda
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount)
}

export function PagosPersonalizadosContent() {
  const [pagos, setPagos] = useState<PagoPersonalizado[]>([])
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

  const prepararImpresion = (pago: PagoPersonalizado) => {
    const nombrePrestatario = pago.Prestamo?.Prestatario 
        ? pago.Prestamo.Prestatario.Nombre
        : "Cliente"

    // 1. Preparamos los datos planos para el componente VolantePago
    const datosVolante = {
        IdPago: pago.IdPago,
        FechaPago: pago.FechaPago,
        MontoPagado: pago.MontoPagado,
        Cliente: nombrePrestatario,
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
      const res = await fetchWithAuth(`${API_BASE_URL}/api/pagospersonalizados`)
      if (!res.ok) throw new Error('Error al cargar pagos personalizados')
      const data = await res.json()
      // Ordenamos por fecha descendente (lo más nuevo primero)
      const dataOrdenada = data.sort((a: PagoPersonalizado, b: PagoPersonalizado) => 
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
    const prestatarioNombre = pago.Prestamo?.Prestatario?.Nombre?.toLowerCase() || ""
    const prestatarioFullName = prestatarioNombre
    const idPago = pago.IdPago.toString()
    const idPrestamo = pago.IdPrestamo.toString()

    return prestatarioFullName.includes(term) || idPago.includes(term) || idPrestamo.includes(term)
  })

  // Cálculos de Totales
  const totalCobrado = pagos.reduce((sum, p) => sum + Number(p.MontoPagado), 0)
  const totalCapital = pagos.reduce((sum, p) => sum + Number(p.MontoCapitalAbonado), 0)
  const totalInteres = pagos.reduce((sum, p) => sum + Number(p.MontoInteresPagado), 0)

  // Manejo de la reversión (esto apuntará al endpoint general de pagos porque el pago es TipoPago: "Personalizado")
  const confirmDelete = (id: number) => {
    setPagoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!pagoToDelete) return
    setIsDeleting(true)

    try {
      // Revertir el pago usando el endpoint genérico de pagos
      const response = await fetchWithAuth(`${API_BASE_URL}/api/pagos/${pagoToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al revertir pago')
      }
      
      await fetchPagos()
      alert('Pago personalizado revertido exitosamente.') 
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
          <p>Cargando pagos personalizados...</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cobrado (P. Personalizados)</CardTitle>
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
              <CardTitle>Pagos Personalizados</CardTitle>
              <CardDescription>Registro detallado de transacciones personalizadas</CardDescription>
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

          <div className="rounded-md border auto-scroll overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold text-gray-700"># Recibo</TableHead>
                  <TableHead className="font-bold text-gray-700">Fecha</TableHead>
                  <TableHead className="font-bold text-gray-700">Prestatario / Préstamo</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Monto Total</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Desglose</TableHead>
                  <TableHead className="text-center font-bold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPagos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron pagos personalizados registrados
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
                                {pago.Prestamo?.Prestatario 
                                    ? pago.Prestamo.Prestatario.Nombre
                                    : "Cliente Desconocido"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Préstamo ID: {pago.IdPrestamo}
                            </span>
                        </div>
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
                        <div className="flex items-center justify-center gap-1">
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
                ¿Revertir este pago personalizado?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el registro de pago.
              <br/><br/>
              <span className="font-semibold text-gray-700">Acciones que se tomarán:</span>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                  <li>Se eliminará el registro de pago personalizado #{pagoToDelete}.</li>
                  <li>Se debería revertir el saldo del préstamo.</li>
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
