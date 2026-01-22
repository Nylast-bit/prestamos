import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, CalendarClock, TrendingDown, Banknote, CreditCard } from 'lucide-react'

// --- FUNCIÓN DE FECHAS (Tu lógica corregida) ---
const getProximoPago = (fechaInicioStr: string, modalidad: string, cuotasPagadas: number) => {
  if (!fechaInicioStr) return "N/A";
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
  return fechaCalculada.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// --- COMPONENTE PRINCIPAL ---
export function PrestamoTable({ prestamos, onEdit, onDelete, onPaymentSuccess }: any) {
  
  // --- ESTADOS PARA EL DIÁLOGO DE PAGO ---
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<any>(null);
  const [paymentType, setPaymentType] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // --- HANDLERS ---
  const handleOpenPay = (prestamo: any) => {
    setSelectedPrestamo(prestamo);
    setPaymentType("Efectivo");
    setObservaciones("");
    setIsPayOpen(true);
  };

  const handleConfirmarPago = async () => {
    if (!selectedPrestamo) return;
    setIsPaying(true);

    try {
      const payload = {
        IdPrestamo: selectedPrestamo.IdPrestamo,
        MontoPagado: selectedPrestamo.MontoCuota, // Cobramos la cuota exacta estándar
        TipoPago: paymentType,
        Observaciones: observaciones || "Pago de cuota estándar"
      };

      // 1. Llamada al API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al procesar el pago");
      }

      // 2. Éxito
      alert("¡Pago registrado correctamente!");
      setIsPayOpen(false);
      
      // 3. Recargar datos (Callback al padre)
      if (onPaymentSuccess) onPaymentSuccess();

    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handlePagoPersonalizado = () => {
    alert("Funcionalidad de Pago Personalizado (Abonos a capital, etc.) próximamente.");
    // Aquí abrirías otro modal o cambiarías la vista para permitir editar el monto
  };

  // --- UI HELPERS ---
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Activo": return "bg-[#213685]"
      case "Pagado": return "bg-green-600"
      case "Vencido": return "bg-orange-600"
      case "En Mora": return "bg-red-600"
      default: return "bg-gray-600"
    }
  }

  const prestamosVisibles = prestamos.filter((p: any) => p.Estado !== 'Completado' && p.Estado !== 'Eliminado');

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Cliente</TableHead>
              <TableHead>Monto Orig.</TableHead>
              <TableHead className="text-blue-700 font-bold">Saldo Pend.</TableHead> 
              <TableHead>Cuota</TableHead>
              <TableHead className="w-[140px]">Progreso</TableHead>
              <TableHead>Próx. Pago</TableHead> 
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prestamosVisibles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay préstamos activos
                </TableCell>
              </TableRow>
            ) : (
              prestamosVisibles.map((prestamo: any) => {
                const cuotasTotales = prestamo.CantidadCuotas || 0;
                const cuotasRestantes = prestamo.CuotasRestantes || 0;
                const cuotasPagadas = cuotasTotales - cuotasRestantes;
                const porcentaje = cuotasTotales > 0 ? (cuotasPagadas / cuotasTotales) * 100 : 0;
                const proximoPagoDisplay = prestamo.Estado === 'Pagado' ? '---' : getProximoPago(prestamo.FechaInicio, prestamo.ModalidadPago, cuotasPagadas);

                return (
                  <TableRow key={prestamo.IdPrestamo}>
                    <TableCell>
                      <div className="font-medium">{prestamo.clienteNombre}</div>
                      <div className="text-xs text-muted-foreground">{prestamo.ModalidadPago}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${Number(prestamo.MontoPrestado).toLocaleString()}
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center font-bold text-[#213685]">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          ${Number(prestamo.CapitalRestante || prestamo.MontoPrestado).toLocaleString()}
                       </div>
                    </TableCell>
                    <TableCell>${Number(prestamo.MontoCuota).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-medium text-muted-foreground">
                             <span>{cuotasPagadas}/{cuotasTotales}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-[#213685] h-2 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-medium bg-gray-50 px-2 py-1 rounded border">
                        <CalendarClock className="h-4 w-4 text-orange-600" />
                        {proximoPagoDisplay}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadgeColor(prestamo.Estado)}>{prestamo.Estado}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* BOTÓN PAGAR */}
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleOpenPay(prestamo)}
                            title="Registrar Pago"
                        >
                          <Banknote className="h-4 w-4" />
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => onEdit(prestamo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(prestamo.IdPrestamo)}>
                          <Trash2 className="h-4 w-4" />
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

      {/* --- DIÁLOGO DE PAGO --- */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
                <Banknote className="text-green-600" />
                Registrar Cobro
            </DialogTitle>
            <DialogDescription>
                Confirma los detalles para procesar el pago de la cuota.
            </DialogDescription>
          </DialogHeader>

          {selectedPrestamo && (
            <div className="grid gap-6 py-4">
                {/* Resumen del cobro */}
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                         <span className="text-sm text-gray-500">Cliente</span>
                         <span className="font-semibold">{selectedPrestamo.clienteNombre}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                         <span className="text-sm text-gray-500">Cuota a Pagar</span>
                         <span className="font-semibold">
                            #{(selectedPrestamo.CantidadCuotas - selectedPrestamo.CuotasRestantes) + 1} de {selectedPrestamo.CantidadCuotas}
                         </span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-500">Monto Cuota</span>
                         <span className="text-xl font-bold text-green-700">
                            ${Number(selectedPrestamo.MontoCuota).toLocaleString()}
                         </span>
                    </div>
                </div>

                {/* Formulario simple */}
                <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="metodo" className="text-right">
                          Método
                        </Label>
                        <Select value={paymentType} onValueChange={setPaymentType}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="obs" className="text-right">
                          Notas
                        </Label>
                        <Input 
                            id="obs" 
                            placeholder="Opcional..." 
                            className="col-span-3"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)} 
                        />
                    </div>
                </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Botón secundario: Pago Personalizado */}
            <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={handlePagoPersonalizado}
            >
                <CreditCard className="mr-2 h-4 w-4" />
                Pago Personalizado
            </Button>

            {/* Botón principal: Pagar Cuota */}
            <Button 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700" 
                onClick={handleConfirmarPago}
                disabled={isPaying}
            >
                {isPaying ? "Procesando..." : "Cobrar Cuota Completa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}