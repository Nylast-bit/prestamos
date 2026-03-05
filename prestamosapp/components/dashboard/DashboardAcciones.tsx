import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, CreditCard, Users, FileText } from 'lucide-react'

interface DashboardAccionesProps {
  onNavigate: (section: string) => void;
}

export function DashboardAcciones({ onNavigate }: DashboardAccionesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>
          Accesos directos a las funciones más utilizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          
          <Button 
            className="h-20 flex-col gap-2 bg-[#213685] hover:bg-[#213685]/90"
            onClick={() => onNavigate("prestamos")}
          >
            <DollarSign className="h-6 w-6" />
            <span>Nuevo Préstamo</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-[#213685] text-[#213685] hover:bg-[#213685]/10"
            onClick={() => onNavigate("pagos")}
          >
            <CreditCard className="h-6 w-6" />
            <span>Registrar Pago</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-[#213685] text-[#213685] hover:bg-[#213685]/10"
            onClick={() => onNavigate("clientes")}
          >
            <Users className="h-6 w-6" />
            <span>Nuevo Cliente</span>
          </Button>

          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-[#213685] text-[#213685] hover:bg-[#213685]/10"
            onClick={() => alert("Módulo de volantes en desarrollo")}
          >
            <FileText className="h-6 w-6" />
            <span>Generar Volante</span>
          </Button>

        </div>
      </CardContent>
    </Card>
  )
}