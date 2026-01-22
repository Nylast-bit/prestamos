"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// 🚨 IMPORTANTE: Asegúrate de que las rutas coincidan con donde creaste tus archivos
import { PrestamoStats } from "@/components/prestamos/PrestamoStats"
import { PrestamoTable } from "@/components/prestamos/PrestamoTable"
import { PrestamoFormDialog } from "@/components/prestamos/PrestamoFormDialog"
import { PrestamoSimulationDialog } from "@/components/prestamos/PrestamoSimulationDialog"

// --- INTERFACES (Si no las moviste a un archivo types.ts compartido) ---
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
  // --- ESTADOS ---
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [clientes, setClientes] = useState([])
  const [prestatarios, setPrestatarios] = useState([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [simulando, setSimulando] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados de Diálogos
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSimOpen, setIsSimOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Datos temporales
  const [editingPrestamo, setEditingPrestamo] = useState<Prestamo | null>(null)
  const [prestamoToDelete, setPrestamoToDelete] = useState<number | null>(null)
  const [simulacionResumen, setSimulacionResumen] = useState<SimulacionResumen | null>(null)
  const [simulacionCuotas, setSimulacionCuotas] = useState<SimulacionCuota[]>([])

  // Form Data Inicial
  const initialFormState = {
    IdCliente: "",
    IdPrestatario: "",
    MontoPrestado: "",
    TipoCalculo: "capital+interes",
    InteresPorcentaje: "",
    CantidadCuotas: "",
    ModalidadPago: "mensual", // Minúscula por defecto
    FechaInicio: "",
    FechaFinEstimada: "",
    Observaciones: ""
  }
  const [formData, setFormData] = useState(initialFormState)

  // --- EFECTOS Y CARGA ---
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

      if (prestamosRes.ok) setPrestamos(await prestamosRes.json())
      if (clientesRes.ok) setClientes(await clientesRes.json())
      if (prestatariosRes.ok) setPrestatarios(await prestatariosRes.json())
      
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE FILTRADO Y ESTADÍSTICAS ---
  const filteredPrestamos = prestamos.filter(p =>
    (p.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prestatarioNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.Estado.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const stats = {
    activos: prestamos.filter(p => p.Estado === "Activo").length,
    capital: prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + Number(p.MontoPrestado), 0),
    interes: prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + Number(p.InteresMontoTotal), 0),
    mora: prestamos.filter(p => p.Estado === "En Mora").length
  }

  // --- HANDLERS (Simulación, Submit, Delete, Edit) ---

  const handleSimular = async () => {
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

      if (!response.ok) throw new Error('Error al simular préstamo')
      const data = await response.json()
      
      if (data.success) {
        setSimulacionResumen(data.resumen)
        setSimulacionCuotas(data.cuotas)
        setIsSimOpen(true) // Abrir modal de resultados
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSimulando(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // VALIDACIÓN: Si es nuevo, debe tener simulación
    if (!editingPrestamo && (!simulacionResumen || simulacionCuotas.length === 0)) {
        alert("Por favor, realiza y confirma la simulación del préstamo antes de crearlo.");
        return;
    }

    setSubmitting(true)
    try {
      // 1. Preparar Payload Base
      let prestamoData: any = {
        IdCliente: parseInt(formData.IdCliente),
        IdPrestatario: parseInt(formData.IdPrestatario),
        MontoPrestado: parseFloat(formData.MontoPrestado),
        TipoCalculo: formData.TipoCalculo,
        InteresPorcentaje: parseFloat(formData.InteresPorcentaje),
        CantidadCuotas: parseInt(formData.CantidadCuotas),
        // 🚨 FIX CRÍTICO: Convertir a minúsculas para evitar error "invalid_union"
        ModalidadPago: formData.ModalidadPago.toLowerCase(), 
        FechaInicio: new Date(formData.FechaInicio).toISOString(),
        FechaFinEstimada: new Date(formData.FechaFinEstimada).toISOString(),
        Observaciones: formData.Observaciones || null,
        Estado: "Activo"
      }

      // 2. Inyectar datos de Simulación (SOLO CREACIÓN)
      if (!editingPrestamo && simulacionResumen) {
          prestamoData = {
              ...prestamoData,
              InteresMontoTotal: simulacionResumen.montoTotalInteres,
              CapitalTotalPagar: simulacionResumen.montoTotalAPagar,
              MontoCuota: simulacionResumen.montoCuota,
              CapitalRestante: parseFloat(formData.MontoPrestado),
              CuotasRestantes: parseInt(formData.CantidadCuotas),
              TablaPagos: JSON.stringify(simulacionCuotas) 
          };
      }

      // 3. Enviar
      const url = editingPrestamo 
        ? `${API_BASE_URL}/api/prestamos/${editingPrestamo.IdPrestamo}`
        : `${API_BASE_URL}/api/prestamos`;
      
      const method = editingPrestamo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prestamoData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Error ${response.status}`)
      }
      
      await fetchData()
      alert(`Préstamo ${editingPrestamo ? 'actualizado' : 'creado'} exitosamente`)
      
      // Cerrar todo
      setIsFormOpen(false)
      setIsSimOpen(false)
      setEditingPrestamo(null)
      setFormData(initialFormState)
      setSimulacionResumen(null)
      setSimulacionCuotas([])

    } catch (error: any) {
      console.error('Error en handleSubmit:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!prestamoToDelete) return
    try {
      const response = await fetch(`${API_BASE_URL}/api/prestamos/${prestamoToDelete}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar')
      await fetchData()
      alert('Préstamo eliminado exitosamente')
    } catch (error) {
      alert('Error al eliminar préstamo')
    } finally {
      setDeleteDialogOpen(false)
      setPrestamoToDelete(null)
    }
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
    setIsFormOpen(true)
  }

  const openNewForm = () => {
      setEditingPrestamo(null)
      setFormData(initialFormState)
      setIsFormOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64">Cargando datos...</div>

  // --- RENDERIZADO ---
  return (
    <div className="space-y-6">
      {/* 1. Estadísticas */}
      <PrestamoStats 
        activos={stats.activos}
        capital={stats.capital}
        interes={stats.interes}
        mora={stats.mora}
      />

      {/* 2. Tabla Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Préstamos</CardTitle>
              <CardDescription>Administra todos los préstamos de la plataforma</CardDescription>
            </div>
            <Button onClick={openNewForm} className="bg-[#213685] hover:bg-[#213685]/90">
              <Plus className="h-4 w-4 mr-2" /> Nuevo Préstamo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <PrestamoTable 
            prestamos={filteredPrestamos}
            onEdit={handleEdit}
            onDelete={(id: number) => { setPrestamoToDelete(id); setDeleteDialogOpen(true); }}
          />
        </CardContent>
      </Card>

      {/* 3. Diálogos */}
      <PrestamoFormDialog 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        formData={formData}
        setFormData={setFormData}
        clientes={clientes}
        prestatarios={prestatarios}
        isEditing={!!editingPrestamo}
        onSimular={handleSimular}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        isSimulating={simulando}
      />

      <PrestamoSimulationDialog 
        isOpen={isSimOpen}
        onClose={() => setIsSimOpen(false)}
        onConfirm={() => handleSubmit()} // Confirmar desde el modal de simulación dispara el submit
        resumen={simulacionResumen}
        cuotas={simulacionCuotas}
        isSubmitting={submitting}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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