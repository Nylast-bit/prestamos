import React, { useEffect } from "react"
import { useAuthStore } from "@/store/authStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calculator, CalendarDays, Wand2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react'
import { fetchWithAuth } from "@/lib/fetchWithAuth"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';


// Definición de las props que recibe desde el padre (PrestamosContent)
interface PrestamoFormDialogProps {
  isOpen: boolean
  onClose: () => void
  formData: any
  setFormData: (data: any) => void
  clientes: any[]
  prestatarios: any[]
  isEditing: boolean
  tienePagos?: boolean
  onSimular: () => void
  onSubmit: (e?: React.FormEvent) => void
  isSubmitting: boolean
  isSimulating: boolean
}

export function PrestamoFormDialog({
  isOpen,
  onClose,
  formData,
  setFormData,
  clientes,
  prestatarios,
  isEditing,
  onSimular,
  onSubmit,
  isSubmitting,
  isSimulating,
  tienePagos = false
}: PrestamoFormDialogProps) {

  const [clientScore, setClientScore] = React.useState<number | null>(null);
  const [clientMora, setClientMora] = React.useState<number | null>(null);

  useEffect(() => {
    if (formData.IdCliente) {
      fetchWithAuth(`${API_BASE_URL}/api/score/${formData.IdCliente}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.data?.PuntajeCredito !== undefined) setClientScore(data.data.PuntajeCredito);
          else if (data?.data?.score !== undefined) setClientScore(data.data.score);
          else if (data?.PuntajeCredito !== undefined) setClientScore(data.PuntajeCredito);
          else if (data?.score !== undefined) setClientScore(data.score);
          else setClientScore(null);
        })
        .catch(() => setClientScore(null));

      fetchWithAuth(`${API_BASE_URL}/api/mora/verificar-cliente/${formData.IdCliente}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.moraPendiente !== undefined) setClientMora(data.moraPendiente);
          else if (data && data.moraAcumulada !== undefined) setClientMora(data.moraAcumulada);
          else setClientMora(null);
        })
        .catch(() => setClientMora(null));
    } else {
      setClientScore(null);
      setClientMora(null);
    }
  }, [formData.IdCliente]);

  const getScoreBadge = (score: number | null | undefined) => {
    const s = score ?? 500;
    if (s >= 850) return { label: `Excelente (${s})`, bg: 'bg-green-100 text-green-800' };
    if (s >= 700) return { label: `Bueno (${s})`, bg: 'bg-blue-100 text-blue-800' };
    if (s >= 500) return { label: `Regular (${s})`, bg: 'bg-yellow-100 text-yellow-800' };
    if (s >= 300) return { label: `Bajo (${s})`, bg: 'bg-orange-100 text-orange-800' };
    return { label: `Crítico (${s})`, bg: 'bg-red-100 text-red-800' };
  };

  // Función auxiliar para actualizar campos
  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const formatDateDDMMYYYY = (isoDateStr: string) => {
    if (!isoDateStr) return "";
    const cleanStr = isoDateStr.split("T")[0];
    const parts = cleanStr.split("-");
    if (parts.length !== 3) return isoDateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const obtenerDiaSemanaNombre = (date: Date) => {
    const dias = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
    return dias[date.getDay()];
  };

  const calcularPlanPagos = (fechaInicioStr: string, cuotas: number, modalidadStr: string) => {
    if (!fechaInicioStr || isNaN(cuotas) || cuotas <= 0) {
      return { primeraCuotaIso: "", primeraCuotaFormatted: "", fechaFinIso: "", fechaFinFormatted: "", helperInfo: "" };
    }

    const fechaBase = new Date(fechaInicioStr + "T12:00:00");
    const modalidad = (modalidadStr || "mensual").toLowerCase();

    let primeraCuota = new Date(fechaBase);
    let fechaFin = new Date(fechaBase);
    let helperInfo = "";

    if (modalidad === "diario") {
      primeraCuota.setDate(primeraCuota.getDate() + 1);
      fechaFin.setDate(fechaFin.getDate() + cuotas);
      helperInfo = "Cobro diario (1 día después de inicio)";
    } else if (modalidad === "semanal") {
      const diaNombre = obtenerDiaSemanaNombre(fechaBase);
      primeraCuota.setDate(primeraCuota.getDate() + 7);
      fechaFin.setDate(fechaFin.getDate() + (cuotas * 7));
      helperInfo = `Cobros fijos cada ${diaNombre}`;
    } else if (modalidad === "quincenal") {
      let tempDate = new Date(fechaBase);
      for (let k = 0; k < cuotas; k++) {
        const year = tempDate.getFullYear();
        const mes = tempDate.getMonth();
        const dia = tempDate.getDate();
        const ultimoDiaMes = new Date(year, mes + 1, 0).getDate();
        const dia30OFinMes = Math.min(30, ultimoDiaMes);

        if (dia < 15) {
          tempDate = new Date(year, mes, 15, 12, 0, 0);
        } else if (dia < dia30OFinMes) {
          tempDate = new Date(year, mes, dia30OFinMes, 12, 0, 0);
        } else {
          tempDate = new Date(year, mes + 1, 15, 12, 0, 0);
        }

        if (k === 0) {
          primeraCuota = new Date(tempDate);
        }
      }
      fechaFin = tempDate;
      helperInfo = "Cobros fijados días 15 y 30";
    } else if (modalidad === "mensual") {
      const diaDelMes = fechaBase.getDate();
      primeraCuota.setMonth(primeraCuota.getMonth() + 1);
      fechaFin.setMonth(fechaFin.getMonth() + cuotas);
      helperInfo = `Cobros fijados los días ${diaDelMes} de cada mes`;
    }

    const primeraCuotaIso = primeraCuota.toISOString().split("T")[0];
    const fechaFinIso = fechaFin.toISOString().split("T")[0];

    return {
      primeraCuotaIso,
      primeraCuotaFormatted: formatDateDDMMYYYY(primeraCuotaIso),
      fechaFinIso,
      fechaFinFormatted: formatDateDDMMYYYY(fechaFinIso),
      helperInfo
    };
  };

  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen && !isEditing && user?.idPrestatario && !formData.IdPrestatario) {
      updateField("IdPrestatario", user.idPrestatario.toString());
    }
  }, [isOpen, isEditing, user?.idPrestatario]);

  // ------------------------------------------------------------------
  // 🔮 CÁLCULO AUTOMÁTICO DE FECHA DE VENCIMIENTO
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!isEditing && formData.FechaInicio && formData.ModalidadPago) {
      const esSoloInteres = formData.TipoCalculo === "solo_interes";
      const cuotas = parseInt(formData.CantidadCuotas) || (esSoloInteres ? 2 : 0);
      if (cuotas <= 0) return;

      const plan = calcularPlanPagos(formData.FechaInicio, cuotas, formData.ModalidadPago);

      if (plan.fechaFinIso && formData.FechaFinEstimada !== plan.fechaFinIso) {
        updateField("FechaFinEstimada", plan.fechaFinIso);
      }
    }
  }, [formData.FechaInicio, formData.CantidadCuotas, formData.ModalidadPago, formData.TipoCalculo, isEditing]);

  const esSoloInteres = formData.TipoCalculo === "solo_interes";
  const planActual = calcularPlanPagos(
    formData.FechaInicio,
    parseInt(formData.CantidadCuotas) || (esSoloInteres ? 2 : 0),
    formData.ModalidadPago
  );


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-2.5">
          <DialogTitle className="flex items-center gap-2 text-[#213685] text-lg">
            {isEditing ? <Wand2 className="h-5 w-5" /> : <Calculator className="h-5 w-5" />}
            {isEditing ? "Editar Préstamo" : "Nuevo Préstamo"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing
              ? "Modifica los parámetros del préstamo."
              : "Configura los términos financieros. La fecha final se calculará automáticamente."
            }
          </DialogDescription>
        </DialogHeader>

        {/* --- INICIO DEL FORMULARIO --- */}
        <div className="grid gap-4 py-3.5">

          {/* SECCIÓN 1: PERSONAS */}
          {tienePagos && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-md mb-2">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                <p className="text-sm font-semibold text-orange-800">
                  Este préstamo ya tiene pagos registrados. Los parámetros financieros están bloqueados. Si necesitas reestructurar o inyectar capital, utiliza la opción de <strong>Reenganche</strong>.
                </p>
              </div>
            </div>
          )}

          {clientMora !== null && clientMora > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md mb-2">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm font-semibold text-red-700">
                  Este cliente tiene mora pendiente de ${clientMora}
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Cliente</Label>
                {formData.IdCliente && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getScoreBadge(clientScore).bg}`}>
                    {getScoreBadge(clientScore).label}
                  </span>
                )}
              </div>
              <Select
                value={formData.IdCliente}
                onValueChange={(val) => updateField("IdCliente", val)}
              >
                <SelectTrigger className="bg-muted/50 h-9.5 text-sm">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente: any) => (
                    <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                      {cliente.Nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Prestatario (Inversionista)</Label>
              <Select
                value={formData.IdPrestatario}
                onValueChange={(val) => updateField("IdPrestatario", val)}
              >
                <SelectTrigger className="bg-muted/50 h-9.5 text-sm">
                  <SelectValue placeholder="Seleccionar prestatario" />
                </SelectTrigger>
                <SelectContent>
                  {prestatarios.map((pres: any) => (
                    <SelectItem key={pres.IdPrestatario} value={pres.IdPrestatario.toString()}>
                      {pres.Nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SECCIÓN 2: TÉRMINOS FINANCIEROS */}
          <div className="grid grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="MontoPrestado" className="text-blue-700 font-semibold text-xs">Monto Principal ($)</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-muted-foreground font-bold text-sm">$</span>
                <Input
                  id="MontoPrestado"
                  type="number"
                  step="100"
                  className="pl-6.5 font-bold h-9.5 text-base"
                  value={formData.MontoPrestado}
                  onChange={(e) => updateField("MontoPrestado", e.target.value)}
                  placeholder="0.00"
                  disabled={tienePagos}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="InteresPorcentaje" className="text-xs font-semibold">Tasa Interés (%)</Label>
              <div className="relative">
                <Input
                  id="InteresPorcentaje"
                  type="number"
                  step="0.1"
                  className="pr-7.5 h-9.5 text-sm"
                  value={formData.InteresPorcentaje}
                  onChange={(e) => updateField("InteresPorcentaje", e.target.value)}
                  placeholder="Ej. 10"
                  disabled={tienePagos}
                />
                <span className="absolute right-2.5 top-2.5 text-muted-foreground font-bold text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="CantidadCuotas" className="text-xs font-semibold">Cantidad Cuotas</Label>
                {formData.TipoCalculo === "solo_interes" && !formData.CantidadCuotas && (
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    Plazo Libre (2 proy.)
                  </span>
                )}
              </div>
                <Input
                  id="CantidadCuotas"
                  type="number"
                  className="h-9.5 text-sm"
                  value={esSoloInteres ? "2" : formData.CantidadCuotas}
                  onChange={(e) => updateField("CantidadCuotas", e.target.value)}
                  disabled={esSoloInteres || tienePagos}
                  placeholder="Ej. 12"
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Modalidad de Pago</Label>
              <Select
                value={formData.ModalidadPago}
                onValueChange={(val) => updateField("ModalidadPago", val)}
                disabled={tienePagos}
              >
                <SelectTrigger id="ModalidadPago" className="h-9.5 text-sm bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual (Cada mes)</SelectItem>
                  <SelectItem value="quincenal">Quincenal (Cada 15 días)</SelectItem>
                  <SelectItem value="semanal">Semanal (Cada 7 días)</SelectItem>
                  <SelectItem value="diario">Diario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Cálculo</Label>
              <Select
                value={formData.TipoCalculo}
                onValueChange={(val) => updateField("TipoCalculo", val)}
                disabled={tienePagos}
              >
                <SelectTrigger id="TipoCalculo" className="h-9.5 text-sm bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capital+interes">Capital + Interés (Cuota Fija Flat)</SelectItem>
                  <SelectItem value="amortizable">Amortizable (Interés sobre Saldo)</SelectItem>
                  <SelectItem value="solo_interes">Solo Interés (Abonos Abiertos a Capital)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SECCIÓN 3: FECHAS Y CALENDARIO DE PAGO */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 p-3 rounded-xl border border-blue-100 space-y-2.5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="FechaInicio" className="flex items-center gap-1.5 font-semibold text-blue-900 text-xs cursor-pointer">
                    <CalendarDays className="h-3.5 w-3.5 text-blue-600" /> Inicio Préstamo
                  </Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-bold bg-background h-9 text-xs border-blue-200 hover:bg-blue-50 hover:text-blue-700",
                        !formData.FechaInicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                      {formData.FechaInicio ? (
                        formatDateDDMMYYYY(formData.FechaInicio)
                      ) : (
                        <span>Seleccionar Fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[60] bg-background dark:bg-slate-950 border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.FechaInicio ? new Date(formData.FechaInicio + "T12:00:00") : undefined}
                    onSelect={(date) => {
                      if (!tienePagos && date) {
                        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                        updateField("FechaInicio", localDate.toISOString().split("T")[0]);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="FechaFinEstimada" className="flex items-center gap-1.5 font-semibold text-purple-900 text-xs cursor-pointer">
                    <Wand2 className="h-3.5 w-3.5 text-purple-600" /> Fecha Final (Estimada)
                  </Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-bold bg-background h-9 text-xs border-purple-200 hover:bg-purple-50 hover:text-purple-700",
                        !formData.FechaFinEstimada && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-purple-600" />
                      {formData.FechaFinEstimada ? (
                        formatDateDDMMYYYY(formData.FechaFinEstimada)
                      ) : (
                        <span>Seleccionar Fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2 bg-background dark:bg-slate-950 border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.FechaFinEstimada ? new Date(formData.FechaFinEstimada + "T12:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          updateField("FechaFinEstimada", `${year}-${month}-${day}`);
                        }
                      }}
                      initialFocus
                    />
                    <div className="border-t pt-2 mt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100"
                        onClick={(e) => {
                          e.preventDefault();
                          const date = new Date();
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          updateField("FechaFinEstimada", `${year}-${month}-${day}`);
                        }}
                      >
                        Seleccionar Hoy
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* INFORMACIÓN DE LA PRIMERA CUOTA Y REGLA DE COBRO */}
            {planActual.primeraCuotaFormatted && (
              <div className="bg-background p-2.5 rounded-lg border border-blue-100 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-medium text-card-foreground">
                  <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-xs">
                    1ª Cuota
                  </span>
                  <span>Primera cuota: <strong className="text-green-700 font-bold">{planActual.primeraCuotaFormatted}</strong></span>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                  {planActual.helperInfo}
                </span>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <Label htmlFor="Observaciones" className="text-xs font-semibold">Notas / Garantía</Label>
            <Textarea
              id="Observaciones"
              className="resize-none text-xs py-2 min-h-[42px]"
              rows={1}
              value={formData.Observaciones}
              onChange={(e) => updateField("Observaciones", e.target.value)}
              placeholder="Detalles sobre garantía o condiciones especiales..."
            />
          </div>

          {/* BOTÓN DE SIMULACIÓN */}
          {!isEditing && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onSimular(); // Llama a la función del padre
              }}
              disabled={isSimulating || !formData.MontoPrestado || !formData.InteresPorcentaje || (!formData.CantidadCuotas && formData.TipoCalculo !== "solo_interes")}
              className="w-full bg-slate-800 text-white hover:bg-slate-700 h-10 text-sm font-semibold shadow-sm"
            >
              {isSimulating ? (
                "Calculando..."
              ) : (
                <span className="flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Generar Tabla de Pagos y Simular
                </span>
              )}
            </Button>
          )}
        </div>
        {/* --- FIN DEL FORMULARIO --- */}

        <DialogFooter className="border-t pt-3">
          <Button type="button" variant="ghost" className="h-9 text-xs" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit()}
            className="bg-[#213685] text-white dark:text-white hover:bg-[#213685] text-white dark:text-white/90 min-w-[140px] h-9 text-xs font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Procesando..." : (isEditing ? "Guardar Cambios" : "Crear Préstamo")}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}