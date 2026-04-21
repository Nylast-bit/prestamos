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
import { DollarSign, TrendingUp, Calendar, AlertTriangle, Users, CreditCard, PiggyBank, FileText, Clock, CheckCircle, ImportIcon } from 'lucide-react'
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
      setLoading(true); // Aseguramos que muestre cargando mientras busca
      try {
        // 🚨 OJO AL ORDEN AQUÍ: Tienen que ser exactamente 5 peticiones
        const [resPrestamos, resClientes, resPrestatarios, resConsolidacion, resSolicitudes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/prestamos`),
          fetchWithAuth(`${API_BASE_URL}/api/clientes`),
          fetchWithAuth(`${API_BASE_URL}/api/prestatarios`),
          fetchWithAuth(`${API_BASE_URL}/api/consolidacioncapital/activa`),
          fetchWithAuth(`${API_BASE_URL}/api/solicitudesprestamo`) // <--- RUTA CORRECTA
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

        // 👇 DEBUG: Vamos a ver si esto da OK y trae tu array
        if (resSolicitudes.ok) {
          const dataSolicitudes = await resSolicitudes.json();
          console.log("📥 Solicitudes en Dashboard:", dataSolicitudes);
          setSolicitudes(dataSolicitudes);
        } else {
          console.error("❌ Falló el fetch de solicitudes. Status:", resSolicitudes.status);
        }

      } catch (error) {
        console.error("💥 Error general cargando datos del dashboard:", error);
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

  // 4. CÁLCULOS MATEMÁTICOS PARA LAS STAT CARDS
  const capitalEnCalle = prestamosActivos.reduce((sum, p) => sum + (Number(p.MontoCuota) * Number(p.CuotasRestantes)), 0);
  const interesEsperado = prestamosActivos.reduce((sum, p) => sum + (Number(p.MontoPrestado) * (Number(p.InteresPorcentaje) / 100)), 0);
  const totalCuotasActivas = prestamosActivos.reduce((sum, p) => sum + Number(p.MontoCuota), 0);
  const dineroEnMora = prestamosEnMora.reduce((sum, p) => sum + (Number(p.MontoCuota) * Number(p.CuotasRestantes)), 0);

  if (loading) return <div>Cargando dashboard...</div>;
  return (
    <div className="space-y-6">
      {/* Header con selector de prestatario */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {filtroPrestatario === "todos"
              ? "Dashboard General"
              : `Dashboard: ${prestatarios.find(p => p.IdPrestatario.toString() === filtroPrestatario)?.Nombre || ''}`}
          </h2>
          <p className="text-muted-foreground">
            {filtroPrestatario === "todos"
              ? "Resumen completo de la plataforma de préstamos"
              : "Resumen de préstamos del prestatario seleccionado"}
          </p>

        </div>
        <Select value={filtroPrestatario} onValueChange={setFiltroPrestatario}>
          <SelectTrigger className="w-[200px] border-[#213685]/20 focus:ring-[#213685]">
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

      {/* Métricas principales */}
      <DashboardStats
        capitalEnCalle={capitalEnCalle}
        interesEsperado={interesEsperado}
        pagosQuincenales={totalCuotasActivas}
        pagosPendientes={dineroEnMora}
      />

      {/* Sección de alertas y próximos vencimientos */}
      <div className="grid gap-4 md:grid-cols-2 items-start">

        <ProyeccionesCard prestamos={prestamosFiltrados} />
        <DashboardProximosVencer prestamos={prestamosFiltrados} />


        <DashboardResumen
          prestamosActivos={prestamosActivos.length}
          clientesTotales={filtroPrestatario === "todos"
            ? clientes.length
            : new Set(prestamosFiltrados.map(p => p.IdCliente)).size}
          prestatariosTotales={filtroPrestatario === "todos" ? prestatarios.length : 1}
        />

        <DashboardCobrosFrecuencia prestamos={prestamosFiltrados} />
      </div>

      {/* Solicitudes futuras y consolidación */}
      <div className="grid gap-4 md:grid-cols-2">

        {/* 🌟 NUEVO COMPONENTE DE SOLICITUDES */}
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
