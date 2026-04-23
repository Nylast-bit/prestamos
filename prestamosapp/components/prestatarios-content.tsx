"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Phone, Mail, User, Building, Lock, Loader2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Interfaz actualizada para coincidir con el servicio
interface Prestatario {
  IdPrestatario: number
  Nombre: string
  Telefono?: string | null
  Email?: string | null
  Clave: string
  cantidadActivos?: number // <--- Campo nuevo que viene del backend
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
      const res = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios`)
      if (!res.ok) throw new Error('Error al cargar prestatarios')
      const data = await res.json()
      // El backend ahora devuelve objetos con la propiedad 'cantidadActivos'
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
      const dataToSend: any = {
        Nombre: formData.Nombre,
        Clave: formData.Clave
      }
      
      if (formData.Telefono) dataToSend.Telefono = formData.Telefono
      if (formData.Email) dataToSend.Email = formData.Email

      if (editingPrestatario) {
        // Actualizar
        const response = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios/${editingPrestatario.IdPrestatario}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || `Error ${response.status}`)
        }
        
        await fetchPrestatarios()
      } else {
        // Crear
        const response = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || errorData.error || `Error ${response.status}`)
        }
        
        await fetchPrestatarios()
      }
      
      resetForm()
      setIsDialogOpen(false) // Cerramos el modal explícitamente aquí por si acaso
    } catch (error) {
      console.error('Error:', error)
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
      Clave: prestatario.Clave // Asegúrate de que el backend devuelve la clave si quieres editarla, sino déjala vacía
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
      const response = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios/${prestatarioToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || 'Error al eliminar')
      }
      
      await fetchPrestatarios()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar')
    } finally {
      setDeleteDialogOpen(false)
      setPrestatarioToDelete(null)
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Cargando prestamistas...</p>
    </div>
  )
  
  if (error) return <div className="flex items-center justify-center h-64 text-red-600">Error: {error}</div>

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prestamistas</CardTitle>
            <Building className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{prestatarios.length}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Préstamos Activos</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {/* Sumamos usando la nueva propiedad cantidadActivos */}
              {prestatarios.reduce((sum, p) => sum + (p.cantidadActivos || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total en cartera viva</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio / Prestamista</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {prestatarios.length > 0 
                ? Math.round(prestatarios.reduce((sum, p) => sum + (p.cantidadActivos || 0), 0) / prestatarios.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Préstamos por persona</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Más Activo</CardTitle>
            <User className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {prestatarios.length > 0 
                ? Math.max(...prestatarios.map(p => p.cantidadActivos || 0))
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Máximo de préstamos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de prestatarios */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Gestión de Prestamistas</CardTitle>
              <CardDescription>
                Administra los prestamistas que facilitan el dinero
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Prestamista
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrestatario ? "Editar Prestamista" : "Nuevo Prestamista"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPrestatario 
                      ? "Actualiza la información del prestamista." 
                      : "Completa los datos para registrar un nuevo prestamista."
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
                        placeholder="Contraseña de acceso"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <Lock className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          value={formData.Telefono}
                          onChange={(e) => setFormData({...formData, Telefono: e.target.value})}
                          placeholder="809-000-0000"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.Email}
                          onChange={(e) => setFormData({...formData, Email: e.target.value})}
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">* Campos requeridos</p>
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
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingPrestatario ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4 bg-gray-50 p-2 rounded-md border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Prestamista</TableHead>
                  <TableHead className="font-semibold text-gray-700">Contacto</TableHead>
                  <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestatarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No se encontraron prestamistas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrestatarios.map((prestatario) => (
                    <TableRow key={prestatario.IdPrestatario} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#213685]/10 flex items-center justify-center text-[#213685] font-bold">
                                {prestatario.Nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{prestatario.Nombre}</div>
                                <div className="text-xs text-muted-foreground">ID: {prestatario.IdPrestatario}</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="space-y-1">
                            {prestatario.Telefono ? (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {prestatario.Telefono}
                              </div>
                            ) : null}
                            {prestatario.Email ? (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                {prestatario.Email}
                              </div>
                            ) : null}
                            {!prestatario.Telefono && !prestatario.Email && <span className="text-xs text-gray-400">Sin contacto</span>}
                         </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={prestatario.cantidadActivos && prestatario.cantidadActivos > 0 ? "default" : "secondary"}
                          className={prestatario.cantidadActivos && prestatario.cantidadActivos > 0 
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" 
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200"}
                        >
                          {prestatario.cantidadActivos || 0} Activos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(prestatario)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDelete(prestatario.IdPrestatario)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
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
              Esta acción eliminará al prestamista permanentemente.
              <br/>
              <span className="text-red-600 font-semibold text-xs mt-2 block">
                Nota: Si el prestamista tiene préstamos activos, la eliminación podría fallar o dejar datos huérfanos.
              </span>
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