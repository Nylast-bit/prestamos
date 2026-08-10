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
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Phone, Mail, User, Building, Lock, Loader2, Shield, UserCheck, UserX, Eye, EyeOff, Save } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuthStore } from "@/store/authStore"

// Interfaz actualizada
interface Prestatario {
  IdPrestatario: number
  Nombre: string
  Telefono?: string | null
  Email?: string | null
  Clave: string
  cantidadActivos?: number
  estadoUsuario?: string
  rolUsuario?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function PrestatariosContent() {
  const { user } = useAuthStore()
  const [prestatarios, setPrestatarios] = useState<Prestatario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPrestatario, setEditingPrestatario] = useState<Prestatario | null>(null)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [prestatarioToToggle, setPrestatarioToToggle] = useState<Prestatario | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Estado para Modal "Mi Perfil"
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    Nombre: "",
    Telefono: "",
    Email: "",
    claveActual: "",
    claveNueva: "",
    claveConfirmar: ""
  })
  const [showProfilePasswords, setShowProfilePasswords] = useState(false)
  
  const [formData, setFormData] = useState({
    Nombre: "",
    Telefono: "",
    Email: "",
    Clave: "",
    Rol: "Prestamista"
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

  const activePrestatarios = prestatarios.filter(p => p.estadoUsuario === 'Activo' || !p.estadoUsuario)

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    
    try {
      const dataToSend: any = {
        Nombre: formData.Nombre,
        Rol: formData.Rol
      }
      
      if (formData.Clave && formData.Clave.trim().length > 0) {
        dataToSend.Clave = formData.Clave
      }
      
      if (formData.Telefono) dataToSend.Telefono = formData.Telefono
      if (formData.Email) dataToSend.Email = formData.Email

      if (editingPrestatario) {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios/${editingPrestatario.IdPrestatario}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || `Error ${response.status}`)
        }
        toast.success("Prestamista actualizado exitosamente")
      } else {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || errorData.error || `Error ${response.status}`)
        }
        toast.success("Prestamista creado exitosamente")
      }
      
      await fetchPrestatarios()
      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error en la operación')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      Nombre: "",
      Telefono: "",
      Email: "",
      Clave: "",
      Rol: "Prestamista"
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
      Clave: "",
      Rol: prestatario.rolUsuario || "Prestamista"
    })
    setIsDialogOpen(true)
  }

  const confirmToggle = (prestatario: Prestatario) => {
    setPrestatarioToToggle(prestatario)
    setToggleDialogOpen(true)
  }

  const handleToggleEstado = async () => {
    if (!prestatarioToToggle) return
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios/${prestatarioToToggle.IdPrestatario}/toggle-estado`, {
        method: 'PATCH',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || errorData.error || 'Error al cambiar estado')
      }
      
      const result = await response.json()
      toast.success(result.message || "Estado actualizado")
      await fetchPrestatarios()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar estado')
    } finally {
      setToggleDialogOpen(false)
      setPrestatarioToToggle(null)
    }
  }

  // --- PERFIL PROPIO ---
  const handleOpenProfile = async () => {
    setIsProfileOpen(true)
    setProfileLoading(true)
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios/me`)
      if (res.ok) {
        const data = await res.json()
        setProfileData({
          Nombre: data.Nombre || data.usuario?.Nombre || "",
          Telefono: data.Telefono || "",
          Email: data.Email || data.usuario?.Email || "",
          claveActual: "",
          claveNueva: "",
          claveConfirmar: ""
        })
      }
    } catch (e) {
      console.error("Error cargando perfil:", e)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (profileSaving) return
    setProfileSaving(true)

    try {
      if (profileData.claveNueva && profileData.claveNueva !== profileData.claveConfirmar) {
        throw new Error("Las contraseñas nuevas no coinciden.")
      }
      if (profileData.claveNueva && !profileData.claveActual) {
        throw new Error("Debes ingresar tu contraseña actual para cambiarla.")
      }
      if (profileData.claveNueva && profileData.claveNueva.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.")
      }

      const payload: any = {
        Nombre: profileData.Nombre,
        Telefono: profileData.Telefono,
        Email: profileData.Email
      }

      if (profileData.claveActual && profileData.claveNueva) {
        payload.claveActual = profileData.claveActual
        payload.claveNueva = profileData.claveNueva
      }

      const res = await fetchWithAuth(`${API_BASE_URL}/api/prestatarios/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error actualizando perfil")

      toast.success("Perfil actualizado exitosamente")
      setIsProfileOpen(false)
      await fetchPrestatarios()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error guardando perfil")
    } finally {
      setProfileSaving(false)
    }
  }

  const isCurrentUser = (prestatario: Prestatario) => {
    return user?.idPrestatario === prestatario.IdPrestatario
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
      {/* === BANNER MI PERFIL === */}
      {user && (
        <Card className="border-l-4 border-l-indigo-500 shadow-md bg-gradient-to-r from-indigo-50/80 dark:from-indigo-950/30 to-slate-50 dark:to-slate-900">
          <CardContent className="py-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-600 text-white dark:text-white flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {user.nombre?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-base">{user.nombre}</h3>
                    <Badge className="bg-indigo-100 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-[10px] font-semibold">
                      {user.rol === 'admin_empresa' ? '🏢 Admin' : user.rol === 'Cajero' ? '💼 Cajero' : '🛡️ Prestamista'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building className="h-3 w-3" /> {user.nombreEmpresa}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenProfile}
                className="border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 hover:border-indigo-300 font-medium"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Editar Mi Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header con estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#213685] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prestamistas</CardTitle>
            <Building className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">{prestatarios.length}</div>
            <p className="text-xs text-muted-foreground">{activePrestatarios.length} activos</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Préstamos Activos</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
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
              {activePrestatarios.length > 0 
                ? Math.round(prestatarios.reduce((sum, p) => sum + (p.cantidadActivos || 0), 0) / activePrestatarios.length)
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
                <Button className="bg-[#213685] text-white dark:text-white hover:bg-[#213685] text-white dark:text-white/90 w-full sm:w-auto">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        value={formData.Nombre}
                        onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                        placeholder="Ej: Juan Pérez"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rol">Rol de Usuario *</Label>
                      <Select 
                        value={formData.Rol} 
                        onValueChange={(val) => setFormData({...formData, Rol: val})}
                      >
                        <SelectTrigger id="rol" className="h-9.5 text-xs">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Prestamista">🛡️ Prestamista / Cobrador</SelectItem>
                          <SelectItem value="admin_empresa">🏢 Admin de Empresa</SelectItem>
                          <SelectItem value="Cajero">💼 Cajero Operativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clave">{editingPrestatario ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña de Acceso *"}</Label>
                    <div className="relative">
                      <Input
                        id="clave"
                        type={showPassword ? "text" : "password"}
                        value={formData.Clave}
                        onChange={(e) => setFormData({...formData, Clave: e.target.value})}
                        placeholder={editingPrestatario ? "Dejar vacío para mantener actual" : "Contraseña de acceso al sistema"}
                        required={!editingPrestatario}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
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
                    className="bg-[#213685] text-white dark:text-white hover:bg-[#213685] text-white dark:text-white/90" 
                    disabled={submitting || !formData.Nombre || (!editingPrestatario && !formData.Clave)}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingPrestatario ? "Actualizar" : "Crear Prestamista"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4 bg-muted p-2 rounded-md border">
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
                <TableRow className="bg-muted">
                  <TableHead className="font-semibold text-card-foreground">Prestamista</TableHead>
                  <TableHead className="font-semibold text-card-foreground">Contacto</TableHead>
                  <TableHead className="font-semibold text-card-foreground">Estado</TableHead>
                  <TableHead className="font-semibold text-card-foreground">Préstamos</TableHead>
                  <TableHead className="text-right font-semibold text-card-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestatarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No se encontraron prestamistas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrestatarios.map((prestatario) => {
                    const isInactive = prestatario.estadoUsuario === 'Inactivo'
                    const isSelf = isCurrentUser(prestatario)
                    return (
                    <TableRow 
                      key={prestatario.IdPrestatario} 
                      className={`hover:bg-muted/50 ${isInactive ? 'opacity-50' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold ${
                              isInactive 
                                ? 'bg-gray-200 text-muted-foreground' 
                                : isSelf 
                                  ? 'bg-indigo-100 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300'
                                  : 'bg-[#213685] text-white dark:text-white/10 text-[#213685]'
                            }`}>
                                {prestatario.Nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-foreground flex items-center gap-1.5">
                                  {prestatario.Nombre}
                                  {isSelf && (
                                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-200 text-[9px] px-1.5 py-0">Tú</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">ID: {prestatario.IdPrestatario}</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="space-y-1">
                            {prestatario.Telefono ? (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                {prestatario.Telefono}
                              </div>
                            ) : null}
                            {prestatario.Email ? (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                {prestatario.Email}
                              </div>
                            ) : null}
                            {!prestatario.Telefono && !prestatario.Email && <span className="text-xs text-muted-foreground">Sin contacto</span>}
                         </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={isInactive
                            ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" 
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"}
                        >
                          {isInactive ? <UserX className="h-3 w-3 mr-1" /> : <UserCheck className="h-3 w-3 mr-1" />}
                          {isInactive ? 'Inactivo' : 'Activo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={prestatario.cantidadActivos && prestatario.cantidadActivos > 0 ? "default" : "secondary"}
                          className={prestatario.cantidadActivos && prestatario.cantidadActivos > 0 
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" 
                            : "bg-accent text-muted-foreground hover:bg-gray-200 border-border"}
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
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmToggle(prestatario)}
                              className={`h-8 w-8 p-0 ${isInactive 
                                ? 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50' 
                                : 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'}`}
                              title={isInactive ? "Reactivar usuario" : "Desactivar usuario"}
                            >
                              {isInactive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación de toggle estado */}
      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {prestatarioToToggle?.estadoUsuario === 'Inactivo' 
                ? '¿Reactivar este usuario?' 
                : '¿Desactivar este usuario?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {prestatarioToToggle?.estadoUsuario === 'Inactivo' ? (
                <>
                  El usuario <strong>{prestatarioToToggle?.Nombre}</strong> podrá volver a iniciar sesión y operar en el sistema.
                </>
              ) : (
                <>
                  El usuario <strong>{prestatarioToToggle?.Nombre}</strong> no podrá iniciar sesión.
                  <br/>
                  <span className="text-amber-600 font-semibold text-xs mt-2 block">
                    Sus préstamos, pagos y transacciones se mantendrán intactos.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPrestatarioToToggle(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleEstado}
              className={prestatarioToToggle?.estadoUsuario === 'Inactivo'
                ? "bg-emerald-600 text-white dark:text-white hover:bg-emerald-700"
                : "bg-amber-600 text-white dark:text-white hover:bg-amber-700"}
            >
              {prestatarioToToggle?.estadoUsuario === 'Inactivo' ? 'Reactivar' : 'Desactivar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* === MODAL EDITAR MI PERFIL === */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-indigo-600 text-white dark:text-white flex items-center justify-center text-white font-bold shadow">
                {user?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-lg">Editar Mi Perfil</DialogTitle>
                <DialogDescription className="text-xs">
                  Modifica tu información personal y contraseña
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="profile-nombre" className="text-xs font-semibold">Nombre</Label>
                <Input
                  id="profile-nombre"
                  value={profileData.Nombre}
                  onChange={(e) => setProfileData({...profileData, Nombre: e.target.value})}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="profile-telefono" className="text-xs font-semibold">Teléfono</Label>
                  <Input
                    id="profile-telefono"
                    value={profileData.Telefono}
                    onChange={(e) => setProfileData({...profileData, Telefono: e.target.value})}
                    placeholder="809-000-0000"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="text-xs font-semibold">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileData.Email}
                    onChange={(e) => setProfileData({...profileData, Email: e.target.value})}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="border-t pt-3 mt-1">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs font-bold text-card-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Cambiar Contraseña
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProfilePasswords(!showProfilePasswords)}
                    className="text-xs h-7 px-2 text-muted-foreground"
                  >
                    {showProfilePasswords ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
                    {showProfilePasswords ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="clave-actual" className="text-[11px] text-muted-foreground">Contraseña Actual</Label>
                    <Input
                      id="clave-actual"
                      type={showProfilePasswords ? "text" : "password"}
                      value={profileData.claveActual}
                      onChange={(e) => setProfileData({...profileData, claveActual: e.target.value})}
                      placeholder="Tu contraseña actual"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="clave-nueva" className="text-[11px] text-muted-foreground">Nueva Contraseña</Label>
                      <Input
                        id="clave-nueva"
                        type={showProfilePasswords ? "text" : "password"}
                        value={profileData.claveNueva}
                        onChange={(e) => setProfileData({...profileData, claveNueva: e.target.value})}
                        placeholder="Mínimo 6 caracteres"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="clave-confirmar" className="text-[11px] text-muted-foreground">Confirmar Nueva</Label>
                      <Input
                        id="clave-confirmar"
                        type={showProfilePasswords ? "text" : "password"}
                        value={profileData.claveConfirmar}
                        onChange={(e) => setProfileData({...profileData, claveConfirmar: e.target.value})}
                        placeholder="Repetir nueva contraseña"
                        className="h-9"
                      />
                    </div>
                  </div>
                  {profileData.claveNueva && profileData.claveConfirmar && profileData.claveNueva !== profileData.claveConfirmar && (
                    <p className="text-xs text-red-500 font-medium">⚠️ Las contraseñas no coinciden</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsProfileOpen(false)} disabled={profileSaving}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={profileSaving || !profileData.Nombre}
              className="bg-indigo-600 text-white dark:text-white hover:bg-indigo-700 text-white"
            >
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}