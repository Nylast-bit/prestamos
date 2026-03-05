import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users } from 'lucide-react'

interface DashboardResumenProps {
  prestamosActivos: number;
  clientesTotales: number;
  prestatariosTotales: number;
}

export function DashboardResumen({ 
  prestamosActivos, 
  clientesTotales, 
  prestatariosTotales 
}: DashboardResumenProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#213685]" />
          Resumen General
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Préstamos Activos</span>
          <span className="font-bold text-[#213685]">{prestamosActivos}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-sm">Clientes Totales</span>
          <span className="font-bold">{clientesTotales}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-sm">Prestatarios (Cobradores)</span>
          <span className="font-bold">{prestatariosTotales}</span>
        </div>
      </CardContent>
    </Card>
  )
}