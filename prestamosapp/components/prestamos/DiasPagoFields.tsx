"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { nombresDiasSemana } from "@/lib/fechasPago"

export interface DiasPagoValor {
  dia1: number | null
  dia2: number | null
  primerPago: string // YYYY-MM-DD; vacío = usar la fecha sugerida
}

interface DiasPagoFieldsProps {
  modalidad: string
  valor: DiasPagoValor
  onChange: (valor: DiasPagoValor) => void
  // Fecha que se usará si el usuario no elige otra (primer pago o próximo pago)
  fechaSugerida: string
  etiquetaFecha?: string
  compacto?: boolean
}

const DIAS_MES = Array.from({ length: 31 }, (_, i) => i + 1)

const formatearFecha = (iso: string) => {
  if (!iso) return "-"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

// Días acordados con el cliente: quincenal (2 días del mes), mensual (1 día) o semanal (día de la semana)
export function DiasPagoFields({ modalidad, valor, onChange, fechaSugerida, etiquetaFecha = "Primer pago", compacto }: DiasPagoFieldsProps) {
  const mod = (modalidad || "").toLowerCase()
  if (mod === "diario") return null

  const labelClass = compacto ? "text-xs font-semibold" : "text-xs font-semibold"
  const selectDia = (dia: number | null, campo: "dia1" | "dia2", placeholder: string) => (
    <Select value={dia ? String(dia) : ""} onValueChange={(v) => onChange({ ...valor, [campo]: Number(v), primerPago: "" })}>
      <SelectTrigger className="text-sm"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-64">
        {DIAS_MES.map((d) => <SelectItem key={d} value={String(d)}>Día {d}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {mod === "quincenal" && (
          <>
            <div className="space-y-1">
              <Label className={labelClass}>1er día de pago</Label>
              {selectDia(valor.dia1, "dia1", "Día")}
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>2do día de pago</Label>
              {selectDia(valor.dia2, "dia2", "Día")}
            </div>
          </>
        )}
        {mod === "mensual" && (
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label className={labelClass}>Día de pago del mes</Label>
            {selectDia(valor.dia1, "dia1", "Día")}
          </div>
        )}
        {mod === "semanal" && (
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <Label className={labelClass}>Día de la semana</Label>
            <Select value={valor.dia1 !== null ? String(valor.dia1) : ""} onValueChange={(v) => onChange({ ...valor, dia1: Number(v), primerPago: "" })}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="Día" /></SelectTrigger>
              <SelectContent>
                {nombresDiasSemana.map((n, i) => <SelectItem key={i} value={String(i)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label className={labelClass}>{etiquetaFecha}</Label>
        <Input
          type="date"
          className="text-sm"
          value={valor.primerPago || fechaSugerida}
          onChange={(e) => onChange({ ...valor, primerPago: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          {valor.primerPago && valor.primerPago !== fechaSugerida
            ? "Fecha elegida a mano. Las siguientes cuotas siguen los días de pago."
            : `Sugerida según los días de pago: ${formatearFecha(fechaSugerida)}`}
        </p>
      </div>
    </div>
  )
}
