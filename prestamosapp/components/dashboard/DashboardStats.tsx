import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, CreditCard, Clock } from 'lucide-react'

// Definimos qué datos necesita recibir este componente
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
  pagosPendientes 
}: DashboardStatsProps) {
  
  // Helper para formatear moneda
  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 1. Capital en Calle */}
      <Card className="border-l-4 border-l-[#213685]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Capital en Calle</CardTitle>
          <DollarSign className="h-4 w-4 text-[#213685]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-[#213685]">{formatMoney(capitalEnCalle)}</div>
          <p className="text-xs text-muted-foreground">Suma de capital restante</p>
        </CardContent>
      </Card>
      
      {/* 2. Interés Esperado */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interés Activo</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatMoney(interesEsperado)}</div>
          <p className="text-xs text-muted-foreground">Interés pendiente de cobro</p>
        </CardContent>
      </Card>
      
      {/* 3. Pagos (Cuotas Totales de esta quincena/mes) */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total en Cuotas</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatMoney(pagosQuincenales)}</div>
          <p className="text-xs text-muted-foreground">Suma de cuotas regulares</p>
        </CardContent>
      </Card>
      
      {/* 4. Pagos Pendientes (Mora) */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Mora</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatMoney(pagosPendientes)}</div>
          <p className="text-xs text-muted-foreground">Dinero atrasado</p>
        </CardContent>
      </Card>
    </div>
  )
}