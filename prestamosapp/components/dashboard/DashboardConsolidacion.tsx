import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { 
  PiggyBank, 
  CheckCircle, 
  Clock, 
  FileText, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp 
} from "lucide-react"

interface DashboardConsolidacionProps {
  ingresos: number;
  egresos: number;
  fechaInicio?: string;
  fechaFin?: string;
  onNavigate: (section: string) => void;
}

export function DashboardConsolidacion({
  ingresos,
  egresos,
  fechaInicio,
  fechaFin,
  onNavigate,
}: DashboardConsolidacionProps) {
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
  };

  const balanceNeto = ingresos - egresos;
  const isPositive = balanceNeto >= 0;

  // Visual ratio calculation
  const total = (ingresos + egresos) || 1;
  const ingresosRatio = Math.round((ingresos / total) * 100);
  const egresosRatio = 100 - ingresosRatio;

  // Checklist items logic
  const tieneGastos = egresos > 0;
  const tieneIngresos = ingresos > 0;

  return (
    <Card className="flex flex-col h-full border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-slate-800">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <PiggyBank className="h-5 w-5" />
            </div>
            Consolidación de Capital
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Período actual: <span className="font-medium text-slate-700">{formatDate(fechaInicio)}</span> al <span className="font-medium text-slate-700">{formatDate(fechaFin)}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-1">
        <div className="space-y-4">
          {/* Ingresos and Egresos Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ingresos */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
                <span>Ingresos</span>
                <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-base font-bold text-emerald-700 tracking-tight">
                {formatMoney(ingresos)}
              </p>
            </div>

            {/* Egresos */}
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
                <span>Egresos</span>
                <ArrowDownCircle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-base font-bold text-rose-700 tracking-tight">
                {formatMoney(egresos)}
              </p>
            </div>
          </div>

          {/* Prominent Balance Neto Box */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isPositive
                ? 'bg-blue-50/60 border-blue-200/80 text-blue-900'
                : 'bg-red-50/60 border-red-200/80 text-red-900'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-75">
                Balance Neto
              </span>
              <p className={`text-xl font-extrabold tracking-tight ${isPositive ? 'text-blue-600' : 'text-red-600'}`}>
                {formatMoney(balanceNeto)}
              </p>
            </div>
            <div
              className={`p-2.5 rounded-full ${
                isPositive ? 'bg-blue-100/80 text-blue-600' : 'bg-red-100/80 text-red-600'
              }`}
            >
              <TrendingUp className={`h-5 w-5 ${!isPositive ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Visual Progress Indicator (Ingresos vs Egresos Ratio) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                Ingresos ({ingresosRatio}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                Egresos ({egresosRatio}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${ingresosRatio}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${egresosRatio}%` }}
              />
            </div>
          </div>

          <Separator className="my-2" />

          {/* Checklist de la Quincena */}
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-600 uppercase tracking-wider">
              Checklist de la Quincena
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-sm p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                {tieneGastos ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span className={tieneGastos ? "text-slate-700 font-medium" : "text-slate-500"}>
                  Registro de gastos fijos
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-sm p-2 rounded-lg bg-slate-50/80 border border-slate-100">
                {tieneIngresos ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span className={tieneIngresos ? "text-slate-700 font-medium" : "text-slate-500"}>
                  Ingreso de cuotas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="pt-2">
          <Button
            className="w-full bg-[#213685] hover:bg-[#213685]/90 text-white font-medium shadow-sm transition-all"
            onClick={() => onNavigate('consolidacion')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver Consolidación Completa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}