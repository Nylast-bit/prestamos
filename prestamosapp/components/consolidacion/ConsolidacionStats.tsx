import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react'

interface ConsolidacionCapital {
  IdConsolidacion: number
  FechaInicio: string
  FechaFin: string
  CapitalEntrante: number
  CapitalSaliente: number
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
}

export function ConsolidacionStats({
  consolidacion,
  allConsolidaciones,
  balanceNeto,
  totalRegistros,
  totalesPorEstado,
  onConsolidacionChange,
  formatDate
}: ConsolidacionStatsProps) {
  
  return (
    <div className="space-y-6">
      {/* TARJETA AZUL PRINCIPAL (Selector y Totales Macro) */}
      <Card className="border-l-4 border-l-[#213685]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#213685]" />
                Consolidación de Capital
              </CardTitle>
              <Select 
                value={consolidacion.IdConsolidacion.toString()} 
                onValueChange={onConsolidacionChange}
              >
                <SelectTrigger className="w-[300px] mt-1 bg-white">
                  <SelectValue placeholder="Seleccionar Período" />
                </SelectTrigger>
                <SelectContent>
                  {allConsolidaciones.map(c => (
                    <SelectItem key={c.IdConsolidacion} value={c.IdConsolidacion.toString()}>
                      {formatDate(c.FechaInicio)} al {formatDate(c.FechaFin)} (ID: {c.IdConsolidacion})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge className="bg-[#213685] text-white">Seleccionada</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">RD${consolidacion.CapitalEntrante.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Capital Entrante</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">-RD${consolidacion.CapitalSaliente.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Capital Saliente</div>
            </div>
            <div className="text-center p-4 bg-[#213685]/10 rounded-lg">
              <div className={`text-2xl font-bold ${balanceNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                RD${balanceNeto.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Balance Neto</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{totalRegistros}</div>
              <div className="text-sm text-muted-foreground">Total Registros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TARJETAS DE ESTADOS MICRO */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depositado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">RD${totalesPorEstado.Depositado.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pend. por Depositar</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">RD${totalesPorEstado.Pendiente.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#213685]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestado</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">RD${totalesPorEstado.Prestado.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
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