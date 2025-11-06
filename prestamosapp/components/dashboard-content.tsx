"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Calendar, AlertTriangle, Users, CreditCard, PiggyBank, FileText, Clock, CheckCircle } from 'lucide-react'

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Header con selector de prestatario */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard General</h2>
          <p className="text-muted-foreground">
            Resumen completo de la plataforma de préstamos
          </p>
        </div>
        <Select defaultValue="todos">
          <SelectTrigger className="w-[200px] border-[#213685]/20 focus:ring-[#213685]">
            <SelectValue placeholder="Seleccionar prestatario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los prestatarios</SelectItem>
            <SelectItem value="prestatario1">Juan Pérez</SelectItem>
            <SelectItem value="prestatario2">María García</SelectItem>
            <SelectItem value="prestatario3">Carlos López</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital en Calle</CardTitle>
            <DollarSign className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">$2,450,000</div>
            <p className="text-xs text-muted-foreground">
              +12% desde la quincena anterior
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interés Quincenal</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$245,000</div>
            <p className="text-xs text-muted-foreground">
              Interés total esperado
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Quincenales</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$189,500</div>
            <p className="text-xs text-muted-foreground">
              Total de cuotas programadas
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">$67,800</div>
            <p className="text-xs text-muted-foreground">
              Esta quincena por cobrar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sección de alertas y próximos vencimientos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Préstamos Próximos a Vencer
            </CardTitle>
            <CardDescription>
              Préstamos que vencen en los próximos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {[
                  { cliente: "Juan Pérez", monto: "$15,000", fecha: "2024-01-15", dias: 2 },
                  { cliente: "María García", monto: "$8,500", fecha: "2024-01-16", dias: 3 },
                  { cliente: "Carlos López", monto: "$22,000", fecha: "2024-01-18", dias: 5 },
                  { cliente: "Ana Martínez", monto: "$12,300", fecha: "2024-01-19", dias: 6 },
                ].map((prestamo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
                    <div>
                      <p className="font-medium">{prestamo.cliente}</p>
                      <p className="text-sm text-muted-foreground">Monto: {prestamo.monto}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={prestamo.dias <= 2 ? "destructive" : "secondary"}>
                        {prestamo.dias} días
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{prestamo.fecha}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

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
              <span className="font-bold text-[#213685]">127</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm">Clientes Totales</span>
              <span className="font-bold">89</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm">Prestatarios</span>
              <span className="font-bold">12</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm">Tasa Cobro</span>
              <span className="font-bold text-green-600">94.2%</span>
            </div>
            <div className="mt-2">
              <Progress value={94.2} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitudes futuras y consolidación */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#213685]" />
              Próximos Préstamos Solicitados
            </CardTitle>
            <CardDescription>
              Solicitudes programadas para fechas futuras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { cliente: "Roberto Silva", monto: "$10,000", fecha: "15/10/2025", estado: "Pendiente" },
                { cliente: "Laura Mendoza", monto: "$25,000", fecha: "20/10/2025", estado: "Aprobado" },
                { cliente: "Diego Ruiz", monto: "$15,500", fecha: "25/10/2025", estado: "En Revisión" },
              ].map((solicitud, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{solicitud.cliente}</p>
                    <p className="text-sm text-muted-foreground">{solicitud.monto} - {solicitud.fecha}</p>
                  </div>
                  <Badge 
                    variant={
                      solicitud.estado === "Aprobado" ? "default" : 
                      solicitud.estado === "Pendiente" ? "secondary" : "outline"
                    }
                    className={solicitud.estado === "Aprobado" ? "bg-[#213685]" : ""}
                  >
                    {solicitud.estado}
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4 bg-[#213685] hover:bg-[#213685]/90">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-[#213685]" />
              Consolidación de Capital
            </CardTitle>
            <CardDescription>
              Período actual: 8 - 23 Enero (Quincena 15)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Ingresos Registrados</span>
                <span className="font-bold text-green-600">$189,500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Gastos Fijos</span>
                <span className="font-bold text-red-600">$45,200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Balance Neto</span>
                <span className="font-bold text-[#213685]">$144,300</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Checklist Quincenal</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Pago de servicios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Gastos operativos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Revisión de cartera</span>
                  </div>
                </div>
              </div>
            </div>
            <Button className="w-full mt-4 bg-[#213685] hover:bg-[#213685]/90">
              <FileText className="h-4 w-4 mr-2" />
              Ver Consolidación Completa
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Funciones más utilizadas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col gap-2 bg-[#213685] hover:bg-[#213685]/90">
              <DollarSign className="h-6 w-6" />
              <span>Nuevo Préstamo</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-[#213685] text-[#213685] hover:bg-[#213685]/10">
              <CreditCard className="h-6 w-6" />
              <span>Registrar Pago</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-[#213685] text-[#213685] hover:bg-[#213685]/10">
              <Users className="h-6 w-6" />
              <span>Nuevo Cliente</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 border-[#213685] text-[#213685] hover:bg-[#213685]/10">
              <FileText className="h-6 w-6" />
              <span>Generar Volante</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
