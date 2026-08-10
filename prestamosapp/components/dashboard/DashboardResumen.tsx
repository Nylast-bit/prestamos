import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Briefcase, Users, UserCheck } from "lucide-react"

interface DashboardResumenProps {
  prestamosActivos: number;
  clientesTotales: number;
  prestatariosTotales: number;
}

export function DashboardResumen({
  prestamosActivos,
  clientesTotales,
  prestatariosTotales,
}: DashboardResumenProps) {
  const stats = [
    {
      label: "Préstamos Activos",
      value: prestamosActivos,
      icon: Briefcase,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-950/50",
      blockBg: "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-100/80 dark:border-blue-900/30",
    },
    {
      label: "Clientes Totales",
      value: clientesTotales,
      icon: Users,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-950/50",
      blockBg: "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-100/80 dark:border-emerald-900/30",
    },
    {
      label: "Prestatarios (Cobradores)",
      value: prestatariosTotales,
      icon: UserCheck,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100 dark:bg-violet-950/50",
      blockBg: "bg-violet-50/40 dark:bg-violet-950/20 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-violet-100/80 dark:border-violet-900/30",
    },
  ]

  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span>Resumen General</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${stat.blockBg}`}
              >
                <div className={`p-3 rounded-full mb-3 ${stat.bgColor} ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-3xl font-bold tracking-tight text-foreground mb-1">
                  {stat.value.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground text-center">
                  {stat.label}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}