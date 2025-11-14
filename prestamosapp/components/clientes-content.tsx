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
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react'


interface Cliente {
  IdCliente: number
  Nombre: string
  Cedula: string
  Telefono: string
  Email: string
  Direccion: string
  FechaRegistro: string
  prestamosActivos?: number // Campo calculado
}


let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function ClientesContent() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    Nombre: "",
    Cedula: "",
    Telefono: "",
    Email: "",
    Direccion: ""
  })

  useEffect(() => {
    async function fetchClientes() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/api/clientes`);

        if (!res.ok) throw new Error('Error al cargar clientes')
        const data = await res.json()
        setClientes(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }
    fetchClientes()
  }, [])

  const filteredClientes = clientes.filter(cliente =>
    cliente.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.Cedula.includes(searchTerm) ||
    cliente.Email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCliente) {
      // Actualizar cliente existente
      setClientes(clientes.map(cliente => 
        cliente.IdCliente === editingCliente.IdCliente 
          ? { ...cliente, ...formData }
          : cliente
      ))
    } else {
      // Crear nuevo cliente
      const nuevoCliente: Cliente = {
        IdCliente: Math.max(...clientes.map(c => c.IdCliente)) + 1,
        ...formData,
        FechaRegistro: new Date().toISOString().split('T')[0],
      }
      setClientes([...clientes, nuevoCliente])
    }
    
    resetForm()
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

  const handleDelete = (id: number) => {
    setClientes(clientes.filter(cliente => cliente.IdCliente !== id))
  }

    if (loading) return <div>Cargando clientes...</div>
  if (error) return <div>Error: {error}</div>
  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <User className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 este mes
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {clientes.filter(c => c.prestamosActivos! > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((clientes.filter(c => c.prestamosActivos! > 0).length / clientes.length) * 100)}% del total
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Préstamos</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {clientes.filter(c => c.prestamosActivos! > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes con préstamos activos
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Este Mes</CardTitle>
            <User className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
            <p className="text-xs text-muted-foreground">
              Registrados en enero
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de búsqueda y botón nuevo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Clientes</CardTitle>
              <CardDescription>
                Administra la información de todos los clientes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90">
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input
                          id="nombre"
                          value={formData.Nombre}
                          onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input
                          id="apellido"
                          value={formData.Nombre}
                          onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cedula">Cédula</Label>
                        <Input
                          id="cedula"
                          value={formData.Cedula}
                          onChange={(e) => setFormData({...formData, Cedula: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.Telefono}
                          onChange={(e) => setFormData({...formData, Telefono: e.target.value})}
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Textarea
                        id="direccion"
                        value={formData.Direccion}
                        onChange={(e) => setFormData({...formData, Direccion: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90">
                      {editingCliente ? "Actualizar" : "Crear"} Cliente
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
              placeholder="Buscar por nombre, apellido, cédula o email..."
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
                  <TableHead>Contacto</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Préstamos</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.IdCliente}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cliente.Nombre}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cliente.Direccion.substring(0, 30)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {cliente.Telefono}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {cliente.Email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.Cedula}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={cliente.prestamosActivos! > 0 ? "default" : "secondary"}
                        className={cliente.prestamosActivos! > 0 ? "bg-[#213685]" : ""}
                      >
                        {cliente.prestamosActivos! > 0 ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {cliente.prestamosActivos} activos
                      </Badge>
                    </TableCell>
                    <TableCell>{cliente.FechaRegistro}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cliente)}
                          className="hover:bg-[#213685]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cliente.IdCliente)}
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
