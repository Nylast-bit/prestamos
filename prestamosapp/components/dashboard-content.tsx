"use client"

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Calendar, AlertTriangle, Users, CreditCard, PiggyBank, FileText, Clock, CheckCircle, LayoutDashboard, Filter } from 'lucide-react'
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { DashboardResumen } from "@/components/dashboard/DashboardResumen"
import { DashboardConsolidacion } from "@/components/dashboard/DashboardConsolidacion"
import { DashboardAcciones } from "@/components/dashboard/DashboardAcciones"
import { DashboardProximosVencer } from "@/components/dashboard/DashboardProximosVencer"
import { DashboardCobrosFrecuencia } from "@/components/dashboard/DashboardCobrosFrecuencia"
import { DashboardSolicitudes } from "@/components/dashboard/DashboardSolicitudes"
import { ProyeccionesCard } from "@/components/prestamos/ProyeccionMesesCard"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface DashboardContentProps {
  onNavigate: (section: string) => void;
}

export function DashboardContent({ onNavigate }: DashboardContentProps) {
  // 1. Estados para la Base de Datos
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [prestatarios, setPrestatarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resumenConsolidacion, setResumenConsolidacion] = useState({ ingresos: 0, egresos: 0, fechaInicio: '', fechaFin: '' })
  const [filtroPrestatario, setFiltroPrestatario] = useState("todos")
  const [solicitudes, setSolicitudes] = useState<any[]>([])

  // 2. Fetch de datos reales
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resPrestamos, resClientes, resPrestatarios, resConsolidacion] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/prestamos`),
          fetchWithAuth(`${API_BASE_URL}/api/clientes`),
          fetchWithAuth(`${API_BASE_URL}/api/prestatarios`),
          fetchWithAuth(`${API_BASE_URL}/api/consolidacioncapital/activa`),
        ]);

        if (resPrestamos.ok) setPrestamos(await resPrestamos.json());
        if (resClientes.ok) setClientes(await resClientes.json());
        if (resPrestatarios.ok) setPrestatarios(await resPrestatarios.json());

        if (resConsolidacion.ok) {
          const consData = await resConsolidacion.json();
          setResumenConsolidacion({
            ingresos: consData.ingresosTotal || 0,
            egresos: consData.egresosTotal || 0,
            fechaInicio: consData.FechaInicio,
            fechaFin: consData.FechaFin
          });
        }

        // Solicitudes se cargan con delay para evitar rate limiting (429)
        try {
          const resSolicitudes = await fetchWithAuth(`${API_BASE_URL}/api/solicitudesprestamo`);
          if (resSolicitudes.ok) {
            setSolicitudes(await resSolicitudes.json());
          }
        } catch { /* solicitudes no son críticas */ }

      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 3. Filtrar por prestatario si es necesario
  const prestamosFiltrados = prestamos.filter(p =>
    filtroPrestatario === "todos" || p.IdPrestatario.toString() === filtroPrestatario
  );

  const prestamosActivos = prestamosFiltrados.filter(p => p.Estado === "Activo" || p.Estado === "En Mora");
  const prestamosEnMora = prestamosFiltrados.filter(p => p.Estado === "En Mora");
  const prestamosPagados = prestamosFiltrados.filter(p => p.Estado === "Pagado");

  // 4. CÁLCULOS MATEMÁTICOS PARA LAS STAT CARDS (Suma exacta de la columna Saldo Restante)
  const getSaldoRestante = (p: any) => {
    const capRestante = p.CapitalRestante !== undefined && p.CapitalRestante !== null ? Number(p.CapitalRestante) : Number(p.MontoPrestado);
    return p.TipoCalculo === "solo_interes"
      ? (capRestante + (capRestante * (Number(p.InteresPorcentaje) / 100)))
      : (Number(p.MontoCuota) * Number(p.CuotasRestantes || 0));
  };

  const capitalEnCalle = prestamosActivos.reduce((sum, p) => sum + getSaldoRestante(p), 0);
  const interesEsperado = prestamosActivos.reduce((sum, p) => {
    const tipoCalc = (p.TipoCalculo || '').toLowerCase();
    const esVariable = tipoCalc.includes('amortiza') || tipoCalc.includes('solo_interes') || tipoCalc.includes('solo');
    const base = esVariable 
      ? (p.CapitalRestante !== undefined && p.CapitalRestante !== null ? Number(p.CapitalRestante) : Number(p.MontoPrestado))
      : Number(p.MontoPrestado);
    return sum + (base * (Number(p.InteresPorcentaje) / 100));
  }, 0);
  const totalCuotasActivas = prestamosActivos.reduce((sum, p) => sum + Number(p.MontoCuota), 0);
  const dineroEnMora = prestamosEnMora.reduce((sum, p) => sum + getSaldoRestante(p), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-border border-t-[#213685] animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de prestatario */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#213685] to-[#3a5bc7] shadow-lg shadow-[#213685]/20">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {filtroPrestatario === "todos"
                ? "Dashboard General"
                : `${prestatarios.find(p => p.IdPrestatario.toString() === filtroPrestatario)?.Nombre || ''}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filtroPrestatario === "todos"
                ? "Resumen completo de operaciones"
                : "Resumen del prestatario seleccionado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filtroPrestatario} onValueChange={setFiltroPrestatario}>
            <SelectTrigger className="w-[220px] border-border bg-background shadow-sm focus:ring-[#213685] text-sm">
              <SelectValue placeholder="Seleccionar prestatario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los prestatarios</SelectItem>
              {prestatarios.map((p) => (
                <SelectItem key={p.IdPrestatario} value={p.IdPrestatario.toString()}>
                  {p.Nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Métricas principales */}
      <DashboardStats
        capitalEnCalle={capitalEnCalle}
        interesEsperado={interesEsperado}
        pagosQuincenales={totalCuotasActivas}
        pagosPendientes={dineroEnMora}
      />

      {/* Radar de cobros + Proyecciones */}
      <div className="grid gap-5 md:grid-cols-2 items-start">
        <DashboardProximosVencer prestamos={prestamosFiltrados} />
        <ProyeccionesCard prestamos={prestamosFiltrados} />
      </div>

      {/* Resumen + Cobros por frecuencia */}
      <div className="grid gap-5 md:grid-cols-2 items-start">
        <DashboardResumen
          prestamosActivos={prestamosActivos.length}
          clientesTotales={filtroPrestatario === "todos"
            ? clientes.length
            : new Set(prestamosFiltrados.map(p => p.IdCliente)).size}
          prestatariosTotales={filtroPrestatario === "todos" ? prestatarios.length : 1}
        />
        <DashboardCobrosFrecuencia prestamos={prestamosFiltrados} />
      </div>

      {/* Solicitudes + Consolidación */}
      <div className="grid gap-5 md:grid-cols-2">
        <DashboardSolicitudes
          solicitudes={solicitudes}
          onNavigate={onNavigate}
        />
        <DashboardConsolidacion
          ingresos={resumenConsolidacion.ingresos}
          egresos={resumenConsolidacion.egresos}
          fechaInicio={resumenConsolidacion.fechaInicio}
          fechaFin={resumenConsolidacion.fechaFin}
          onNavigate={onNavigate}
        />
      </div>

      {/* Acciones rápidas */}
      <DashboardAcciones onNavigate={onNavigate} />
    </div>
  )
}
