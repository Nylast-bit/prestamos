// components/GastoFijoContent.tsx
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
import { Plus, Edit, Trash2, Calendar, Check, X, TrendingDown } from 'lucide-react'

// --- INTERFACES ---
interface GastoFijo {
    IdGasto: number
    Nombre: string
    Monto: number
    Frecuencia: "mensual" | "quincenal"
    Dia1: number
    Dia2: number | null
    Activo: boolean
}

// Interfaz para el formulario (usando string para los inputs de número)
interface GastoFijoFormData {
    Nombre: string
    Monto: string
    Frecuencia: "mensual" | "quincenal"
    Dia1: string
    Dia2: string
    Activo: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
const API_URL = `${API_BASE_URL}/api/gastosfijos`;


export function GastoFijoContent() {
    const [gastos, setGastos] = useState<GastoFijo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingGasto, setEditingGasto] = useState<GastoFijo | null>(null)
    const [formData, setFormData] = useState<GastoFijoFormData>({
        Nombre: "",
        Monto: "",
        Frecuencia: "mensual",
        Dia1: "1",
        Dia2: "",
        Activo: true
    })

    // --- FETCH DATA ---
    const fetchGastos = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(API_URL)
            if (!res.ok) throw new Error("Fallo al obtener la lista de gastos fijos")
            const data: GastoFijo[] = await res.json()
            setGastos(data)
        } catch (e: any) {
            setError(e.message || 'Error de conexión con la API.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGastos()
    }, [fetchGastos])


    // --- CRUD HANDLERS ---
    
    const resetForm = () => {
        setFormData({
            Nombre: "",
            Monto: "",
            Frecuencia: "mensual",
            Dia1: "1",
            Dia2: "",
            Activo: true
        })
        setEditingGasto(null)
        setIsDialogOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Lógica de cálculo para Dia2:
        let dia2Value: number | null = null;
        
        if (formData.Frecuencia === 'quincenal') {
            const parsedDia2 = parseInt(formData.Dia2);
            // Si el campo Dia2 es 'quincenal' Y el valor es un número válido (1-31)
            if (!isNaN(parsedDia2) && parsedDia2 >= 1 && parsedDia2 <= 31) {
                dia2Value = parsedDia2;
            } else {
                // Forzar alerta si es quincenal y Dia2 es inválido o faltante
                alert("El Día 2 es obligatorio para la frecuencia Quincenal y debe ser un número válido (1-31).");
                return; 
            }
        }
        
        // 1. Transformar datos (string a number/boolean)
        const dataToSend = {
            Nombre: formData.Nombre,
            Monto: parseFloat(formData.Monto),
            Frecuencia: formData.Frecuencia,
            Dia1: parseInt(formData.Dia1),
            // 🚨 CORRECCIÓN APLICADA AQUÍ: Usa el valor de dia2Value que es number o null 🚨
            Dia2: dia2Value, 
            Activo: formData.Activo,
        }

        try {
            const url = editingGasto ? `${API_URL}/${editingGasto.IdGasto}` : API_URL;
            const method = editingGasto ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
            }
            
            await fetchGastos() 
            alert(`Gasto fijo ${editingGasto ? "actualizado" : "creado"} exitosamente.`)
            resetForm()

        } catch (e: any) {
            alert(`Fallo la operación: ${e.message}`)
        }
    }

    const handleEdit = (gasto: GastoFijo) => {
        setEditingGasto(gasto)
        setFormData({
            Nombre: gasto.Nombre,
            Monto: gasto.Monto.toString(),
            Frecuencia: gasto.Frecuencia,
            Dia1: gasto.Dia1.toString(),
            // 🚨 CORRECCIÓN AL INICIALIZAR EL FORMULARIO: Usar cadena vacía si es null 🚨
            Dia2: gasto.Dia2 ? gasto.Dia2.toString() : "",
            Activo: gasto.Activo
        })
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de que desea eliminar este gasto fijo?")) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Error ${response.status}`)
            }
            
            await fetchGastos()
            alert("Gasto fijo eliminado exitosamente.")

        } catch (e: any) {
            alert(`Fallo al eliminar: ${e.message}`);
        }
    }


    // --- RENDERING AUXILIAR ---

    const getFrecuenciaDisplay = (frecuencia: string, dia1: number, dia2: number | null) => {
        if (frecuencia === 'quincenal' && dia2) {
            return `Quincenal (Días ${dia1} y ${dia2})`
        }
        return `Mensual (Día ${dia1})`
    }

    if (loading) {
        return <Card><CardContent className="p-6 text-center">Cargando gastos fijos...</CardContent></Card>
    }

    if (error) {
        return <Card><CardContent className="p-6 text-center text-red-600">Error: {error}</CardContent></Card>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-red-600"/>
                                Gastos Fijos Recurrentes
                            </CardTitle>
                            <CardDescription>
                                Plantillas de egresos automáticos (Renta, Préstamos, etc.) que se registran en las consolidaciones.
                            </CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    className="bg-[#213685] hover:bg-[#213685]/90"
                                    onClick={resetForm}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nuevo Gasto Fijo
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>{editingGasto ? "Editar" : "Nuevo"} Gasto Fijo</DialogTitle>
                                    <DialogDescription>
                                        Define la recurrencia para la automatización contable.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit}>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nombre">Nombre / Concepto</Label>
                                            <Input
                                                id="nombre"
                                                value={formData.Nombre}
                                                onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="monto">Monto (RD$)</Label>
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
                                                <Label htmlFor="frecuencia">Frecuencia</Label>
                                                <Select 
                                                    value={formData.Frecuencia} 
                                                    onValueChange={(value: "mensual" | "quincenal") => 
                                                        setFormData({...formData, Frecuencia: value, Dia2: value === 'mensual' ? "" : formData.Dia2})
                                                    }
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar frecuencia" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="mensual">Mensual</SelectItem>
                                                        <SelectItem value="quincenal">Quincenal</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="dia1">Día 1 (Obligatorio)</Label>
                                                <Input
                                                    id="dia1"
                                                    type="number"
                                                    min="1"
                                                    max="31"
                                                    value={formData.Dia1}
                                                    onChange={(e) => setFormData({...formData, Dia1: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            {formData.Frecuencia === 'quincenal' && (
                                                <div className="space-y-2 col-span-2">
                                                    <Label htmlFor="dia2">Día 2 (Quincenal)</Label>
                                                    <Input
                                                        id="dia2"
                                                        type="number"
                                                        min="1"
                                                        max="31"
                                                        value={formData.Dia2}
                                                        onChange={(e) => setFormData({...formData, Dia2: e.target.value})}
                                                        required // Ahora es requerido si la frecuencia es quincenal
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2 mt-2">
                                            <input 
                                                id="activo"
                                                type="checkbox"
                                                checked={formData.Activo}
                                                onChange={(e) => setFormData({...formData, Activo: e.target.checked})}
                                                className="h-4 w-4 rounded border-gray-300 text-[#213685] focus:ring-[#213685]"
                                            />
                                            <Label htmlFor="activo">Gasto Activo (Se incluye en la automatización)</Label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" className="bg-[#213685] hover:bg-[#213685]/90">
                                            {editingGasto ? "Actualizar" : "Crear"} Gasto
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-bold w-[30%]">NOMBRE</TableHead>
                                    <TableHead className="font-bold w-[15%]">MONTO</TableHead>
                                    <TableHead className="font-bold w-[35%]">FRECUENCIA</TableHead>
                                    <TableHead className="font-bold w-[10%] text-center">ACTIVO</TableHead>
                                    <TableHead className="text-right font-bold w-[10%]">ACCIONES</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gastos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No hay gastos fijos registrados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    gastos.map((gasto) => (
                                        <TableRow key={gasto.IdGasto}>
                                            <TableCell className="font-medium">{gasto.Nombre}</TableCell>
                                            <TableCell>RD${gasto.Monto.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>{getFrecuenciaDisplay(gasto.Frecuencia, gasto.Dia1, gasto.Dia2)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="default" className={gasto.Activo ? "bg-green-600" : "bg-red-600"}>
                                                    {gasto.Activo ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(gasto)}
                                                        className="hover:bg-[#213685]/10"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(gasto.IdGasto)}
                                                        className="hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
        </div>
    )
}