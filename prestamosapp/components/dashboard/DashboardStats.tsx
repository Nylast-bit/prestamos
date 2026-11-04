import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DashboardStatsProps {
  capitalEnCalle: number;
  interesEsperado: number;
  pagosQuincenales: number;
  pagosPendientes: number;
}

export function DashboardStats({
  capitalEnCalle,
  interesEsperado,
  pagosQuincenales,
  pagosPendientes,
}: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
    }).format(amount);
  };

  const stats = [
    {
      label: "Capital en Calle",
      value: formatCurrency(capitalEnCalle),
      subtitle: "Total de préstamos activos",
      icon: DollarSign,
      iconBg: "bg-[#213685] text-white dark:text-white/10",
      iconColor: "text-[#213685]",
      trend: "up",
    },
    {
      label: "Interés Esperado",
      value: formatCurrency(interesEsperado),
      subtitle: "Proyección de ganancias",
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: "up",
    },
    {
      label: "Pagos Quincenales",
      value: formatCurrency(pagosQuincenales),
      subtitle: "Cobros del periodo actual",
      icon: CreditCard,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      trend: "neutral",
    },
    {
      label: "En Mora",
      value: formatCurrency(pagosPendientes),
      subtitle: "Dinero atrasado",
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      trend: "down",
    },
  ];

  return (
    <div className="kpi-grid grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card
            key={i}
            className="group overflow-hidden border border-slate-100 bg-gradient-to-b from-slate-50 dark:from-slate-900/50 to-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                    {stat.label}
                  </p>
                  <h3 className="text-lg sm:text-2xl font-bold tracking-tight tabular-nums text-foreground dark:text-slate-50 [overflow-wrap:anywhere]">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${stat.iconBg}`}
                >
                  <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-2 sm:mt-4 flex items-center text-xs text-muted-foreground dark:text-muted-foreground">
                {stat.trend === "up" && (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                )}
                {stat.trend === "down" && (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-amber-500" />
                )}
                <span>{stat.subtitle}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}