"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, TrendingUp, AlertTriangle, Eye } from 'lucide-react'

// Actualizar la interfaz Prestamo para que coincida exactamente con la base de datos
interface Prestamo {
  IdPrestamo: number
  IdCliente: number
  IdPrestatario: number
  clienteNombre: string // Campo calculado para mostrar
  prestatarioNombre: string // Campo calculado para mostrar
  MontoPrestado: number
  TipoCalculo: "Amortizable" | "Capital+Interes"
  InteresPorcentaje: number
  InteresMontoTotal: number
  CapitalTotalPagar: number
  MontoCuota: number
  CantidadCuotas: number
  CuotasRestantes: number
  ModalidadPago: "Mensual" | "Quincenal" | "Semanal"
  FechaInicio: string
  FechaFinEstimada: string
  FechaUltimoPago: string | null
  Estado: "Activo" | "Pagado" | "Vencido" | "En Mora"
  Ajustable: boolean
  Observaciones: string
}

// Actualizar los datos iniciales para usar los campos correctos de la base de datos
const prestamosIniciales: Prestamo[] = [
  {
    IdPrestamo: 1,
    IdCliente: 1,
    IdPrestatario: 1,
    clienteNombre: "Juan Carlos Pérez",
    prestatarioNombre: "María García",
    MontoPrestado: 150000,
    TipoCalculo: "Capital+Interes",
    InteresPorcentaje: 7.0,
    InteresMontoTotal: 63000,
    CapitalTotalPagar: 213000,
    MontoCuota: 21300,
    CantidadCuotas: 10,
    CuotasRestantes: 7,
    ModalidadPago: "Quincenal",
    FechaInicio: "2024-01-01",
    FechaFinEstimada: "2024-06-01",
    FechaUltimoPago: "2024-01-15",
    Estado: "Activo",
    Ajustable: true,
    Observaciones: "Cliente puntual en pagos"
  },
  {
    IdPrestamo: 2,
    IdCliente: 2,
    IdPrestatario: 2,
    clienteNombre: "María Elena García",
    prestatarioNombre: "Carlos López",
    MontoPrestado: 80000,
    TipoCalculo: "Capital+Interes",
    InteresPorcentaje: 7.0,
    InteresMontoTotal: 33600,
    CapitalTotalPagar: 113600,
    MontoCuota: 14200,
    CantidadCuotas: 8,
    CuotasRestantes: 6,
    ModalidadPago: "Quincenal",
    FechaInicio: "2024-01-15",
    FechaFinEstimada: "2024-05-15",
    FechaUltimoPago: "2024-01-30",
    Estado: "Activo",
    Ajustable: true,
    Observaciones: "Préstamo para inversión en negocio"
  },
  {
    IdPrestamo: 3,
    IdCliente: 3,
    IdPrestatario: 3,
    clienteNombre: "Carlos Alberto López",
    prestatarioNombre: "Ana Martínez",
    MontoPrestado: 200000,
    TipoCalculo: "Amortizable",
    InteresPorcentaje: 10.0,
    InteresMontoTotal: 80000,
    CapitalTotalPagar: 200000,
    MontoCuota: 30000,
    CantidadCuotas: 8,
    CuotasRestantes: 2,
    ModalidadPago: "Mensual",
    FechaInicio: "2023-12-01",
    FechaFinEstimada: "2024-04-01",
    FechaUltimoPago: "2024-02-01",
    Estado: "En Mora",
    Ajustable: false,
    Observaciones: "Cliente con retraso en los últimos pagos"
  },
  {
    IdPrestamo: 4,
    IdCliente: 5,
    IdPrestatario: 4,
    clienteNombre: "Roberto Silva",
    prestatarioNombre: "Juan Pérez",
    MontoPrestado: 120000,
    TipoCalculo: "Capital+Interes",
    InteresPorcentaje: 8.0,
    InteresMontoTotal: 115200,
    CapitalTotalPagar: 235200,
    MontoCuota: 19600,
    CantidadCuotas: 12,
    CuotasRestantes: 11,
    ModalidadPago: "Quincenal",
    FechaInicio: "2024-01-08",
    FechaFinEstimada: "2024-07-08",
    FechaUltimoPago: "2024-01-22",
    Estado: "Activo",
    Ajustable: true,
    Observaciones: "Préstamo con garantía hipotecaria"
  },
  {
    IdPrestamo: 5,
    IdCliente: 1,
    IdPrestatario: 1,
    clienteNombre: "Juan Carlos Pérez",
    prestatarioNombre: "María García",
    MontoPrestado: 50000,
    TipoCalculo: "Capital+Interes",
    InteresPorcentaje: 6.0,
    InteresMontoTotal: 12000,
    CapitalTotalPagar: 62000,
    MontoCuota: 15500,
    CantidadCuotas: 4,
    CuotasRestantes: 0,
    ModalidadPago: "Quincenal",
    FechaInicio: "2023-11-01",
    FechaFinEstimada: "2024-01-01",
    FechaUltimoPago: "2024-01-01",
    Estado: "Pagado",
    Ajustable: false,
    Observaciones: "Préstamo liquidado en su totalidad"
  }
]

const clientesDisponibles = [
  { id: 1, nombre: "Juan Carlos Pérez" },
  { id: 2, nombre: "María Elena García" },
  { id: 3, nombre: "Carlos Alberto López" },
  { id: 4, nombre: "Ana Sofía Martínez" },
  { id: 5, nombre: "Roberto Silva" }
]

const prestatariosDisponibles = [
  "María García",
  "Carlos López", 
  "Ana Martínez",
  "Juan Pérez",
  "Roberto Silva"
]

export function PrestamosContent() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>(prestamosIniciales)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrestamo, setEditingPrestamo] = useState<Prestamo | null>(null)
  // Actualizar el formData para incluir todos los campos necesarios
  const [formData, setFormData] = useState({
    IdCliente: "",
    IdPrestatario: "",
    MontoPrestado: "",
    TipoCalculo: "Capital+Interes" as "Capital+Interes" | "Amortizable",
    InteresPorcentaje: "",
    CantidadCuotas: "",
    ModalidadPago: "Quincenal" as "Mensual" | "Quincenal" | "Semanal",
    FechaInicio: "",
    FechaFinEstimada: "",
    Ajustable: true,
    Observaciones: ""
  })

  const filteredPrestamos = prestamos.filter(prestamo =>
    prestamo.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestamo.prestatarioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestamo.Estado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Agregar función para calcular automáticamente los valores según el tipo de cálculo
  const calcularPrestamo = () => {
    const monto = parseFloat(formData.MontoPrestado) || 0
    const porcentaje = parseFloat(formData.InteresPorcentaje) || 0
    const cuotas = parseInt(formData.CantidadCuotas) || 1
    
    if (formData.TipoCalculo === "Capital+Interes") {
      const interesTotal = (monto * porcentaje * cuotas) / 100
      const capitalTotal = monto + interesTotal
      const cuota = capitalTotal / cuotas
      
      return {
        InteresMontoTotal: interesTotal,
        CapitalTotalPagar: capitalTotal,
        MontoCuota: cuota
      }
    } else {
      // Amortizable - el interés se calcula por período
      const interesPorCuota = (monto * porcentaje) / 100
      
      return {
        InteresMontoTotal: interesPorCuota * cuotas,
        CapitalTotalPagar: monto,
        MontoCuota: interesPorCuota // En amortizable la cuota mínima es el interés
      }
    }
  }

  // Agregar función para ajustar cuota y recalcular interés
  const ajustarCuota = (nuevaCuota: number) => {
    const monto = parseFloat(formData.MontoPrestado) || 0
    const cuotas = parseInt(formData.CantidadCuotas) || 1
    
    if (formData.TipoCalculo === "Capital+Interes") {
      const capitalTotal = nuevaCuota * cuotas
      const interesTotal = capitalTotal - monto
      const nuevoPorcentaje = (interesTotal * 100) / (monto * cuotas)
      
      setFormData({
        ...formData,
        MontoCuota: nuevaCuota.toString(),
        InteresPorcentaje: nuevoPorcentaje.toFixed(2)
      })
    }
  }

  const calcularCuota = () => {
    const monto = parseFloat(formData.MontoPrestado) || 0
    const interes = parseFloat(formData.InteresPorcentaje) || 0
    const totalPagos = parseInt(formData.CantidadCuotas) || 1
    
    if (formData.TipoCalculo === "Capital+Interes") {
      return (monto + interes) / totalPagos
    } else {
      // Amortizable - cálculo simplificado
      return monto / totalPagos + interes
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const clienteSeleccionado = clientesDisponibles.find(c => c.id === parseInt(formData.IdCliente))
    const { InteresMontoTotal, CapitalTotalPagar, MontoCuota } = calcularPrestamo()
    
    if (editingPrestamo) {
      // Actualizar préstamo existente
      setPrestamos(prestamos.map(prestamo => 
        prestamo.IdPrestamo === editingPrestamo.IdPrestamo 
          ? { 
              ...prestamo, 
              IdCliente: parseInt(formData.IdCliente),
              clienteNombre: clienteSeleccionado?.nombre || "",
              IdPrestatario: parseInt(formData.IdPrestatario),
              MontoPrestado: parseFloat(formData.MontoPrestado),
              TipoCalculo: formData.TipoCalculo,
              InteresPorcentaje: parseFloat(formData.InteresPorcentaje),
              InteresMontoTotal: InteresMontoTotal,
              CapitalTotalPagar: CapitalTotalPagar,
              MontoCuota: MontoCuota,
              CantidadCuotas: parseInt(formData.CantidadCuotas),
              ModalidadPago: formData.ModalidadPago,
              FechaInicio: formData.FechaInicio,
              FechaFinEstimada: formData.FechaFinEstimada,
              Ajustable: formData.Ajustable,
              Observaciones: formData.Observaciones
            }
          : prestamo
      ))
    } else {
      // Crear nuevo préstamo
      const nuevoPrestamo: Prestamo = {
        IdPrestamo: Math.max(...prestamos.map(p => p.IdPrestamo)) + 1,
        IdCliente: parseInt(formData.IdCliente),
        clienteNombre: clienteSeleccionado?.nombre || "",
        IdPrestatario: parseInt(formData.IdPrestatario),
        prestatarioNombre: "", // TODO: Obtener nombre del prestatario
        MontoPrestado: parseFloat(formData.MontoPrestado),
        TipoCalculo: formData.TipoCalculo,
        InteresPorcentaje: parseFloat(formData.InteresPorcentaje),
        InteresMontoTotal: InteresMontoTotal,
        CapitalTotalPagar: CapitalTotalPagar,
        MontoCuota: MontoCuota,
        CantidadCuotas: parseInt(formData.CantidadCuotas),
        CuotasRestantes: parseInt(formData.CantidadCuotas),
        ModalidadPago: formData.ModalidadPago,
        FechaInicio: formData.FechaInicio,
        FechaFinEstimada: formData.FechaFinEstimada,
        FechaUltimoPago: null,
        Estado: "Activo",
        Ajustable: formData.Ajustable,
        Observaciones: formData.Observaciones
      }
      setPrestamos([...prestamos, nuevoPrestamo])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      IdCliente: "",
      IdPrestatario: "",
      MontoPrestado: "",
      TipoCalculo: "Capital+Interes",
      InteresPorcentaje: "",
      CantidadCuotas: "",
      ModalidadPago: "Quincenal",
      FechaInicio: "",
      FechaFinEstimada: "",
      Ajustable: true,
      Observaciones: ""
    })
    setEditingPrestamo(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (prestamo: Prestamo) => {
    setEditingPrestamo(prestamo)
    setFormData({
      IdCliente: prestamo.IdCliente.toString(),
      IdPrestatario: prestamo.IdPrestatario.toString(),
      MontoPrestado: prestamo.MontoPrestado.toString(),
      TipoCalculo: prestamo.TipoCalculo,
      InteresPorcentaje: prestamo.InteresPorcentaje.toString(),
      CantidadCuotas: prestamo.CantidadCuotas.toString(),
      ModalidadPago: prestamo.ModalidadPago,
      FechaInicio: prestamo.FechaInicio,
      FechaFinEstimada: prestamo.FechaFinEstimada,
      Ajustable: prestamo.Ajustable,
      Observaciones: prestamo.Observaciones
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setPrestamos(prestamos.filter(prestamo => prestamo.IdPrestamo !== id))
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "Activo": return "bg-[#213685]"
      case "Pagado": return "bg-green-600"
      case "Vencido": return "bg-orange-600"
      case "En Mora": return "bg-red-600"
      default: return "bg-gray-600"
    }
  }

  const prestamosActivos = prestamos.filter(p => p.Estado === "Activo").length
  const capitalEnCalle = prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + p.MontoPrestado, 0)
  const interesTotal = prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + p.InteresMontoTotal, 0)
  const prestamosEnMora = prestamos.filter(p => p.Estado === "En Mora").length

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
            <DollarSign className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{prestamosActivos}</div>
            <p className="text-xs text-muted-foreground">
              Total en cartera
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capital en Calle</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${capitalEnCalle.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo pendiente total
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interés Total</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${interesTotal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Interés programado
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mora</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{prestamosEnMora}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de préstamos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Préstamos</CardTitle>
              <CardDescription>
                Administra todos los préstamos de la plataforma
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Préstamo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrestamo ? "Editar Préstamo" : "Nuevo Préstamo"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrestamo 
                      ? "Actualiza la información del préstamo" 
                      : "Completa los datos para crear un nuevo préstamo"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="IdCliente">Cliente</Label>
                        <Select value={formData.IdCliente} onValueChange={(value) => setFormData({...formData, IdCliente: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientesDisponibles.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id.toString()}>
                                {cliente.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="IdPrestatario">Prestatario</Label>
                        <Select value={formData.IdPrestatario} onValueChange={(value) => setFormData({...formData, IdPrestatario: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar prestatario" />
                          </SelectTrigger>
                          <SelectContent>
                            {prestatariosDisponibles.map((prestatario) => (
                              <SelectItem key={prestatario} value={prestatario}>
                                {prestatario}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="MontoPrestado">Monto</Label>
                        <Input
                          id="MontoPrestado"
                          type="number"
                          value={formData.MontoPrestado}
                          onChange={(e) => setFormData({...formData, MontoPrestado: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="InteresPorcentaje">Interés (%)</Label>
                        <Input
                          id="InteresPorcentaje"
                          type="number"
                          value={formData.InteresPorcentaje}
                          onChange={(e) => setFormData({...formData, InteresPorcentaje: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="CantidadCuotas">Total Pagos</Label>
                        <Input
                          id="CantidadCuotas"
                          type="number"
                          value={formData.CantidadCuotas}
                          onChange={(e) => setFormData({...formData, CantidadCuotas: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="FechaInicio">Fecha Inicio</Label>
                        <Input
                          id="FechaInicio"
                          type="date"
                          value={formData.FechaInicio}
                          onChange={(e) => setFormData({...formData, FechaInicio: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="FechaFinEstimada">Fecha Vencimiento</Label>
                        <Input
                          id="FechaFinEstimada"
                          type="date"
                          value={formData.FechaFinEstimada}
                          onChange={(e) => setFormData({...formData, FechaFinEstimada: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="TipoCalculo">Tipo de Préstamo</Label>
                      <Select value={formData.TipoCalculo} onValueChange={(value: "Capital+Interes" | "Amortizable") => setFormData({...formData, TipoCalculo: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Capital+Interes">Capital + Interés</SelectItem>
                          <SelectItem value="Amortizable">Amortizable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.MontoPrestado && formData.InteresPorcentaje && formData.CantidadCuotas && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">Cuota Calculada: ${calcularCuota().toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90">
                      {editingPrestamo ? "Actualizar" : "Crear"} Préstamo
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, prestatario o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Prestatario</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestamos.map((prestamo) => (
                  <TableRow key={prestamo.IdPrestamo}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prestamo.clienteNombre}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {prestamo.IdPrestamo}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{prestamo.prestatarioNombre}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">${prestamo.MontoPrestado.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          Saldo: ${prestamo.MontoPrestado.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${prestamo.MontoCuota.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {prestamo.CantidadCuotas - prestamo.CuotasRestantes}/{prestamo.CantidadCuotas} pagos
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#213685] h-2 rounded-full" 
                            style={{ width: `${((prestamo.CantidadCuotas - prestamo.CuotasRestantes) / prestamo.CantidadCuotas) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="default"
                        className={getEstadoBadgeColor(prestamo.Estado)}
                      >
                        {prestamo.Estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{prestamo.FechaFinEstimada}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-[#213685]/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prestamo)}
                          className="hover:bg-[#213685]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(prestamo.IdPrestamo)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
