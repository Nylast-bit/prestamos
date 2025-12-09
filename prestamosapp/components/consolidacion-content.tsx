"use client"

import { useState, useEffect, useCallback } from "react"  
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle } from 'lucide-react'

// --- INTERFACES (Asegúrate de que estas reflejen la salida REAL de tu API) ---
interface RegistroConsolidacion {
  IdRegistro: number
  IdConsolidacion: number // No es opcional aquí, ya que la BBDD lo devuelve
  FechaRegistro: string
  TipoRegistro: "Ingreso" | "Egreso"
  Estado: "Pendiente" | "Depositado" | "Pagado" | "Prestado"
  Descripcion: string
  Monto: number
}

// Nota: La API devuelve CapitalEntrante/Saliente de la BBDD.
interface ConsolidacionCapital {
  IdConsolidacion: number
  FechaInicio: string
  FechaFin: string
  CapitalEntrante: number
  CapitalSaliente: number
  Observaciones: string
  FechaGeneracion: string
  // La propiedad 'activa' debe ser calculada por el frontend o por un endpoint específico.
}

export function ConsolidacionContent() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ;

  // --- ESTADOS DE DATOS Y SELECCIÓN ---
  const [allConsolidaciones, setAllConsolidaciones] = useState<ConsolidacionCapital[]>([]);
  const [consolidacion, setConsolidacion] = useState<ConsolidacionCapital | null>(null); // Consolidación actualmente seleccionada
  const [registros, setRegistros] = useState<RegistroConsolidacion[]>([]);
  
  // --- ESTADOS DE UI Y FORMULARIO ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroConsolidacion | null>(null);
  const [formData, setFormData] = useState({
    FechaRegistro: "",
    TipoRegistro: "Ingreso" as "Ingreso" | "Egreso",
    Estado: "Pendiente" as "Pendiente" | "Depositado" | "Pagado" | "Prestado",
    Descripcion: "",
    Monto: ""
  });
  // --- FIN ESTADOS ---

  // --- UTILITY FUNCTIONS ---

  const formatDate = (isoString: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const formatted = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return formatted.replace(/\//g, '-');
    } catch (e) {
      return isoString; 
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
        case "Depositado": return "bg-green-600"
        case "Pendiente": return "bg-orange-600"
        case "Prestado": return "bg-[#213685]"
        case "Pagado": return "bg-blue-600"
        default: return "bg-gray-600"
      }
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === "Ingreso" ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />
  }

  // --- LÓGICA DE FETCH PRINCIPAL ---
  
  // Función para obtener los registros de una consolidación específica
  const fetchRegistros = useCallback(async (idConsolidacion: number) => {
    try {
        // Nota: Asumimos que tu API ya puede filtrar por IdConsolidacion, o que
        // la relación Consolidacion.Registros está incluida en la consulta principal.
        // Aquí usamos la ruta directa para GET all, que devuelve todos los registros.
        const resR = await fetch(`${API_BASE_URL}/api/registroconsolidacion`);
        if (!resR.ok) throw new Error("Fallo al obtener todos los registros.");
        const allData: RegistroConsolidacion[] = await resR.json();
        
        // Filtramos en el frontend si el endpoint no soporta el query param
        const filteredData = allData.filter(r => r.IdConsolidacion === idConsolidacion);

        setRegistros(filteredData);
    } catch (e: any) {
        console.error('Error fetching registros:', e);
        setError(e.message || 'Error al cargar registros.');
        setRegistros([]);
    }
  }, [API_BASE_URL]);

  // Función para cargar todas las consolidaciones
  const fetchAllConsolidaciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        // 1. Obtener TODAS las consolidaciones
        const resC = await fetch(`${API_BASE_URL}/api/consolidacioncapital`);
        if (!resC.ok) throw new Error("Fallo al obtener la lista de consolidaciones.");
        const dataC: ConsolidacionCapital[] = await resC.json();
        
        // Ordenar por FechaInicio descendente para tener la más reciente primero
        dataC.sort((a, b) => new Date(b.FechaInicio).getTime() - new Date(a.FechaInicio).getTime());

        setAllConsolidaciones(dataC);

        if (dataC.length > 0 && !consolidacion) {
            // 2. Seleccionar la más reciente (la primera después de ordenar) por defecto
            const initialConsolidacion = dataC[0];
            setConsolidacion(initialConsolidacion);
            
            // 3. Cargar los registros para esa consolidación
            await fetchRegistros(initialConsolidacion.IdConsolidacion);
        }

    } catch (e: any) {
        console.error('Error fetching all data:', e);
        setError(e.message || 'Error de conexión con la API.');
    } finally {
        setLoading(false);
    }
  }, [API_BASE_URL, fetchRegistros, consolidacion]);

  // --- EFECTOS ---
  
  // Carga inicial
  useEffect(() => {
    fetchAllConsolidaciones();
  }, [fetchAllConsolidaciones]);

  // Efecto para cambiar los registros cuando se selecciona una nueva consolidación
  const handleConsolidacionChange = (idString: string) => {
    const id = parseInt(idString);
    const newConsolidacion = allConsolidaciones.find(c => c.IdConsolidacion === id);
    if (newConsolidacion) {
        setConsolidacion(newConsolidacion);
        fetchRegistros(id);
    }
  };


  // --- LÓGICA DE CÁLCULO Y FORMULARIO ---

  const ingresosTotales = registros.filter(r => r.TipoRegistro === "Ingreso").reduce((sum, r) => sum + r.Monto, 0)
  const gastosTotales = registros.filter(r => r.TipoRegistro === "Egreso").reduce((sum, r) => sum + r.Monto, 0)
  const balanceNeto = ingresosTotales - gastosTotales

  const totalesPorEstado = {
    Depositado: registros.filter(r => r.Estado === "Depositado").reduce((sum, r) => sum + r.Monto, 0),
    Pendiente: registros.filter(r => r.Estado === "Pendiente").reduce((sum, r) => sum + r.Monto, 0),
    Prestado: registros.filter(r => r.Estado === "Prestado").reduce((sum, r) => sum + r.Monto, 0),
    Pagado: registros.filter(r => r.Estado === "Pagado").reduce((sum, r) => sum + r.Monto, 0)
  }
  
  const filteredRegistros = registros.filter(registro =>
    registro.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registro.Estado.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const resetForm = () => {
    setFormData({
      FechaRegistro: "",
      TipoRegistro: "Ingreso",
      Estado: "Pendiente",
      Descripcion: "",
      Monto: ""
    })
    setEditingRegistro(null)
    setIsDialogOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!consolidacion) return alert("Debe haber una consolidación seleccionada para registrar.")

    const dataToSend = {
      ...formData,
      Monto: parseFloat(formData.Monto),
      // IdConsolidacion ya no es necesario aquí gracias a la lógica del servicio
      // Pero si se llama al servicio directamente sin IdConsolidacion, la validación fallaría.
      // Ya que el servicio espera que Zod lo haga opcional, NO lo enviamos.
      
      // FechaRegistro debe ir en formato YYYY-MM-DD
      FechaRegistro: formData.FechaRegistro 
    }
    
    try {
      const url = editingRegistro 
        ? `${API_BASE_URL}/api/registroconsolidacion/${editingRegistro.IdRegistro}`
        : `${API_BASE_URL}/api/registroconsolidacion`;

      const method = editingRegistro ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error del servidor:', errorData)
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      // Si la operación fue exitosa, recargamos los registros
      await fetchRegistros(consolidacion.IdConsolidacion); 
      // Y recargamos todas las consolidaciones para actualizar los totales CapitalEntrante/Saliente
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
      FechaRegistro: registro.FechaRegistro.split('T')[0], // Formatear para input type="date"
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
        const url = `${API_BASE_URL}/api/registroconsolidacion/${id}`;
        const response = await fetch(url, { method: 'DELETE' });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Fallo al eliminar' }));
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        // Recargar datos después de la eliminación
        await fetchRegistros(consolidacion.IdConsolidacion);
        await fetchAllConsolidaciones();
        alert("Registro eliminado exitosamente.");

    } catch (e: any) {
        alert(`Fallo al eliminar: ${e.message}`);
    }
  }
  
  // --- ESTADOS DE CARGA Y ERROR EN HTML ---
  if (loading) {
    return <Card><CardContent className="p-6 text-center">Cargando todas las consolidaciones...</CardContent></Card>
  }

  if (error || allConsolidaciones.length === 0 || !consolidacion) {
    return <Card><CardContent className="p-6 text-center text-red-600">
        {error ? `Error de API: ${error}` : "No hay consolidaciones disponibles. Por favor, crea una en el backend."}
    </CardContent></Card>
  }

  return (
    <div className="space-y-6">
      {/* Header con información de la consolidación */}
      
      <Card className="border-l-4 border-l-[#213685]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#213685]" />
                Consolidación de Capital
              </CardTitle>
              {/* SELECTOR DE CONSOLIDACIÓN */}
              <Select 
                value={consolidacion.IdConsolidacion.toString()} 
                onValueChange={handleConsolidacionChange}
              >
                <SelectTrigger className="w-[300px] mt-1">
                  <SelectValue placeholder="Seleccionar Período" />
                </SelectTrigger>
                <SelectContent>
                  {allConsolidaciones.map(c => (
                    <SelectItem key={c.IdConsolidacion} value={c.IdConsolidacion.toString()}>
                      {formatDate(c.FechaInicio)} al {formatDate(c.FechaFin)} (ID: {c.IdConsolidacion})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* FIN SELECTOR */}
            </div>
            <Badge className="bg-[#213685] text-white">
              Seleccionada
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">RD${consolidacion.CapitalEntrante.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Capital Entrante </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">-RD${consolidacion.CapitalSaliente.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Capital Saliente </div>
            </div>
            <div className="text-center p-4 bg-[#213685]/10 rounded-lg">
              <div className={`text-2xl font-bold ${balanceNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                RD${balanceNeto.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Balance Neto</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{registros.length}</div>
              <div className="text-sm text-muted-foreground">Total Registros</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen por estados */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depositado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">RD${totalesPorEstado.Depositado.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pend. por Depositar</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">RD${totalesPorEstado.Pendiente.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#213685]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prestado</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#213685]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#213685]">RD${totalesPorEstado.Prestado.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado/Gastado</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">RD${totalesPorEstado.Pagado.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registros de Consolidación</CardTitle>
              <CardDescription>
                Gestiona todos los ingresos y egresos del período actual
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#213685] hover:bg-[#213685]/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRegistro ? "Editar Registro" : "Nuevo Registro"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRegistro 
                      ? "Actualiza la información del registro" 
                      : "Completa los datos para crear un nuevo registro"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fecha">Fecha</Label>
                        <Input
                          id="fecha"
                          type="date"
                          value={formData.FechaRegistro}
                          onChange={(e) => setFormData({...formData, FechaRegistro: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select value={formData.TipoRegistro} onValueChange={(value: "Ingreso" | "Egreso") => setFormData({...formData, TipoRegistro: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                        <Input
                          id="monto"
                          type="number"
                          step="0.01"
                          value={formData.Monto}
                          onChange={(e) => setFormData({...formData, Monto: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select value={formData.Estado} onValueChange={(value: "Pendiente" | "Depositado" | "Pagado" | "Prestado") => setFormData({...formData, Estado: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                      <Textarea
                        id="descripcion"
                        value={formData.Descripcion}
                        onChange={(e) => setFormData({...formData, Descripcion: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90">
                      {editingRegistro ? "Actualizar" : "Crear"} Registro
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
              placeholder="Buscar por concepto o estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold">INGRESOS</TableHead>
                  <TableHead className="font-bold">EGRESOS</TableHead>
                  <TableHead className="font-bold">FECHA</TableHead>
                  <TableHead className="font-bold">CONCEPTO</TableHead>
                  <TableHead className="font-bold">TOTAL</TableHead>
                  <TableHead className="font-bold">ESTADO</TableHead>
                  <TableHead className="text-right font-bold">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.IdRegistro}>
                    <TableCell>
                      {registro.TipoRegistro === "Ingreso" && (
                        <div className="flex items-center gap-2">
                          {getTipoIcon(registro.TipoRegistro)}
                          <span className="font-medium text-green-600">
                            RD${registro.Monto.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {registro.TipoRegistro === "Egreso" && (
                        <div className="flex items-center gap-2">
                          {getTipoIcon(registro.TipoRegistro)}
                          <span className="font-medium text-red-600">
                            RD${registro.Monto.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(registro.FechaRegistro)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <span className="text-sm">{registro.Descripcion}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${registro.TipoRegistro === "Ingreso" ? "text-green-600" : "text-red-600"}`}>
                        RD${registro.Monto.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="default"
                        className={getEstadoBadgeColor(registro.Estado)}
                      >
                        {registro.Estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(registro)}
                          className="hover:bg-[#213685]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(registro.IdRegistro)}
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

          {/* Observaciones */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">OBSERVACIONES</h4>
            <p className="text-sm text-muted-foreground mb-2">{consolidacion.Observaciones}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">INGRESOS TOTALES: </span>
                <span className="text-green-600">RD${ingresosTotales.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">GASTOS TOTALES: </span>
                <span className="text-red-600">-RD${gastosTotales.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium">BALANCE: </span>
                <span className={`font-bold ${balanceNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  RD${balanceNeto.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}