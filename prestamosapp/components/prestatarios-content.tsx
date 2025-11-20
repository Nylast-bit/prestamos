"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Phone, Mail, User, Building, Lock } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Prestatario {
  IdPrestatario: number
  Nombre: string
  Telefono?: string | null
  Email?: string | null
  Clave: string
  prestamosActivos?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function PrestatariosContent() {
  const [prestatarios, setPrestatarios] = useState<Prestatario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrestatario, setEditingPrestatario] = useState<Prestatario | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [prestatarioToDelete, setPrestatarioToDelete] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    Nombre: "",
    Telefono: "",
    Email: "",
    Clave: ""
  })

  useEffect(() => {
    fetchPrestatarios()
  }, [])

  async function fetchPrestatarios() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/prestatarios`)
      if (!res.ok) throw new Error('Error al cargar prestatarios')
      const data = await res.json()
      setPrestatarios(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const filteredPrestatarios = prestatarios.filter(prestatario =>
    prestatario.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prestatario.Email && prestatario.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (prestatario.Telefono && prestatario.Telefono.includes(searchTerm))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Preparar datos - solo enviar campos que no estén vacíos
      const dataToSend: any = {
        Nombre: formData.Nombre,
        Clave: formData.Clave
      }
      
      if (formData.Telefono) dataToSend.Telefono = formData.Telefono
      if (formData.Email) dataToSend.Email = formData.Email

      if (editingPrestatario) {
        // Actualizar prestatario existente
        console.log('Actualizando prestatario:', editingPrestatario.IdPrestatario, dataToSend)
        
        const response = await fetch(`${API_BASE_URL}/api/prestatarios/${editingPrestatario.IdPrestatario}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          console.error('Error del servidor:', errorData)
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
        }
        
        await fetchPrestatarios()
        alert('Prestatario actualizado exitosamente')
      } else {
        // Crear nuevo prestatario
        
        const response = await fetch(`${API_BASE_URL}/api/prestatarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          console.error('Error del servidor:', errorData)
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
        }
        
        await fetchPrestatarios()
        alert('Prestatario creado exitosamente')
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
      Nombre: "",
      Telefono: "",
      Email: "",
      Clave: ""
    })
    setEditingPrestatario(null)
    setShowPassword(false)
    setIsDialogOpen(false)
  }

  const handleEdit = (prestatario: Prestatario) => {
    setEditingPrestatario(prestatario)
    setFormData({
      Nombre: prestatario.Nombre,
      Telefono: prestatario.Telefono || "",
      Email: prestatario.Email || "",
      Clave: prestatario.Clave
    })
    setIsDialogOpen(true)
  }

  const confirmDelete = (id: number) => {
    setPrestatarioToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!prestatarioToDelete) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prestatarios/${prestatarioToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || 'Error al eliminar prestatario')
      }
      
      await fetchPrestatarios()
      alert('Prestatario eliminado exitosamente')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar prestatario')
    } finally {
      setDeleteDialogOpen(false)
      setPrestatarioToDelete(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando prestatarios...</div>
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error: {error}</div>

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
              Prestamistas activos
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
              {prestatarios.length > 0 
                ? Math.round(prestatarios.reduce((sum, p) => sum + (p.prestamosActivos || 0), 0) / prestatarios.length)
                : 0
              }
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
              {prestatarios.length > 0 
                ? Math.max(...prestatarios.map(p => p.prestamosActivos || 0))
                : 0
              }
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
                Administra los prestatarios (prestamistas) que facilitan el dinero
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
                      ? "Actualiza la información del prestatario (prestamista)" 
                      : "Completa los datos para registrar un nuevo prestatario (prestamista)"
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.Nombre}
                      onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                      placeholder="Ej: Juan Pérez Prestamista"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clave">Clave/Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="clave"
                        type={showPassword ? "text" : "password"}
                        value={formData.Clave}
                        onChange={(e) => setFormData({...formData, Clave: e.target.value})}
                        placeholder="Ingrese una contraseña"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                    <Input
                      id="telefono"
                      value={formData.Telefono}
                      onChange={(e) => setFormData({...formData, Telefono: e.target.value})}
                      placeholder="809-000-0000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.Email}
                      onChange={(e) => setFormData({...formData, Email: e.target.value})}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">* Campos requeridos</p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="bg-[#213685] hover:bg-[#213685]/90" 
                    disabled={submitting || !formData.Nombre || !formData.Clave}
                  >
                    {submitting ? "Guardando..." : (editingPrestatario ? "Actualizar" : "Crear")} Prestatario
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
              placeholder="Buscar por nombre, teléfono o email..."
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
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Préstamos Activos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestatarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron prestatarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrestatarios.map((prestatario) => (
                    <TableRow key={prestatario.IdPrestatario}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prestatario.Nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {prestatario.IdPrestatario}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {prestatario.Telefono ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {prestatario.Telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {prestatario.Email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {prestatario.Email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className="bg-[#213685]/10 text-[#213685] border-[#213685]/20"
                        >
                          {prestatario.prestamosActivos || 0} préstamos
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
                            onClick={() => confirmDelete(prestatario.IdPrestatario)}
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

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El prestatario será eliminado permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPrestatarioToDelete(null)}>
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