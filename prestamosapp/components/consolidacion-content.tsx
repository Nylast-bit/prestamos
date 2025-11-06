"use client"

import { useState } from "react"
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

interface RegistroConsolidacion {
  IdRegistro: number
  IdConsolidacion: number
  FechaRegistro: string
  TipoRegistro: "Ingreso" | "Egreso"
  Estado: "Pendiente" | "Depositado" | "Pagado" | "Prestado"
  Descripcion: string
  Monto: number
}

interface ConsolidacionCapital {
  IdConsolidacion: number
  FechaInicio: string
  FechaFin: string
  CapitalEntrante: number
  CapitalSaliente: number
  Observaciones: string
  FechaGeneracion: string
  activa: boolean
}

const consolidacionActual: ConsolidacionCapital = {
  IdConsolidacion: 1,
  FechaInicio: "2025-07-23",
  FechaFin: "2025-08-08",
  CapitalEntrante: 56904.35,
  CapitalSaliente: 48820.00,
  Observaciones: "Fechas de corte: los días 8 de cada mes y los días 23 de cada mes",
  FechaGeneracion: "2025-08-08",
  activa: true
}

const registrosIniciales: RegistroConsolidacion[] = [
  {
    IdRegistro: 1,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-24",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Capital cierre",
    Monto: 12049.35
  },
  {
    IdRegistro: 2,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-26",
    TipoRegistro: "Egreso",
    Estado: "Pagado",
    Descripcion: "Gasto",
    Monto: 202.00
  },
  {
    IdRegistro: 3,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-26",
    TipoRegistro: "Ingreso",
    Estado: "Pendiente",
    Descripcion: "Pago de Eskayrin Ramirez",
    Monto: 2800.00
  },
  {
    IdRegistro: 4,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-29",
    TipoRegistro: "Egreso",
    Estado: "Prestado",
    Descripcion: "Reenganche de Jadilson Morillo",
    Monto: 8012.00
  },
  {
    IdRegistro: 5,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-25",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Saldo de Deyanira Corniel",
    Monto: 2350.00
  },
  {
    IdRegistro: 6,
    IdConsolidacion: 1,
    FechaRegistro: "2025-08-01",
    TipoRegistro: "Ingreso",
    Estado: "Pagado",
    Descripcion: "Pago de Prestamo 800k",
    Monto: 22200.00
  },
  {
    IdRegistro: 7,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-25",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Marcos",
    Monto: 3500.00
  },
  {
    IdRegistro: 8,
    IdConsolidacion: 1,
    FechaRegistro: "2025-08-04",
    TipoRegistro: "Egreso",
    Estado: "Prestado",
    Descripcion: "Reenganche de Carlos Gil",
    Monto: 2003.00
  },
  {
    IdRegistro: 9,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-25",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Sheila",
    Monto: 500.00
  },
  {
    IdRegistro: 10,
    IdConsolidacion: 1,
    FechaRegistro: "2025-08-04",
    TipoRegistro: "Egreso",
    Estado: "Prestado",
    Descripcion: "Reenganche de Dominic",
    Monto: 14400.00
  },
  {
    IdRegistro: 11,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-28",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Carlos Gil",
    Monto: 3300.00
  },
  {
    IdRegistro: 12,
    IdConsolidacion: 1,
    FechaRegistro: "2025-08-05",
    TipoRegistro: "Egreso",
    Estado: "Prestado",
    Descripcion: "Prestamo a Luis Cuello",
    Monto: 2003.00
  },
  {
    IdRegistro: 13,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-29",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Joan Campusano",
    Monto: 500.00
  },
  {
    IdRegistro: 14,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-29",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Jadilson Morillo",
    Monto: 1750.00
  },
  {
    IdRegistro: 15,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-29",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Gustavo",
    Monto: 1000.00
  },
  {
    IdRegistro: 16,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-29",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Evelin",
    Monto: 1000.00
  },
  {
    IdRegistro: 17,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-30",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Albert",
    Monto: 700.00
  },
  {
    IdRegistro: 18,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-31",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago del King",
    Monto: 2980.00
  },
  {
    IdRegistro: 19,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-31",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Meraris",
    Monto: 1855.00
  },
  {
    IdRegistro: 20,
    IdConsolidacion: 1,
    FechaRegistro: "2025-07-31",
    TipoRegistro: "Ingreso",
    Estado: "Depositado",
    Descripcion: "Pago de Angelo",
    Monto: 3450.00
  }
]

export function ConsolidacionContent() {
  const [registros, setRegistros] = useState<RegistroConsolidacion[]>(registrosIniciales)
  const [consolidacion] = useState<ConsolidacionCapital>(consolidacionActual)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRegistro, setEditingRegistro] = useState<RegistroConsolidacion | null>(null)
  const [formData, setFormData] = useState({
    FechaRegistro: "",
    TipoRegistro: "Ingreso" as "Ingreso" | "Egreso",
    Estado: "Pendiente" as "Pendiente" | "Depositado" | "Pagado" | "Prestado",
    Descripcion: "",
    Monto: ""
  })

  const filteredRegistros = registros.filter(registro =>
    registro.Descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registro.Estado.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular totales por estado
  const totalesPorEstado = {
    Depositado: registros.filter(r => r.Estado === "Depositado").reduce((sum, r) => sum + r.Monto, 0),
    Pendiente: registros.filter(r => r.Estado === "Pendiente").reduce((sum, r) => sum + r.Monto, 0),
    Prestado: registros.filter(r => r.Estado === "Prestado").reduce((sum, r) => sum + r.Monto, 0),
    Pagado: registros.filter(r => r.Estado === "Pagado").reduce((sum, r) => sum + r.Monto, 0)
  }

  const ingresosTotales = registros.filter(r => r.TipoRegistro === "Ingreso").reduce((sum, r) => sum + r.Monto, 0)
  const gastosTotales = registros.filter(r => r.TipoRegistro === "Egreso").reduce((sum, r) => sum + r.Monto, 0)
  const balanceNeto = ingresosTotales - gastosTotales

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingRegistro) {
      setRegistros(registros.map(registro => 
        registro.IdRegistro === editingRegistro.IdRegistro 
          ? { ...registro, ...formData, Monto: parseFloat(formData.Monto) }
          : registro
      ))
    } else {
      const nuevoRegistro: RegistroConsolidacion = {
        IdRegistro: Math.max(...registros.map(r => r.IdRegistro)) + 1,
        IdConsolidacion: consolidacion.IdConsolidacion,
        ...formData,
        Monto: parseFloat(formData.Monto)
      }
      setRegistros([...registros, nuevoRegistro])
    }
    
    resetForm()
  }

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

  const handleEdit = (registro: RegistroConsolidacion) => {
    setEditingRegistro(registro)
    setFormData({
      FechaRegistro: registro.FechaRegistro,
      TipoRegistro: registro.TipoRegistro,
      Estado: registro.Estado,
      Descripcion: registro.Descripcion,
      Monto: registro.Monto.toString()
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setRegistros(registros.filter(registro => registro.IdRegistro !== id))
  }

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

  return (
    <div className="space-y-6">
      {/* Header con información de la consolidación */}
      <Card className="border-l-4 border-l-[#213685]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#213685]" />
                Consolidación de Capital - Período Activo
              </CardTitle>
              <CardDescription>
                {consolidacion.FechaInicio} al {consolidacion.FechaFin}
              </CardDescription>
            </div>
            <Badge className="bg-[#213685] text-white">
              Activa
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">RD${ingresosTotales.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Ingresos Totales</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">-RD${gastosTotales.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Gastos Totales</div>
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
                    <TableCell>{registro.FechaRegistro}</TableCell>
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
