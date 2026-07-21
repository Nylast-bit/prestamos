"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Loader2, ArrowRight, CreditCard } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Map, MapControls } from "@/components/ui/map"

// Actualizamos la interfaz para coincidir con el servicio del backend
interface Cliente {
  IdCliente: number
  Nombre: string
  Cedula: string
  Telefono: string
  Email?: string
  NumeroCuenta?: string
  Direccion: string
  FechaRegistro: string
  cantidadPrestamosActivos?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function ClientesContent() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  
  // Modal Eliminar normal
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<number | null>(null)
  
  // Modal Eliminar con prestamos
  const [loansModalOpen, setLoansModalOpen] = useState(false)
  const [clientWithLoans, setClientWithLoans] = useState<Cliente | null>(null)
  const [clientLoans, setClientLoans] = useState<any[]>([])
  const [loadingLoans, setLoadingLoans] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  
  // Validaciones
  const [formErrors, setFormErrors] = useState({ cedula: "", email: "" })
  
  // Paginacion
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Mapa
  const [mapOpen, setMapOpen] = useState(false)
  const [mapCoords, setMapCoords] = useState<{lng: number, lat: number}>({ lng: -69.9312, lat: 18.4861 }) // SD, RD
  const [mapLoading, setMapLoading] = useState(false)

  const [formData, setFormData] = useState({
    Nombre: "",
    Cedula: "",
    Telefono: "",
    Email: "",
    NumeroCuenta: "",
    Direccion: ""
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/clientes`)
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
    (cliente.Email && cliente.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.NumeroCuenta && cliente.NumeroCuenta.includes(searchTerm))
  )

  // Calcular paginacion
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  // Al buscar, regresar a pagina 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm])

  const validateEmail = (email: string) => {
    if (!email) return true; // si es opcional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  const validateCedula = (cedula: string) => {
    const cleanCedula = cedula.replace(/-/g, '');
    if (cleanCedula.length !== 11) return false;
    
    let suma = 0;
    const verificador = parseInt(cleanCedula.charAt(10));
    
    for (let i = 0; i < 10; i++) {
      let num = parseInt(cleanCedula.charAt(i));
      if ((i + 1) % 2 === 0) num *= 2;
      if (num > 9) num -= 9;
      suma += num;
    }
    
    const digitoEsperado = (10 - (suma % 10)) % 10;
    return verificador === digitoEsperado;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({ cedula: "", email: "" })
    
    let hasError = false;
    
    if (!validateCedula(formData.Cedula)) {
      setFormErrors(prev => ({...prev, cedula: "Cédula inválida (Módulo 10)"}))
      hasError = true;
    }
    
    if (formData.Email && !validateEmail(formData.Email)) {
      setFormErrors(prev => ({...prev, email: "Formato de correo inválido"}))
      hasError = true;
    }
    
    if (hasError) return;

    setSubmitting(true)
    
    try {
      if (editingCliente) {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/clientes/${editingCliente.IdCliente}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || 'Error al actualizar cliente')
        }
        
        await fetchClientes()
        toast.success('Cliente actualizado exitosamente')
      } else {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
          throw new Error(errorData.message || 'Error al crear cliente')
        }
        
        await fetchClientes()
        toast.success('Cliente registrado exitosamente')
      }
      
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en la operación')
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
      NumeroCuenta: "",
      Direccion: ""
    })
    setFormErrors({ cedula: "", email: "" })
    setEditingCliente(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      Nombre: cliente.Nombre,
      Cedula: cliente.Cedula,
      Telefono: cliente.Telefono,
      Email: cliente.Email || "",
      NumeroCuenta: cliente.NumeroCuenta || "",
      Direccion: cliente.Direccion,
    })
    setFormErrors({ cedula: "", email: "" })
    setIsDialogOpen(true)
  }

  const confirmDelete = async (cliente: Cliente) => {
    const tienePrestamos = (cliente.cantidadPrestamosActivos || 0) > 0;
    
    if (tienePrestamos) {
      setClientWithLoans(cliente);
      setLoansModalOpen(true);
      setLoadingLoans(true);
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/prestamos`);
        const data = await res.json();
        const activeLoans = data.filter((p: any) => p.IdCliente === cliente.IdCliente && p.Estado === 'Activo');
        setClientLoans(activeLoans);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLoans(false);
      }
    } else {
      setClienteToDelete(cliente.IdCliente)
      setDeleteDialogOpen(true)
    }
  }

  const handleDelete = async () => {
    if (!clienteToDelete) return
    
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/clientes/${clienteToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        throw new Error(errorData.message || 'Error al eliminar cliente')
      }
      
      await fetchClientes()
      toast.success('Cliente eliminado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar cliente')
    } finally {
      setDeleteDialogOpen(false)
      setClienteToDelete(null)
    }
  }

  // ==== FUNCIONES DEL MAPA ====
  const openMap = async () => {
    setMapOpen(true);
    if (formData.Direccion.trim() !== "") {
      setMapLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.Direccion)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          setMapCoords({ lng: parseFloat(data[0].lon), lat: parseFloat(data[0].lat) });
        }
      } catch (e) {
        console.error("Geocoding error", e);
      } finally {
        setMapLoading(false);
      }
    }
  }

  const confirmMapLocation = async () => {
    setMapLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${mapCoords.lat}&lon=${mapCoords.lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({...prev, Direccion: data.display_name}));
      }
    } catch (e) {
      console.error("Reverse geocoding error", e);
    } finally {
      setMapLoading(false);
      setMapOpen(false);
    }
  }
  // =============================

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        items.push(
            <PaginationItem key="1">
                <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">1</PaginationLink>
            </PaginationItem>
        );
        if (startPage > 2) {
            items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis /></PaginationItem>);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        items.push(
            <PaginationItem key={i}>
                <PaginationLink isActive={currentPage === i} onClick={() => setCurrentPage(i)} className="cursor-pointer">
                    {i}
                </PaginationLink>
            </PaginationItem>
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
        }
        items.push(
            <PaginationItem key={totalPages}>
                <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">{totalPages}</PaginationLink>
            </PaginationItem>
        );
    }
    
    return items;
  };

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
                          onChange={(e) => {
                            setFormData({...formData, Cedula: e.target.value})
                            if (formErrors.cedula) setFormErrors({...formErrors, cedula: ""})
                          }}
                          placeholder="000-0000000-0"
                          required
                          className={formErrors.cedula ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {formErrors.cedula && <span className="text-xs text-red-500">{formErrors.cedula}</span>}
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Opcional)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.Email}
                          onChange={(e) => {
                            setFormData({...formData, Email: e.target.value})
                            if (formErrors.email) setFormErrors({...formErrors, email: ""})
                          }}
                          placeholder="correo@ejemplo.com"
                          className={formErrors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {formErrors.email && <span className="text-xs text-red-500">{formErrors.email}</span>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numeroCuenta">Número de Cuenta (Opcional)</Label>
                        <Input
                          id="numeroCuenta"
                          value={formData.NumeroCuenta}
                          onChange={(e) => setFormData({...formData, NumeroCuenta: e.target.value})}
                          placeholder="Ej: 0123456789"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={openMap} className="h-6 text-[#213685] p-0 pr-2">
                          <MapPin className="w-3 h-3 mr-1" /> Buscar en mapa
                        </Button>
                      </div>
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
          
          <div className="rounded-md border mb-4">
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
                {currentItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  currentItems.map((cliente) => {
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
                                <span className="truncate max-w-[200px]" title={cliente.Direccion}>{cliente.Direccion}</span>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                            {cliente.Telefono && (
                              <div className="text-sm flex items-center gap-1.5 text-gray-600">
                                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                                  {cliente.Telefono}
                              </div>
                            )}
                            {cliente.Email && (
                              <div className="text-sm flex items-center gap-1.5 text-gray-600">
                                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                                  {cliente.Email}
                              </div>
                            )}
                            {cliente.NumeroCuenta && (
                              <div className="text-xs flex items-center gap-1.5 text-gray-600">
                                  <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                                  <span>Cta: {cliente.NumeroCuenta}</span>
                              </div>
                            )}
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
                                onClick={() => confirmDelete(cliente)}
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

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El cliente será eliminado permanentemente.
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

      <Dialog open={loansModalOpen} onOpenChange={setLoansModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              No se puede eliminar a {clientWithLoans?.Nombre}
            </DialogTitle>
            <DialogDescription>
              Este cliente tiene <strong>{clientWithLoans?.cantidadPrestamosActivos} préstamos activos</strong>. 
              Debes saldarlos o eliminarlos primero.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            {loadingLoans ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientLoans.length > 0 ? (
              <div className="space-y-3">
                {clientLoans.map(prestamo => (
                  <div key={prestamo.IdPrestamo} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">Préstamo #{prestamo.IdPrestamo}</p>
                      <p className="text-xs text-muted-foreground">Monto: ${prestamo.MontoPrestado} | Balance: ${prestamo.BalancePendiente}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-[#213685] text-[#213685] hover:bg-[#213685]/10"
                      onClick={() => {
                         router.push(`/client/prestamos`);
                      }}
                    >
                      Ir a Préstamos <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">No se encontraron los detalles de los préstamos.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoansModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Seleccionar Ubicación</DialogTitle>
            <DialogDescription>
              Mueve el mapa para seleccionar la dirección exacta.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 rounded-md overflow-hidden relative border border-input mt-2">
            {mapLoading && (
                <div className="absolute inset-0 z-20 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-[#213685]" />
                </div>
            )}
            <Map
              viewport={{
                center: [mapCoords.lng, mapCoords.lat],
                zoom: 14,
                bearing: 0,
                pitch: 0
              }}
              onViewportChange={(v) => {
                 setMapCoords({ lng: v.center[0], lat: v.center[1] })
              }}
            >
              <MapControls position="bottom-right" showZoom showCompass showLocate />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none z-10">
                 <MapPin className="h-8 w-8 text-red-500 drop-shadow-md" fill="white" />
              </div>
            </Map>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMapOpen(false)}>Cancelar</Button>
            <Button onClick={confirmMapLocation} className="bg-[#213685] hover:bg-[#213685]/90">
              Confirmar Ubicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}