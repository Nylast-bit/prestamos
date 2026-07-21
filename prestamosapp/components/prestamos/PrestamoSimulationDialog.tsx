// 📄 ARCHIVO: components/prestamo-simulation-dialog.tsx

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Wallet, Calculator, CalendarClock, RefreshCw, Loader2 } from 'lucide-react'

// Helper para formato de dinero exacto
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export function PrestamoSimulationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  resumen, 
  cuotas, 
  isSubmitting,
  onRecalcularCuota
}: any) {
  const [cuotaInput, setCuotaInput] = useState<string>("")
  const [loadingAjuste, setLoadingAjuste] = useState(false)

  useEffect(() => {
    if (resumen && resumen.montoCuota) {
      setCuotaInput(resumen.montoCuota.toString())
    }
  }, [resumen])

  if (!resumen) return null;

  const handleAjustarTasa = async () => {
    const val = parseFloat(cuotaInput)
    if (isNaN(val) || val <= 0 || !onRecalcularCuota) return

    setLoadingAjuste(true)
    try {
      await onRecalcularCuota(val)
    } finally {
      setLoadingAjuste(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        
        <DialogHeader className="px-6 py-4 border-b bg-white">
            <div className="flex items-center justify-between">
                <div>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-[#213685]">
                        <Calculator className="h-5 w-5" />
                        Simulación de Préstamo
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                        Desglose financiero del nuevo préstamo. Modifica la cuota para recalcular el interés.
                    </DialogDescription>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                    {resumen.numeroCuotas} Cuotas
                </Badge>
            </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Monto Prestado</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                                {formatMoney(resumen.montoSolicitado)}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Interés Total</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-xl font-bold text-orange-600">
                                    {formatMoney(resumen.montoTotalInteres)}
                                </p>
                                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded cursor-help" title={`Tasa de interés real guardada: ${resumen.tasaInteres}%`}>
                                    {Number(resumen.tasaDisplay || resumen.tasaInteres).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-green-600">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Total a Pagar</p>
                            <p className="text-xl font-bold text-green-700 mt-1">
                                {formatMoney(resumen.montoTotalAPagar)}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* INFO CUOTA EDITABLE */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#213685] text-white rounded-lg shadow-sm">
                        <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-gray-900 capitalize flex items-center gap-2">
                            Cuota {resumen.ModalidadPago || "Fija"}
                            <span className="text-[10px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Ajustable
                            </span>
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {resumen.tipoCalculo === 'solo_interes'
                                ? 'Cuota mínima obligatoria (Solo Interés). Abonos adicionales reducen el principal.'
                                : 'Cambia la cuota y presiona Reajustar Tasa para calcular el interés exacto.'
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">$</span>
                        <Input
                            type="number"
                            step="any"
                            value={cuotaInput}
                            onChange={(e) => setCuotaInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAjustarTasa();
                              }
                            }}
                            className="w-36 pl-7 text-right font-bold text-lg text-[#213685] bg-white border-blue-300 focus-visible:ring-blue-500 shadow-sm"
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleAjustarTasa}
                        disabled={loadingAjuste || !cuotaInput || parseFloat(cuotaInput) === resumen.montoCuota}
                        className="bg-[#213685] hover:bg-[#213685]/90 text-white text-xs h-10 px-3 shadow-sm"
                    >
                        {loadingAjuste ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <span className="flex items-center gap-1">
                                <RefreshCw className="h-3.5 w-3.5" /> Reajustar
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* TABLA */}
            <div className="border rounded-md overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="font-semibold text-sm text-gray-700">Tabla de Amortización</h3>
            </div>
            
           
            <div className="max-h-[300px] overflow-y-auto relative [&>div]:overflow-visible">
                <Table>
                    {/* Aseguramos que el fondo sea sólido (bg-white) y tenga un z-index alto */}
                    <TableHeader className="sticky top-0 z-20 bg-white shadow-sm ring-1 ring-black/5">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[60px] text-center font-bold text-gray-900">#</TableHead>
                            <TableHead className="text-right font-bold text-gray-900">Capital</TableHead>
                            <TableHead className="text-right font-bold text-gray-900">Interés</TableHead>
                            <TableHead className="text-right font-bold text-green-700">Cuota</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cuotas.map((c: any) => (
                            <TableRow key={c.numeroCuota} className="hover:bg-gray-50">
                                <TableCell className="text-center font-medium text-muted-foreground">
                                    {c.numeroCuota}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatMoney(c.capital)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                    {formatMoney(c.interes)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums font-bold text-green-700 bg-green-50/20">
                                    {formatMoney(c.cuota)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
        </div>

        <DialogFooter className="p-4 border-t bg-white z-20">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button 
                className="bg-[#213685] hover:bg-[#213685]/90 min-w-[150px]" 
                onClick={onConfirm} 
                disabled={isSubmitting}
            >
                {isSubmitting ? "Creando..." : "Confirmar Préstamo"}
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}