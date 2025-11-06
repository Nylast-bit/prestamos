"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Phone, Mail, User, Building } from 'lucide-react'

interface Prestatario {
  IdPrestatario: number
  Nombre: string
  Contacto: string
  Telefono: string
  Email: string
  prestamosActivos?: number // Campo calculado
}

const prestatariosIniciales: Prestatario[] = [
  {
    IdPrestatario: 1,
    Nombre: "María García López",
    Contacto: "Gerente General",
    Telefono: "+1 (555) 111-2222",
    Email: "maria.garcia@prestamos.com",
    prestamosActivos: 15
  },
  {
    IdPrestatario: 2,
    Nombre: "Carlos López Martínez",
    Contacto: "Director Financiero",
    Telefono: "+1 (555) 222-3333",
    Email: "carlos.lopez@prestamos.com",
    prestamosActivos: 12
  },
  {
    IdPrestatario: 3,
    Nombre: "Ana Martínez Rodríguez",
    Contacto: "Coordinadora de Crédito",
    Telefono: "+1 (555) 333-4444",
    Email: "ana.martinez@prestamos.com",
    prestamosActivos: 8
  },
  {
    IdPrestatario: 4,
    Nombre: "Juan Pérez González",
    Contacto: "Asesor Senior",
    Telefono: "+1 (555) 444-5555",
    Email: "juan.perez@prestamos.com",
    prestamosActivos: 20
  },
  {
    IdPrestatario: 5,
    Nombre: "Roberto Silva Hernández",
    Contacto: "Especialista en Cobranza",
    Telefono: "+1 (555) 555-6666",
    Email: "roberto.silva@prestamos.com",
    prestamosActivos: 6
  }
]

export function PrestatariosContent() {
  const [prestatarios, setPrestatarios] = useState<Prestatario[]>(prestatariosIniciales)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrestatario, setEditingPrestatario] = useState<Prestatario | null>(null)
  const [formData, setFormData] = useState({
    Nombre: "",
    Contacto: "",
    Telefono: "",
    Email: ""
  })

  const filteredPrestatarios = prestatarios.filter(prestatario =>
    prestatario.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestatario.Contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestatario.Email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingPrestatario) {
      setPrestatarios(prestatarios.map(prestatario => 
        prestatario.IdPrestatario === editingPrestatario.IdPrestatario 
          ? { ...prestatario, ...formData }
          : prestatario
      ))
    } else {
      const nuevoPrestatario: Prestatario = {
        IdPrestatario: Math.max(...prestatarios.map(p => p.IdPrestatario)) + 1,
        ...formData,
        prestamosActivos: 0
      }
      setPrestatarios([...prestatarios, nuevoPrestatario])
    }
    
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      Nombre: "",
      Contacto: "",
      Telefono: "",
      Email: ""
    })
    setEditingPrestatario(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (prestatario: Prestatario) => {
    setEditingPrestatario(prestatario)
    setFormData({
      Nombre: prestatario.Nombre,
      Contacto: prestatario.Contacto,
      Telefono: prestatario.Telefono,
      Email: prestatario.Email
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setPrestatarios(prestatarios.filter(prestatario => prestatario.IdPrestatario !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prestatarios</CardTitle>
            <Building className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{prestatarios.length}</div>
            <p className="text-xs text-muted-foreground">
              Activos en la plataforma
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Préstamos Gestionados</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {prestatarios.reduce((sum, p) => sum + (p.prestamosActivos || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de préstamos activos
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Prestatario</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(prestatarios.reduce((sum, p) => sum + (p.prestamosActivos || 0), 0) / prestatarios.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Préstamos por prestatario
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Más Activo</CardTitle>
            <User className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...prestatarios.map(p => p.prestamosActivos || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo préstamos gestionados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de prestatarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Prestatarios</CardTitle>
              <CardDescription>
                Administra los prestatarios que gestionan los préstamos
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Prestatario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrestatario ? "Editar Prestatario" : "Nuevo Prestatario"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrestatario 
                      ? "Actualiza la información del prestatario" 
                      : "Completa los datos para registrar un nuevo prestatario"
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contacto">Cargo/Contacto</Label>
                      <Input
                        id="contacto"
                        value={formData.Contacto}
                        onChange={(e) => setFormData({...formData, Contacto: e.target.value})}
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
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90">
                      {editingPrestatario ? "Actualizar" : "Crear"} Prestatario
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
              placeholder="Buscar por nombre, contacto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prestatario</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Préstamos Activos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestatarios.map((prestatario) => (
                  <TableRow key={prestatario.IdPrestatario}>
                    <TableCell>
                      <div className="font-medium">{prestatario.Nombre}</div>
                    </TableCell>
                    <TableCell>{prestatario.Contacto}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {prestatario.Telefono}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {prestatario.Email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className="bg-[#213685]/10 text-[#213685] border-[#213685]/20"
                      >
                        {prestatario.prestamosActivos} préstamos
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prestatario)}
                          className="hover:bg-[#213685]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(prestatario.IdPrestatario)}
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
