"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, Banknote, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// 👇 Importamos el componente (Asegúrate de que la carpeta "solicitudes" exista dentro de "components")
import { SolicitudFormDialog } from "@/components/solicitudes/SolicitudesFormDialog"

// --- INTERFACES ---
interface Cliente {
  IdCliente: number
  Nombre: string
  Cedula: string | null
}

interface Solicitud {
  IdSolicitud: number
  IdCliente: number
  Cliente?: Cliente
  MontoSolicitado: number
  FechaDeseada: string
  Estado: string
  Notas: string | null
  FechaCreacion: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// Helpers
const formatMoney = (amount: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount)
const formatDate = (dateString: string) => {
  if (!dateString) return "---";
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

export function SolicitudesContent() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([]) 
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  
  // --- ESTADOS DEL FORMULARIO ---
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingSolicitud, setEditingSolicitud] = useState<Solicitud | null>(null)
  
  const initialFormState = {
    IdCliente: "",
    MontoSolicitado: "",
    FechaDeseada: "",
    Estado: "PENDIENTE", // Lo pongo en mayúscula como en tu Postman por si acaso
    Notas: ""
  }
  const [formData, setFormData] = useState(initialFormState)

  // Diálogos de Confirmación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [solicitudToDelete, setSolicitudToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // 🚨 CORRECCIÓN: Rutas actualizadas a /api/solicitudesprestamo
      const [resSolicitudes, resClientes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/api/solicitudesprestamo`),
        fetchWithAuth(`${API_BASE_URL}/api/clientes`)
      ]);

      if (resSolicitudes.ok) setSolicitudes(await resSolicitudes.json());
      if (resClientes.ok) setClientes(await resClientes.json());

    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE FILTRADO ---
  const filteredSolicitudes = solicitudes.filter(s => {
    const matchesSearch = s.Cliente?.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesEstado = filtroEstado === "todos" || s.Estado.toLowerCase() === filtroEstado.toLowerCase();
    return matchesSearch && matchesEstado;
  })

  // --- ESTADÍSTICAS ---
  const stats = {
    pendientes: solicitudes.filter(s => s.Estado.toLowerCase() === "pendiente").length,
    aprobadas: solicitudes.filter(s => s.Estado.toLowerCase() === "aprobada").length,
    rechazadas: solicitudes.filter(s => s.Estado.toLowerCase() === "rechazada").length,
  }

  // --- HANDLERS DEL FORMULARIO ---
  const handleNew = () => {
    setEditingSolicitud(null)
    setFormData({
      ...initialFormState,
      FechaDeseada: new Date().toISOString().split('T')[0] 
    })
    setIsFormOpen(true)
  }

  const handleEdit = (solicitud: Solicitud) => {
    setEditingSolicitud(solicitud)
    setFormData({
      IdCliente: solicitud.IdCliente.toString(),
      MontoSolicitado: solicitud.MontoSolicitado.toString(),
      FechaDeseada: solicitud.FechaDeseada.split('T')[0], 
      Estado: solicitud.Estado,
      Notas: solicitud.Notas || ""
    })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        IdCliente: parseInt(formData.IdCliente),
        MontoSolicitado: parseFloat(formData.MontoSolicitado),
        FechaDeseada: new Date(formData.FechaDeseada).toISOString(),
        Estado: formData.Estado,
        Notas: formData.Notas || null,
        FechaCreacion: new Date().toISOString() 
      }

      // 🚨 CORRECCIÓN: Rutas actualizadas a /api/solicitudesprestamo
      const url = editingSolicitud 
        ? `${API_BASE_URL}/api/solicitudesprestamo/${editingSolicitud.IdSolicitud}`
        : `${API_BASE_URL}/api/solicitudesprestamo`;
      
      const method = editingSolicitud ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      await fetchData() 
      setIsFormOpen(false)
      alert(`Solicitud ${editingSolicitud ? 'actualizada' : 'creada'} exitosamente`)

    } catch (error: any) {
      console.error('Error guardando solicitud:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!solicitudToDelete) return
    try {
      // 🚨 CORRECCIÓN: Ruta actualizada a /api/solicitudesprestamo
      const response = await fetchWithAuth(`${API_BASE_URL}/api/solicitudesprestamo/${solicitudToDelete}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      await fetchData()
      alert('Solicitud eliminada exitosamente')
    } catch (error) {
      alert('Error al eliminar solicitud')
    } finally {
      setDeleteDialogOpen(false)
      setSolicitudToDelete(null)
    }
  }

  const handleQuickCreatePrestamo = (solicitud: Solicitud) => {
    console.log("Convertir a Préstamo la solicitud:", solicitud);
    alert(`¡Próximo paso! Abriremos el modal de préstamo precargado con: \nCliente: ${solicitud.Cliente?.Nombre}\nMonto: ${formatMoney(solicitud.MontoSolicitado)}`);
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando solicitudes...</div>

  return (
    <div className="space-y-6">
      
      {/* 1. ESTADÍSTICAS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprobadas}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazadas}</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. TABLA Y FILTROS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Solicitudes de Préstamo</CardTitle>
              <CardDescription>Gestiona las peticiones de crédito de tus clientes</CardDescription>
            </div>
            <Button onClick={handleNew} className="bg-[#213685] hover:bg-[#213685]/90">
              <Plus className="h-4 w-4 mr-2" /> Nueva Solicitud
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-[180px] bg-white">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos los Estados</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="aprobada">Aprobadas</SelectItem>
                    <SelectItem value="rechazada">Rechazadas</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">FECHA SOLICITUD</TableHead>
                  <TableHead className="font-bold text-slate-700">CLIENTE</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">MONTO SOLICITADO</TableHead>
                  <TableHead className="font-bold text-slate-700">FECHA DESEADA</TableHead>
                  <TableHead className="font-bold text-slate-700">ESTADO</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSolicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay solicitudes para mostrar
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSolicitudes.map((s) => (
                    <TableRow key={s.IdSolicitud} className="hover:bg-slate-50/50">
                      <TableCell className="text-slate-600">
                        {formatDate(s.FechaCreacion)}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {s.Cliente?.Nombre || "Cliente Desconocido"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#213685]">
                        {formatMoney(s.MontoSolicitado)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatDate(s.FechaDeseada)}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          s.Estado.toLowerCase() === "aprobada" ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200" : 
                          s.Estado.toLowerCase() === "rechazada" ? "bg-red-100 text-red-800 hover:bg-red-100 border-red-200" : 
                          "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
                        }>
                          {s.Estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          
                          {/* BOTÓN QUICK CREATE */}
                          {s.Estado.toLowerCase() === "aprobada" && (
                              <Button 
                                variant="default" size="sm" 
                                className="bg-[#213685] hover:bg-[#213685]/90 text-white h-8 w-8 p-0"
                                onClick={() => handleQuickCreatePrestamo(s)}
                                title="Convertir a Préstamo"
                              >
                                <Banknote className="h-4 w-4" />
                              </Button>
                          )}

                          <Button 
                            variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-300"
                            onClick={() => handleEdit(s)}
                            title="Editar Solicitud"
                          >
                            <Edit className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button 
                            variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-300 hover:bg-red-50 hover:border-red-200"
                            onClick={() => { setSolicitudToDelete(s.IdSolicitud); setDeleteDialogOpen(true); }}
                            title="Eliminar Solicitud"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* 3. DIÁLOGOS Y MODALES */}
      
      {/* Modal de Formulario (Crear/Editar) */}
      <SolicitudFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        formData={formData}
        setFormData={setFormData}
        clientes={clientes}
        isEditing={!!editingSolicitud}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Diálogo de Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Solicitud?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se borrará el registro de la solicitud.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}