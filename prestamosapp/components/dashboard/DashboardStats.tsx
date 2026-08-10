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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card
            key={i}
            className="group overflow-hidden border border-slate-100 bg-gradient-to-b from-slate-50 dark:from-slate-900/50 to-white transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-50">
                    {stat.value}
                  </h3>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${stat.iconBg}`}
                >
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground dark:text-muted-foreground">
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