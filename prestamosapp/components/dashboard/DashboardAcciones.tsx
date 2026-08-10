import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, CreditCard, Users, FileText, ArrowRight } from "lucide-react"

interface DashboardAccionesProps {
  onNavigate: (section: string) => void;
}

export function DashboardAcciones({ onNavigate }: DashboardAccionesProps) {
  const actions = [
    {
      title: "Nuevo Préstamo",
      description: "Crear y desembolsar un nuevo préstamo",
      icon: DollarSign,
      topBorder: "border-t-4 border-t-blue-500",
      hoverGradient: "hover:bg-gradient-to-br hover:from-blue-50/80 hover:via-indigo-50/40 hover:to-transparent dark:hover:from-blue-950/40 dark:hover:via-indigo-950/20 dark:hover:to-transparent",
      iconStyle: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500",
      arrowColor: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
      onClick: () => onNavigate("prestamos"),
    },
    {
      title: "Registrar Pago",
      description: "Abonar o liquidar cuotas de clientes",
      icon: CreditCard,
      topBorder: "border-t-4 border-t-emerald-500",
      hoverGradient: "hover:bg-gradient-to-br hover:from-emerald-50/80 hover:via-teal-50/40 hover:to-transparent dark:hover:from-emerald-950/40 dark:hover:via-teal-950/20 dark:hover:to-transparent",
      iconStyle: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500",
      arrowColor: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
      onClick: () => onNavigate("pagos"),
    },
    {
      title: "Nuevo Cliente",
      description: "Registrar un cliente en el sistema",
      icon: Users,
      topBorder: "border-t-4 border-t-violet-500",
      hoverGradient: "hover:bg-gradient-to-br hover:from-violet-50/80 hover:via-purple-50/40 hover:to-transparent dark:hover:from-violet-950/40 dark:hover:via-purple-950/20 dark:hover:to-transparent",
      iconStyle: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white dark:group-hover:bg-violet-500",
      arrowColor: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
      onClick: () => onNavigate("clientes"),
    },
    {
      title: "Generar Volante",
      description: "Imprimir comprobantes de cobro",
      icon: FileText,
      topBorder: "border-t-4 border-t-amber-500",
      hoverGradient: "hover:bg-gradient-to-br hover:from-amber-50/80 hover:via-yellow-50/40 hover:to-transparent dark:hover:from-amber-950/40 dark:hover:via-yellow-950/20 dark:hover:to-transparent",
      iconStyle: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white dark:group-hover:bg-amber-500",
      arrowColor: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
      onClick: () => alert("Módulo de volantes en desarrollo"),
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Acciones Rápidas</h3>
        <p className="text-xs text-muted-foreground">Accesos directos a las funciones más utilizadas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Card
              key={action.title}
              onClick={action.onClick}
              className={`group cursor-pointer border border-border/60 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md overflow-hidden ${action.topBorder} ${action.hoverGradient}`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl transition-all duration-200 ${action.iconStyle}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className={`h-4 w-4 text-muted-foreground/60 transition-all duration-200 group-hover:translate-x-1 ${action.arrowColor}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm tracking-tight text-foreground group-hover:text-foreground">
                    {action.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}