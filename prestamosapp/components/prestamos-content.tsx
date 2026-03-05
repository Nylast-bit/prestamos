"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, FilterX } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// 🚨 IMPORTANTE: Asegúrate de que las rutas coincidan con donde creaste tus archivos
import { PrestamoStats } from "@/components/prestamos/PrestamoStats"
import { PrestamoTable } from "@/components/prestamos/PrestamoTable"
import { PrestamoFormDialog } from "@/components/prestamos/PrestamoFormDialog"
import { PrestamoSimulationDialog } from "@/components/prestamos/PrestamoSimulationDialog"

// --- INTERFACES ---
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
  const [clientes, setClientes] = useState<any[]>([])
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [simulando, setSimulando] = useState(false)
  
  // 🔍 ESTADOS DE FILTROS
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroPrestatario, setFiltroPrestatario] = useState("todos")
  const [filtroModalidad, setFiltroModalidad] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("Activo") // Por defecto mostramos solo activos
  
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
    ModalidadPago: "mensual",
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

  // --- 🧠 LÓGICA DE FILTRADO ---
  const filteredPrestamos = prestamos.filter(p => {
    // 1. Búsqueda por texto (Cliente o Responsable)
    const matchesSearch = 
      p.clienteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prestatarioNombre?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtro por Prestatario
    const matchesPrestatario = filtroPrestatario === "todos" || p.IdPrestatario.toString() === filtroPrestatario;

    // 3. Filtro por Modalidad
    const matchesModalidad = filtroModalidad === "todos" || p.ModalidadPago.toLowerCase() === filtroModalidad;

    // 4. Filtro por Estado
    const matchesEstado = filtroEstado === "todos" || p.Estado === filtroEstado;

    return matchesSearch && matchesPrestatario && matchesModalidad && matchesEstado;
  })

  const limpiarFiltros = () => {
      setSearchTerm("");
      setFiltroPrestatario("todos");
      setFiltroModalidad("todos");
      setFiltroEstado("Activo");
  }

  // --- ESTADÍSTICAS ---
  const stats = {
    activos: prestamos.filter(p => p.Estado === "Activo").length,
    restanteAPagar: prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + (Number(p.MontoCuota) * Number(p.CuotasRestantes)), 0),
    interes: prestamos.filter(p => p.Estado === "Activo").reduce((sum, p) => sum + (Number(p.MontoPrestado) * (Number(p.InteresPorcentaje) / 100)), 0),
    mora: prestamos.filter(p => p.Estado === "En Mora").length
  }

  // --- HANDLERS (Simulación, Submit, Delete, Edit) ---
  const handleSimular = async () => {
    console.log("🚀 1. INICIANDO handleSimular EN EL PADRE");
    console.log("📋 2. Datos del formulario:", formData);

    if (!formData.MontoPrestado || !formData.InteresPorcentaje || !formData.CantidadCuotas) {
      console.error("❌ 3. VALIDACIÓN FALLÓ: Faltan campos numéricos");
      alert('Por favor completa: Monto, Tasa de Interés y Cantidad de Cuotas.');
      return;
    }

    setSimulando(true);
    
    try {
      console.log("📡 4. Enviando petición al Backend...");
      const url = `${API_BASE_URL}/api/prestamos/simular`;
      
      const payload = {
          monto: parseFloat(formData.MontoPrestado),
          tasaInteres: parseFloat(formData.InteresPorcentaje),
          numeroCuotas: parseInt(formData.CantidadCuotas),
          tipoCalculo: formData.TipoCalculo
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
         throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📥 5. Datos recibidos del Backend:", data);
      
      if (data.success) {
        console.log("✅ 6. Éxito. Guardando datos en estado...");
        setSimulacionResumen({ ...data, ModalidadPago: formData.ModalidadPago });
        setSimulacionCuotas(data.tablaAmortizacion);
        
        console.log("🔓 7. INTENTANDO ABRIR EL DIALOG (setIsSimOpen -> true)");
        setIsSimOpen(true);
      } else {
        console.error("❌ Error lógico del backend:", data.error);
        alert(data.error || 'Error en la simulación');
      }

    } catch (error: any) {
      console.error("💥 8. EXCEPCIÓN (CATCH):", error);
      alert(`Error técnico: ${error.message}`);
    } finally {
      console.log("🏁 9. Finalizando proceso (setSimulando -> false)");
      setSimulando(false);
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!editingPrestamo && (!simulacionResumen || simulacionCuotas.length === 0)) {
        alert("Por favor, realiza y confirma la simulación del préstamo antes de crearlo.");
        return;
    }

    setSubmitting(true)
    try {
      let prestamoData: any = {
        IdCliente: parseInt(formData.IdCliente),
        IdPrestatario: parseInt(formData.IdPrestatario),
        MontoPrestado: parseFloat(formData.MontoPrestado),
        TipoCalculo: formData.TipoCalculo,
        InteresPorcentaje: parseFloat(formData.InteresPorcentaje),
        CantidadCuotas: parseInt(formData.CantidadCuotas),
        ModalidadPago: formData.ModalidadPago.toLowerCase(), 
        FechaInicio: new Date(formData.FechaInicio).toISOString(),
        FechaFinEstimada: new Date(formData.FechaFinEstimada).toISOString(),
        Observaciones: formData.Observaciones || null,
        Estado: "Activo"
      }

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
        restanteAPagar={stats.restanteAPagar}
        interes={stats.interes}
        mora={stats.mora}
      />

      {/* 2. Tabla Principal y Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          
          {/* 🎛️ BARRA DE FILTROS AVANZADA */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex flex-col md:flex-row gap-3 items-center">
            
            {/* Buscador de Texto */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {/* Filtro: Prestatario (Responsable) */}
            <Select value={filtroPrestatario} onValueChange={setFiltroPrestatario}>
                <SelectTrigger className="w-full md:w-[180px] bg-white">
                    <SelectValue placeholder="Responsable" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos los Resp.</SelectItem>
                    {prestatarios.map((pres: any) => (
                        <SelectItem key={pres.IdPrestatario} value={pres.IdPrestatario.toString()}>
                            {pres.Nombre}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Filtro: Modalidad de Pago */}
            <Select value={filtroModalidad} onValueChange={setFiltroModalidad}>
                <SelectTrigger className="w-full md:w-[160px] bg-white">
                    <SelectValue placeholder="Modalidad" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Frecuencia (Todas)</SelectItem>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
            </Select>

            {/* Filtro: Estado */}
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-[160px] bg-white">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos los Estados</SelectItem>
                    <SelectItem value="Activo">Solo Activos</SelectItem>
                    <SelectItem value="Pagado">Completados</SelectItem>
                    <SelectItem value="En Mora">En Mora</SelectItem>
                </SelectContent>
            </Select>

            {/* Botón Limpiar Filtros */}
            {(searchTerm || filtroPrestatario !== "todos" || filtroModalidad !== "todos" || filtroEstado !== "Activo") && (
                <Button variant="ghost" size="icon" onClick={limpiarFiltros} title="Limpiar Filtros" className="text-slate-500 hover:text-red-500">
                    <FilterX className="h-5 w-5" />
                </Button>
            )}
          </div>
          
          <PrestamoTable 
            prestamos={filteredPrestamos}
            onEdit={handleEdit}
            onDelete={(id: number) => { setPrestamoToDelete(id); setDeleteDialogOpen(true); }}
            onPaymentSuccess={fetchData} 
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
        onConfirm={() => handleSubmit()} 
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