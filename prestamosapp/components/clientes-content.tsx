"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Loader2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Actualizamos la interfaz para coincidir con el servicio del backend
interface Cliente {
  IdCliente: number
  Nombre: string
  Cedula: string
  Telefono: string
  Email: string
  Direccion: string
  FechaRegistro: string
  cantidadPrestamosActivos?: number // <--- Nombre actualizado según tu servicio
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function ClientesContent() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    Nombre: "",
    Cedula: "",
    Telefono: "",
    Email: "",
    Direccion: ""
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/clientes`)
      if (!res.ok) throw new Error('Error al cargar clientes')
      const data = await res.json()
      setClientes(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.Cedula.includes(searchTerm) ||
    (cliente.Email && cliente.Email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingCliente) {
        // Actualizar cliente existente
        const response = await fetch(`${API_BASE_URL}/api/clientes/${editingCliente.IdCliente}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || 'Error al actualizar cliente')
        }
        
        await fetchClientes()
      } else {
        // Crear nuevo cliente
        const response = await fetch(`${API_BASE_URL}/api/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || 'Error al crear cliente')
        }
        
        await fetchClientes()
      }
      
      resetForm()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error en la operación')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      Nombre: "",
      Cedula: "",
      Telefono: "",
      Email: "",
      Direccion: ""
    })
    setEditingCliente(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      Nombre: cliente.Nombre,
      Cedula: cliente.Cedula,
      Telefono: cliente.Telefono,
      Email: cliente.Email,
      Direccion: cliente.Direccion,
    })
    setIsDialogOpen(true)
  }

  const confirmDelete = (id: number) => {
    setClienteToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!clienteToDelete) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/clientes/${clienteToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || 'Error al eliminar cliente')
      }
      
      await fetchClientes()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar cliente')
    } finally {
      setDeleteDialogOpen(false)
      setClienteToDelete(null)
    }
  }

  // Cálculos para las tarjetas
  const totalClientes = clientes.length;
  const clientesActivos = clientes.filter(c => (c.cantidadPrestamosActivos || 0) > 0).length;
  const porcentajeActivos = totalClientes > 0 ? Math.round((clientesActivos / totalClientes) * 100) : 0;

  if (loading) return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Cargando clientes...</p>
      </div>
  )

  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
            <User className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientesActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              {porcentajeActivos}% del total
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Con Préstamos</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clientesActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              Tienen deuda pendiente
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sin Préstamos</CardTitle>
            <User className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
                {totalClientes - clientesActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibles para ofrecer crédito
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda y botón nuevo */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Gestión de Clientes</CardTitle>
              <CardDescription>
                Administra la información de todos los clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCliente 
                      ? "Actualiza la información del cliente" 
                      : "Completa los datos para registrar un nuevo cliente"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo</Label>
                      <Input
                        id="nombre"
                        value={formData.Nombre}
                        onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                        placeholder="Ej: Juan Pérez"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cedula">Cédula</Label>
                        <Input
                          id="cedula"
                          value={formData.Cedula}
                          onChange={(e) => setFormData({...formData, Cedula: e.target.value})}
                          placeholder="000-0000000-0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.Telefono}
                          onChange={(e) => setFormData({...formData, Telefono: e.target.value})}
                          placeholder="809-000-0000"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.Email}
                        onChange={(e) => setFormData({...formData, Email: e.target.value})}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Textarea
                        id="direccion"
                        value={formData.Direccion}
                        onChange={(e) => setFormData({...formData, Direccion: e.target.value})}
                        placeholder="Calle, número, sector, ciudad"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {submitting ? "Guardando..." : (editingCliente ? "Actualizar" : "Crear")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4 bg-gray-50 p-2 rounded-md border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, cédula o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Préstamos</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => {
                    const tienePrestamos = (cliente.cantidadPrestamosActivos || 0) > 0;
                    return (
                        <TableRow key={cliente.IdCliente} className="hover:bg-gray-50/50">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                            {cliente.IdCliente}
                        </TableCell>
                        <TableCell>
                            <div>
                            <div className="font-medium text-gray-900">{cliente.Nombre}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{cliente.Direccion}</span>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                            <div className="text-sm flex items-center gap-1.5 text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {cliente.Telefono}
                            </div>
                            <div className="text-sm flex items-center gap-1.5 text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                {cliente.Email}
                            </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{cliente.Cedula}</TableCell>
                        <TableCell>
                            <Badge 
                            variant={tienePrestamos ? "default" : "secondary"}
                            className={tienePrestamos 
                                ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" 
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200"}
                            >
                            {tienePrestamos ? "Activo" : "Sin Deuda"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="font-mono">
                            {cliente.cantidadPrestamosActivos || 0} activos
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {new Date(cliente.FechaRegistro).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(cliente)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(cliente.IdCliente)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        </TableCell>
                        </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
              <br/>
              <span className="text-red-600 font-semibold text-xs mt-2 block">
                Si el cliente tiene préstamos asociados, elimínalos primero.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClienteToDelete(null)}>
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