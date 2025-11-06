"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator, DollarSign, Percent, Calendar } from 'lucide-react'

interface CalculoPrestamo {
  MontoPrestado: number
  TipoCalculo: "Amortizable" | "Capital+Interes"
  InteresPorcentaje: number
  InteresMontoTotal: number
  CapitalTotalPagar: number
  MontoCuota: number
  CantidadCuotas: number
}

export function CalculadoraPrestamo() {
  const [calculo, setCalculo] = useState<CalculoPrestamo>({
    MontoPrestado: 10000,
    TipoCalculo: "Capital+Interes",
    InteresPorcentaje: 7,
    InteresMontoTotal: 0,
    CapitalTotalPagar: 0,
    MontoCuota: 0,
    CantidadCuotas: 6
  })

  const [cuotaAjustada, setCuotaAjustada] = useState<string>("")

  useEffect(() => {
    calcularPrestamo()
  }, [calculo.MontoPrestado, calculo.TipoCalculo, calculo.InteresPorcentaje, calculo.CantidadCuotas])

  const calcularPrestamo = () => {
    const { MontoPrestado, TipoCalculo, InteresPorcentaje, CantidadCuotas } = calculo

    if (TipoCalculo === "Capital+Interes") {
      // Capital + Interés: El interés se calcula sobre el total de cuotas
      const interesTotal = (MontoPrestado * InteresPorcentaje * CantidadCuotas) / 100
      const capitalTotal = MontoPrestado + interesTotal
      const cuota = capitalTotal / CantidadCuotas

      setCalculo(prev => ({
        ...prev,
        InteresMontoTotal: interesTotal,
        CapitalTotalPagar: capitalTotal,
        MontoCuota: cuota
      }))
    } else {
      // Amortizable: El interés se calcula por período sobre el saldo
      const interesPorCuota = (MontoPrestado * InteresPorcentaje) / 100
      const interesTotal = interesPorCuota * CantidadCuotas // Estimado

      setCalculo(prev => ({
        ...prev,
        InteresMontoTotal: interesTotal,
        CapitalTotalPagar: MontoPrestado,
        MontoCuota: interesPorCuota // Cuota mínima (solo interés)
      }))
    }
  }

  const ajustarCuota = () => {
    const nuevaCuota = parseFloat(cuotaAjustada)
    if (!nuevaCuota || calculo.TipoCalculo !== "Capital+Interes") return

    const { MontoPrestado, CantidadCuotas } = calculo
    const capitalTotal = nuevaCuota * CantidadCuotas
    const interesTotal = capitalTotal - MontoPrestado
    const nuevoPorcentaje = (interesTotal * 100) / (MontoPrestado * CantidadCuotas)

    setCalculo(prev => ({
      ...prev,
      MontoCuota: nuevaCuota,
      InteresMontoTotal: interesTotal,
      CapitalTotalPagar: capitalTotal,
      InteresPorcentaje: nuevoPorcentaje
    }))
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calculadora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#213685]" />
            Calculadora de Préstamos
          </CardTitle>
          <CardDescription>
            Calcula automáticamente los valores según el tipo de préstamo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto a Prestar</Label>
              <Input
                id="monto"
                type="number"
                value={calculo.MontoPrestado}
                onChange={(e) => setCalculo({...calculo, MontoPrestado: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interes">Interés (%)</Label>
              <Input
                id="interes"
                type="number"
                step="0.1"
                value={calculo.InteresPorcentaje}
                onChange={(e) => setCalculo({...calculo, InteresPorcentaje: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Cálculo</Label>
              <Select 
                value={calculo.TipoCalculo} 
                onValueChange={(value: "Amortizable" | "Capital+Interes") => setCalculo({...calculo, TipoCalculo: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Capital+Interes">Capital + Interés</SelectItem>
                  <SelectItem value="Amortizable">Amortizable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuotas">Cantidad de Cuotas</Label>
              <Input
                id="cuotas"
                type="number"
                value={calculo.CantidadCuotas}
                onChange={(e) => setCalculo({...calculo, CantidadCuotas: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          {/* Ajuste de cuota solo para Capital+Interés */}
          {calculo.TipoCalculo === "Capital+Interes" && (
            <div className="space-y-2">
              <Label htmlFor="cuotaAjuste">Ajustar Cuota (Opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="cuotaAjuste"
                  type="number"
                  placeholder={`Cuota actual: $${calculo.MontoCuota.toFixed(2)}`}
                  value={cuotaAjustada}
                  onChange={(e) => setCuotaAjustada(e.target.value)}
                />
                <Button 
                  onClick={ajustarCuota}
                  className="bg-[#213685] hover:bg-[#213685]/90"
                >
                  Ajustar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Resultados del Cálculo
          </CardTitle>
          <CardDescription>
            Valores calculados automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Monto Prestado:</span>
              <Badge variant="outline" className="text-lg">
                ${calculo.MontoPrestado.toLocaleString()}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Interés Total:</span>
              <Badge className="bg-blue-600 text-lg">
                ${calculo.InteresMontoTotal.toFixed(2)}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-[#213685]/10 rounded-lg">
              <span className="font-medium">Capital Total a Pagar:</span>
              <Badge className="bg-[#213685] text-lg">
                ${calculo.CapitalTotalPagar.toFixed(2)}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Cuota:</span>
              <Badge className="bg-green-600 text-lg">
                ${calculo.MontoCuota.toFixed(2)}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="font-medium">Cantidad de Cuotas:</span>
              <Badge className="bg-orange-600 text-lg">
                {calculo.CantidadCuotas}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Interés Porcentual:</span>
              <Badge className="bg-purple-600 text-lg">
                {calculo.InteresPorcentaje.toFixed(2)}%
              </Badge>
            </div>
          </div>

          {/* Explicación del tipo de cálculo */}
          <div className="mt-4 p-3 border rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {calculo.TipoCalculo === "Capital+Interes" ? "Capital + Interés" : "Amortizable"}
            </h4>
            <p className="text-sm text-muted-foreground">
              {calculo.TipoCalculo === "Capital+Interes" 
                ? "El interés se calcula sobre el monto total y se divide en cuotas fijas. El cliente paga la misma cantidad cada período."
                : "El interés se calcula sobre el saldo pendiente. El cliente puede pagar montos variables, pero mínimo debe cubrir el interés del período."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
