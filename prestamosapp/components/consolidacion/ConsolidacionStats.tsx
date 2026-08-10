import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, TrendingDown, Calendar, AlertCircle, ShieldCheck, History, CheckCircle2 } from 'lucide-react'

export interface AuditMeta {
  idRegistro: number
  fechaAuditoria: string
  nombreUsuario: string
  observaciones: string
  capitalEntrante: number
  capitalSaliente: number
  balanceNeto: number
  cantidadRegistros: number
}

interface ConsolidacionCapital {
  IdConsolidacion: number
  FechaInicio: string
  FechaFin: string
  CapitalEntrante: number
  CapitalSaliente: number
  ultimaAuditoria?: AuditMeta | null
}

interface ConsolidacionStatsProps {
  consolidacion: ConsolidacionCapital;
  allConsolidaciones: ConsolidacionCapital[];
  balanceNeto: number;
  totalRegistros: number;
  totalesPorEstado: {
    Depositado: number;
    Pendiente: number;
    Prestado: number;
    Pagado: number;
  };
  onConsolidacionChange: (idString: string) => void;
  formatDate: (isoString: string) => string;
  onOpenAuditarModal?: () => void;
  onOpenHistorialModal?: () => void;
}

export function ConsolidacionStats({
  consolidacion,
  allConsolidaciones,
  balanceNeto,
  totalRegistros,
  totalesPorEstado,
  onConsolidacionChange,
  formatDate,
  onOpenAuditarModal,
  onOpenHistorialModal
}: ConsolidacionStatsProps) {

  const formatShortTime = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch (e) {
      return iso
    }
  }

  const ultimaAud = consolidacion?.ultimaAuditoria

  return (
    <div className="space-y-6">
      {/* TARJETA AZUL PRINCIPAL (Selector y Totales Macro) */}
      <Card className="border-l-4 border-l-[#213685] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-[#213685]" />
                Consolidación de Capital
              </CardTitle>
              <Select 
                value={consolidacion.IdConsolidacion.toString()} 
                onValueChange={onConsolidacionChange}
              >
                <SelectTrigger className="w-[340px] mt-1 bg-background border-border font-semibold shadow-sm text-xs h-9">
                  <SelectValue placeholder="Seleccionar Período" />
                </SelectTrigger>
                <SelectContent>
                  {allConsolidaciones.map((c, index) => {
                    let labelPrefix = "📜 ";
                    let labelSuffix = "";
                    if (index === 0) {
                      labelPrefix = "📍 Actual: ";
                      labelSuffix = " (En curso)";
                    } else if (index === 1) {
                      labelPrefix = "⏪ Anterior: ";
                    }
                    return (
                      <SelectItem key={c.IdConsolidacion} value={c.IdConsolidacion.toString()}>
                        {labelPrefix}{formatDate(c.FechaInicio)} al {formatDate(c.FechaFin)}{labelSuffix}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* BOTONES DE AUDITORÍA & BADGE DE ESTADO */}
            <div className="flex flex-wrap items-center gap-2.5">
              {ultimaAud ? (
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs py-1 px-2.5 flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Buena y Válida ({formatShortTime(ultimaAud.fechaAuditoria)})</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs py-1 px-2.5 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Sin Verificar</span>
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onOpenHistorialModal}
                className="h-8 text-xs border-border text-card-foreground hover:bg-muted font-medium"
              >
                <History className="h-3.5 w-3.5 mr-1 text-[#213685]" />
                Historial
              </Button>

              <Button
                size="sm"
                onClick={onOpenAuditarModal}
                className="h-8 text-xs bg-emerald-600 text-white dark:text-white hover:bg-emerald-700 text-white font-medium shadow-sm"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Marcar Buena y Válida
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-600">RD${consolidacion.CapitalEntrante.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground font-medium">Capital Entrante</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="text-2xl font-bold text-red-600">-RD${consolidacion.CapitalSaliente.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground font-medium">Capital Saliente</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/50">
              <div className={`text-2xl font-bold ${balanceNeto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                RD${balanceNeto.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Balance Neto</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg border border-border">
              <div className="text-2xl font-bold text-muted-foreground">{totalRegistros}</div>
              <div className="text-sm text-muted-foreground font-medium">Total Registros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TARJETAS DE ESTADOS MICRO */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depositado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">RD${totalesPorEstado.Depositado.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pend. por Depositar</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">RD${totalesPorEstado.Pendiente.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#213685] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestado</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">RD${totalesPorEstado.Prestado.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado/Gastado</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">RD${totalesPorEstado.Pagado.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}