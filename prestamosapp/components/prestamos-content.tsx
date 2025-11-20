"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, DollarSign, Calendar, TrendingUp, AlertTriangle, Eye, Calculator } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Prestamo {
  IdPrestamo: number
  IdCliente: number
  IdPrestatario: number
  clienteNombre?: string
  prestatarioNombre?: string
  MontoPrestado: number
  TipoCalculo: string
  InteresPorcentaje: number
  InteresMontoTotal: number
  CapitalRestante: number
  CapitalTotalPagar: number
  MontoCuota: number
  CantidadCuotas: number
  CuotasRestantes: number
  ModalidadPago: string
  FechaInicio: string
  FechaFinEstimada: string
  FechaUltimoPago: string | null
  Estado: string
  TablaPagos?: string | null
  Observaciones?: string | null
}

interface Cliente {
  IdCliente: number
  Nombre: string
}

interface Prestatario {
  IdPrestatario: number
  Nombre: string
}

interface SimulacionCuota {
  numeroCuota: number
  capital: number
  interes: number
  cuota: number
}

interface SimulacionResumen {
  montoSolicitado: number
  tasaInteres: number
  numeroCuotas: number
  tipoCalculo: string
  montoTotalAPagar: number
  montoTotalInteres: number
  montoCuota: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function PrestamosContent() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [prestatarios, setPrestatarios] = useState<Prestatario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSimulationDialogOpen, setIsSimulationDialogOpen] = useState(false)
  const [editingPrestamo, setEditingPrestamo] = useState<Prestamo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [prestamoToDelete, setPrestamoToDelete] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  // Simulación
  const [simulacionResumen, setSimulacionResumen] = useState<SimulacionResumen | null>(null)
  const [simulacionCuotas, setSimulacionCuotas] = useState<SimulacionCuota[]>([])
  const [simulando, setSimulando] = useState(false)

  const [formData, setFormData] = useState({
    IdCliente: "",
    IdPrestatario: "",
    MontoPrestado: "",
    TipoCalculo: "capital+interes",
    InteresPorcentaje: "",
    CantidadCuotas: "",
    ModalidadPago: "Quincenal",
    FechaInicio: "",
    FechaFinEstimada: "",
    Observaciones: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prestamosRes, clientesRes, prestatariosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/prestamos`),
        fetch(`${API_BASE_URL}/api/clientes`),
        fetch(`${API_BASE_URL}/api/prestatarios`)
      ])

      if (prestamosRes.ok) {
        const prestamosData = await prestamosRes.json()
        setPrestamos(prestamosData)
      }
      if (clientesRes.ok) {
        const clientesData = await clientesRes.json()
        setClientes(clientesData)
      }
      if (prestatariosRes.ok) {
        const prestatariosData = await prestatariosRes.json()
        setPrestatarios(prestatariosData)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const filteredPrestamos = prestamos.filter(prestamo =>
    (prestamo.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestamo.prestatarioNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestamo.Estado.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const simularPrestamo = async () => {
    if (!formData.MontoPrestado || !formData.InteresPorcentaje || !formData.CantidadCuotas) {
      alert('Por favor completa monto, tasa de interés y cantidad de cuotas')
      return
    }

    setSimulando(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/prestamos/simular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parseFloat(formData.MontoPrestado),
          tasaInteres: parseFloat(formData.InteresPorcentaje),
          numeroCuotas: parseInt(formData.CantidadCuotas),
          tipoCalculo: formData.TipoCalculo,
          observaciones: formData.Observaciones
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || 'Error al simular préstamo')
      }

      const data = await response.json()
      
      if (data.success) {
        setSimulacionResumen(data.resumen)
        setSimulacionCuotas(data.cuotas)
        setIsSimulationDialogOpen(true)
      }
    } catch (error) {
      console.error('Error en simulación:', error)
      alert(error instanceof Error ? error.message : 'Error al simular préstamo')
    } finally {
      setSimulando(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Preparar datos según el modelo Prisma
      const prestamoData = {
        IdCliente: parseInt(formData.IdCliente),
        IdPrestatario: parseInt(formData.IdPrestatario),
        MontoPrestado: parseFloat(formData.MontoPrestado),
        TipoCalculo: formData.TipoCalculo,
        InteresPorcentaje: parseFloat(formData.InteresPorcentaje),
        CantidadCuotas: parseInt(formData.CantidadCuotas),
        ModalidadPago: formData.ModalidadPago,
        FechaInicio: formData.FechaInicio,
        FechaFinEstimada: formData.FechaFinEstimada,
        Observaciones: formData.Observaciones || null
      }

      if (editingPrestamo) {
        // Actualizar préstamo existente
        console.log('Actualizando préstamo:', editingPrestamo.IdPrestamo, prestamoData)
        
        const response = await fetch(`${API_BASE_URL}/api/prestamos/${editingPrestamo.IdPrestamo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prestamoData)
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          console.error('Error del servidor:', errorData)
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
        }
        
        await fetchData()
        alert('Préstamo actualizado exitosamente')
      } else {
        // Crear nuevo préstamo
        console.log('Creando préstamo:', prestamoData)
        
        const response = await fetch(`${API_BASE_URL}/api/prestamos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prestamoData)
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          console.error('Error del servidor:', errorData)
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
        }
        
        await fetchData()
        alert('Préstamo creado exitosamente')
      }
      
      resetForm()
    } catch (error) {
      console.error('Error en handleSubmit:', error)
      alert(error instanceof Error ? error.message : 'Error en la operación')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      IdCliente: "",
      IdPrestatario: "",
      MontoPrestado: "",
      TipoCalculo: "capital+interes",
      InteresPorcentaje: "",
      CantidadCuotas: "",
      ModalidadPago: "Quincenal",
      FechaInicio: "",
      FechaFinEstimada: "",
      Observaciones: ""
    })
    setEditingPrestamo(null)
    setSimulacionResumen(null)
    setSimulacionCuotas([])
    setIsDialogOpen(false)
    setIsSimulationDialogOpen(false)
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
      FechaInicio: prestamo.FechaInicio.split('T')[0],
      FechaFinEstimada: prestamo.FechaFinEstimada.split('T')[0],
      Observaciones: prestamo.Observaciones || ""
    })
    setIsDialogOpen(true)
  }

  const confirmDelete = (id: number) => {
    setPrestamoToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!prestamoToDelete) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prestamos/${prestamoToDelete}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || 'Error al eliminar préstamo')
      }
      
      await fetchData()
      alert('Préstamo eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(error instanceof Error ? error.message : 'Error al eliminar préstamo')
    } finally {
      setDeleteDialogOpen(false)
      setPrestamoToDelete(null)
    }
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
  const capitalEnCalle = prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + Number(p.MontoPrestado), 0)
  const interesTotal = prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + Number(p.InteresMontoTotal), 0)
  const prestamosEnMora = prestamos.filter(p => p.Estado === "En Mora").length

  if (loading) return <div className="flex items-center justify-center h-64">Cargando préstamos...</div>

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
            <p className="text-xs text-muted-foreground">Total en cartera</p>
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
            <p className="text-xs text-muted-foreground">Saldo pendiente total</p>
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
            <p className="text-xs text-muted-foreground">Interés programado</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mora</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{prestamosEnMora}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de préstamos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Préstamos</CardTitle>
              <CardDescription>Administra todos los préstamos de la plataforma</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Préstamo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrestamo ? "Editar Préstamo" : "Nuevo Préstamo"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrestamo 
                      ? "Actualiza la información del préstamo" 
                      : "Completa los datos y simula antes de crear el préstamo"
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="IdCliente">Cliente</Label>
                      <Select value={formData.IdCliente} onValueChange={(value) => setFormData({...formData, IdCliente: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.IdCliente} value={cliente.IdCliente.toString()}>
                              {cliente.Nombre}
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
                          {prestatarios.map((prestatario) => (
                            <SelectItem key={prestatario.IdPrestatario} value={prestatario.IdPrestatario.toString()}>
                              {prestatario.Nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="MontoPrestado">Monto ($)</Label>
                      <Input
                        id="MontoPrestado"
                        type="number"
                        step="0.01"
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
                        step="0.01"
                        value={formData.InteresPorcentaje}
                        onChange={(e) => setFormData({...formData, InteresPorcentaje: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="CantidadCuotas">Nº Cuotas</Label>
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
                      <Label htmlFor="TipoCalculo">Tipo de Cálculo</Label>
                      <Select value={formData.TipoCalculo} onValueChange={(value) => setFormData({...formData, TipoCalculo: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="capital+interes">Capital + Interés</SelectItem>
                          <SelectItem value="amortizable">Amortizable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ModalidadPago">Modalidad de Pago</Label>
                      <Select value={formData.ModalidadPago} onValueChange={(value) => setFormData({...formData, ModalidadPago: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mensual">Mensual</SelectItem>
                          <SelectItem value="Quincenal">Quincenal</SelectItem>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <Label htmlFor="Observaciones">Observaciones</Label>
                    <Textarea
                      id="Observaciones"
                      value={formData.Observaciones}
                      onChange={(e) => setFormData({...formData, Observaciones: e.target.value})}
                      placeholder="Notas adicionales sobre el préstamo..."
                    />
                  </div>

                  {!editingPrestamo && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={simularPrestamo}
                      disabled={simulando || !formData.MontoPrestado || !formData.InteresPorcentaje || !formData.CantidadCuotas}
                      className="w-full"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {simulando ? "Simulando..." : "Simular Préstamo"}
                    </Button>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="bg-[#213685] hover:bg-[#213685]/90" 
                    disabled={submitting}
                  >
                    {submitting ? "Guardando..." : (editingPrestamo ? "Actualizar" : "Crear")} Préstamo
                  </Button>
                </DialogFooter>
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
                {filteredPrestamos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron préstamos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrestamos.map((prestamo) => (
                    <TableRow key={prestamo.IdPrestamo}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prestamo.clienteNombre || `Cliente #${prestamo.IdCliente}`}</div>
                          <div className="text-sm text-muted-foreground">ID: {prestamo.IdPrestamo}</div>
                        </div>
                      </TableCell>
                      <TableCell>{prestamo.prestatarioNombre || `Prestatario #${prestamo.IdPrestatario}`}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">${Number(prestamo.MontoPrestado).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            Saldo: ${Number(prestamo.CapitalRestante).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${Number(prestamo.MontoCuota).toLocaleString()}</TableCell>
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
                        <Badge variant="default" className={getEstadoBadgeColor(prestamo.Estado)}>
                          {prestamo.Estado}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(prestamo.FechaFinEstimada).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                            onClick={() => confirmDelete(prestamo.IdPrestamo)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Simulación */}
      <Dialog open={isSimulationDialogOpen} onOpenChange={setIsSimulationDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Simulación de Préstamo</DialogTitle>
            <DialogDescription>
              Revisa los detalles del préstamo antes de crearlo
            </DialogDescription>
          </DialogHeader>
          
          {simulacionResumen && (
            <div className="space-y-4">
              {/* Resumen */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen del Préstamo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monto Solicitado</p>
                      <p className="text-xl font-bold text-[#213685]">
                        ${simulacionResumen.montoSolicitado.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tasa de Interés</p>
                      <p className="text-xl font-bold">{simulacionResumen.tasaInteres}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total a Pagar</p>
                      <p className="text-xl font-bold text-green-600">
                        ${simulacionResumen.montoTotalAPagar.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interés Total</p>
                      <p className="text-xl font-bold text-blue-600">
                        ${simulacionResumen.montoTotalInteres.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cuota {formData.ModalidadPago}</p>
                      <p className="text-xl font-bold text-orange-600">
                        ${simulacionResumen.montoCuota.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Cuotas</p>
                      <p className="text-xl font-bold">{simulacionResumen.numeroCuotas}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de Cuotas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plan de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Cuota</TableHead>
                          <TableHead className="text-right">Capital</TableHead>
                          <TableHead className="text-right">Interés</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulacionCuotas.map((cuota) => (
                          <TableRow key={cuota.numeroCuota}>
                            <TableCell className="font-medium">{cuota.numeroCuota}</TableCell>
                            <TableCell className="text-right">
                              ${cuota.capital.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </TableCell>
                            <TableCell className="text-right text-blue-600">
                              ${cuota.interes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${cuota.cuota.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsSimulationDialogOpen(false)}
            >
              Cerrar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-[#213685] hover:bg-[#213685]/90"
              disabled={submitting}
            >
              {submitting ? "Creando..." : "Crear Préstamo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El préstamo será eliminado permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPrestamoToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}