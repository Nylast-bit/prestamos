"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect, useCallback } from "react"  
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search } from 'lucide-react'

// 👇 NUESTROS COMPONENTES SEGMENTADOS
import { ConsolidacionStats } from "@/components/consolidacion/ConsolidacionStats"
import { ConsolidacionTable } from "@/components/consolidacion/ConsolidacionTable"

// --- INTERFACES ---

export interface RegistroConsolidacion {
  IdRegistro: number;
  IdConsolidacion: number; 
  FechaRegistro: string;
  TipoRegistro: "Ingreso" | "Egreso";
  Estado: "Pendiente" | "Depositado" | "Pagado" | "Prestado";
  Descripcion: string;
  Monto: number;
}

interface ConsolidacionCapital {
  IdConsolidacion: number
  FechaInicio: string
  FechaFin: string
  CapitalEntrante: number
  CapitalSaliente: number
  Observaciones: string
  FechaGeneracion: string
}

const getTodayLocal = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
}

export function ConsolidacionContent() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ;

  // --- ESTADOS ---
  const [allConsolidaciones, setAllConsolidaciones] = useState<ConsolidacionCapital[]>([]);
  const [consolidacion, setConsolidacion] = useState<ConsolidacionCapital | null>(null);
  const [registros, setRegistros] = useState<RegistroConsolidacion[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // 👇 NUEVO ESTADO PARA EL FILTRO DE ESTADO
  
  // Estados Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroConsolidacion | null>(null);
  const [formData, setFormData] = useState({
    FechaRegistro: getTodayLocal(),
    TipoRegistro: "Ingreso" as "Ingreso" | "Egreso",
    Estado: "Pendiente" as "Pendiente" | "Depositado" | "Pagado" | "Prestado",
    Descripcion: "",
    Monto: ""
  });

  // --- UTILS ---
  const formatDate = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    } catch (e) {
      return isoString; 
    }
  };

  // --- FETCH LOGIC ---
  const fetchRegistros = useCallback(async (idConsolidacion: number) => {
    try {
        const resR = await fetchWithAuth(`${API_BASE_URL}/api/registroconsolidacion`);
        if (!resR.ok) throw new Error("Fallo al obtener todos los registros.");
        const allData: RegistroConsolidacion[] = await resR.json();
        const filteredData = allData.filter(r => r.IdConsolidacion === idConsolidacion);
        setRegistros(filteredData);
    } catch (e: any) {
        console.error('Error fetching registros:', e);
        setError(e.message || 'Error al cargar registros.');
        setRegistros([]);
    }
  }, [API_BASE_URL]);

  const fetchAllConsolidaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const resC = await fetchWithAuth(`${API_BASE_URL}/api/consolidacioncapital`);
        if (!resC.ok) throw new Error("Fallo al obtener la lista de consolidaciones.");
        const dataC: ConsolidacionCapital[] = await resC.json();
        
        dataC.sort((a, b) => new Date(b.FechaInicio).getTime() - new Date(a.FechaInicio).getTime());
        setAllConsolidaciones(dataC);

        if (dataC.length > 0 && !consolidacion) {
            const initialConsolidacion = dataC[0];
            setConsolidacion(initialConsolidacion);
            await fetchRegistros(initialConsolidacion.IdConsolidacion);
        }
    } catch (e: any) {
        console.error('Error fetching all data:', e);
        setError(e.message || 'Error de conexión con la API.');
    } finally {
        setLoading(false);
    }
  }, [API_BASE_URL, fetchRegistros, consolidacion]);

  useEffect(() => {
    fetchAllConsolidaciones();
  }, [fetchAllConsolidaciones]);

  const handleConsolidacionChange = (idString: string) => {
    const id = parseInt(idString);
    const newConsolidacion = allConsolidaciones.find(c => c.IdConsolidacion === id);
    if (newConsolidacion) {
        setConsolidacion(newConsolidacion);
        fetchRegistros(id);
    }
  };

  // --- CÁLCULOS ---
  const ingresosTotales = registros.filter(r => r.TipoRegistro === "Ingreso").reduce((sum, r) => sum + r.Monto, 0)
  const gastosTotales = registros.filter(r => r.TipoRegistro === "Egreso").reduce((sum, r) => sum + r.Monto, 0)
  const balanceNeto = ingresosTotales - gastosTotales

  const totalesPorEstado = {
    Depositado: registros.filter(r => r.Estado === "Depositado").reduce((sum, r) => sum + r.Monto, 0),
    Pendiente: registros.filter(r => r.Estado === "Pendiente").reduce((sum, r) => sum + r.Monto, 0),
    Prestado: registros.filter(r => r.Estado === "Prestado").reduce((sum, r) => sum + r.Monto, 0),
    Pagado: registros.filter(r => r.Estado === "Pagado").reduce((sum, r) => sum + r.Monto, 0)
  }
  
  // 👇 NUEVA LÓGICA DE FILTRADO
  const filteredRegistros = registros.filter(registro => {
    const matchesSearch = registro.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          registro.Estado.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === "todos" || registro.Estado.toLowerCase() === filtroEstado.toLowerCase();
    
    return matchesSearch && matchesEstado;
  })

  // --- HANDLERS ---
  const resetForm = () => {
    setFormData({ FechaRegistro: getTodayLocal(), TipoRegistro: "Ingreso", Estado: "Pendiente", Descripcion: "", Monto: "" })
    setEditingRegistro(null)
    setIsDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consolidacion) return alert("Debe haber una consolidación seleccionada para registrar.")

    const dataToSend = {
      ...formData,
      Monto: parseFloat(formData.Monto),
      FechaRegistro: `${formData.FechaRegistro}T12:00:00.000Z`,
    }
    
    try {
      const url = editingRegistro ? `${API_BASE_URL}/api/registroconsolidacion/${editingRegistro.IdRegistro}` : `${API_BASE_URL}/api/registroconsolidacion`;
      const method = editingRegistro ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      
      await fetchRegistros(consolidacion.IdConsolidacion); 
      await fetchAllConsolidaciones(); 
      alert(`Registro ${editingRegistro ? "actualizado" : "creado"} exitosamente`)
      resetForm()

    } catch (e: any) {
      alert(`Fallo la operación: ${e.message}`)
    }
  }

  const handleEdit = (registro: RegistroConsolidacion) => {
    setEditingRegistro(registro)
    setFormData({
      FechaRegistro: registro.FechaRegistro.split('T')[0],
      TipoRegistro: registro.TipoRegistro,
      Estado: registro.Estado,
      Descripcion: registro.Descripcion,
      Monto: registro.Monto.toString()
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!consolidacion) return;
    if (!confirm("¿Está seguro de que desea eliminar este registro?")) return;
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/registroconsolidacion/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        await fetchRegistros(consolidacion.IdConsolidacion);
        await fetchAllConsolidaciones();
        alert("Registro eliminado exitosamente.");
    } catch (e: any) {
        alert(`Fallo al eliminar: ${e.message}`);
    }
  }
  
  if (loading) return <Card><CardContent className="p-6 text-center">Cargando consolidaciones...</CardContent></Card>
  if (error || allConsolidaciones.length === 0 || !consolidacion) {
    return <Card><CardContent className="p-6 text-center text-red-600">{error ? `Error de API: ${error}` : "No hay consolidaciones disponibles."}</CardContent></Card>
  }

  return (
    <div className="space-y-6">
      
      {/* 🌟 1. TARJETAS SUPERIORES */}
      <ConsolidacionStats 
        consolidacion={consolidacion}
        allConsolidaciones={allConsolidaciones}
        balanceNeto={balanceNeto}
        totalRegistros={registros.length}
        totalesPorEstado={totalesPorEstado}
        onConsolidacionChange={handleConsolidacionChange}
        formatDate={formatDate}
      />

      {/* 🌟 2. ZONA DE TABLA Y MODAL */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registros de Consolidación</CardTitle>
              <CardDescription>Gestiona todos los ingresos y egresos del período actual</CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90">
                  <Plus className="h-4 w-4 mr-2" /> Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingRegistro ? "Editar Registro" : "Nuevo Registro"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fecha">Fecha</Label>
                        <Input id="fecha" type="date" value={formData.FechaRegistro} onChange={(e) => setFormData({...formData, FechaRegistro: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select value={formData.TipoRegistro} onValueChange={(value: "Ingreso" | "Egreso") => setFormData({...formData, TipoRegistro: value})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ingreso">Ingreso</SelectItem>
                            <SelectItem value="Egreso">Egreso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="monto">Monto</Label>
                        <Input id="monto" type="number" step="0.01" value={formData.Monto} onChange={(e) => setFormData({...formData, Monto: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select value={formData.Estado} onValueChange={(value: "Pendiente" | "Depositado" | "Pagado" | "Prestado") => setFormData({...formData, Estado: value})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pendiente">Pendiente</SelectItem>
                            <SelectItem value="Depositado">Depositado</SelectItem>
                            <SelectItem value="Pagado">Pagado</SelectItem>
                            <SelectItem value="Prestado">Prestado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Concepto/Descripción</Label>
                      <Textarea id="descripcion" value={formData.Descripcion} onChange={(e) => setFormData({...formData, Descripcion: e.target.value})} required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                    <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90">{editingRegistro ? "Actualizar" : "Crear"} Registro</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* 👇 NUEVA BARRA DE FILTROS COMBINADA */}
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por concepto o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full md:w-[200px] bg-white">
                <SelectValue placeholder="Filtrar por Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los Estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="depositado">Depositado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="prestado">Prestado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ConsolidacionTable 
             registros={filteredRegistros} 
             onEdit={handleEdit} 
             onDelete={handleDelete} 
             formatDate={formatDate} 
          />
          
          {/* OBSERVACIONES */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">OBSERVACIONES</h4>
            <p className="text-sm text-muted-foreground mb-2">{consolidacion.Observaciones || 'Sin observaciones registradas.'}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="font-medium">INGRESOS TOTALES: </span><span className="text-green-600">RD${ingresosTotales.toLocaleString()}</span></div>
              <div><span className="font-medium">GASTOS TOTALES: </span><span className="text-red-600">-RD${gastosTotales.toLocaleString()}</span></div>
              <div><span className="font-medium">BALANCE: </span><span className={`font-bold ${balanceNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>RD${balanceNeto.toLocaleString()}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}