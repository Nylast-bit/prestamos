"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor, Settings, Palette, Bell, Shield, Database, Upload, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useTheme } from "next-themes"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"

export function ConfiguracionContent() {
  const { theme, setTheme } = useTheme()
  const { user, loginState } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  
  // Theming state
  const [empresaNombre, setEmpresaNombre] = useState(user?.nombreEmpresa || "")
  const [empresaColor, setEmpresaColor] = useState(user?.colorFondo || "#213685")
  const [empresaIcono, setEmpresaIcono] = useState(user?.iconoEmpresa || "Building2")
  const [isSavingTheming, setIsSavingTheming] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleSaveTheming = async () => {
    setIsSavingTheming(true)
    try {
      await api.put('/empresas', {
        Nombre: empresaNombre,
        ColorFondo: empresaColor,
        Icono: empresaIcono
      })
      // Update local store
      if (user && useAuthStore.getState().token) {
        loginState(useAuthStore.getState().token as string, {
          ...user,
          nombreEmpresa: empresaNombre,
          colorFondo: empresaColor,
          iconoEmpresa: empresaIcono
        })
      }
      alert('Configuración visual guardada correctamente. Puede recargar la página si no se aplican todos los cambios.')
    } catch (e) {
      console.error(e)
      alert('Error guardando configuración')
    } finally {
      setIsSavingTheming(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await api.get('/import/export')
      const data = response.data

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Prestamos")
      XLSX.writeFile(workbook, "Export_Prestamos.xlsx")
    } catch (e) {
      console.error(e)
      alert('Error exportando datos')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        // Mapear columnas según el Excel del usuario
        const mappedRows = data.map((row: any) => {
          // Utilidades de limpieza
          const cleanNumber = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            // Remover símbolos, espacios, y manejar formato RD $60.000,00
            let str = String(val).replace(/[RD$\s%]/g, '');
            // Si el formato es 60.000,00 -> transformar a 60000.00
            // Si hay puntos y comas, asumimos punto=miles y coma=decimal
            if (str.includes('.') && str.includes(',')) {
              str = str.replace(/\./g, '').replace(',', '.');
            } else if (str.includes(',')) {
              // Si solo hay coma, podría ser decimal
              str = str.replace(',', '.');
            }
            return Number(str) || 0;
          };

          const parseExcelDate = (val: any) => {
            if (!val) return new Date().toISOString();
            
            // Si es un número (fecha serial de Excel)
            if (typeof val === 'number') {
              const date = new Date(Math.round((val - 25569) * 864e5));
              return date.toISOString();
            }

            // Si es un string con formato DD-MM-YYYY o DD/MM/YYYY
            if (typeof val === 'string') {
                const parts = val.split(/[-/]/);
                if (parts.length === 3) {
                    // Asumimos DD-MM-YYYY
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
                    return new Date(year, month, day).toISOString();
                }
            }

            // Fallback
            const d = new Date(val);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          };

          const pagosStr = String(row["PAGOS"] || "0/0");
          let completados = 0;
          let total = 0;
          
          if (pagosStr.includes('/')) {
            const parts = pagosStr.split('/').map(p => cleanNumber(p));
            completados = parts[0] || 0;
            total = parts[1] || 0;
          } else {
            total = cleanNumber(pagosStr) || 0;
          }

          return {
            nombreCliente: row["NOMBRES"],
            cedula: String(row["CÉDULA"] || ""),
            telefono: String(row["TELÉFONO"] || ""),
            direccion: String(row["DIRECCIÓN"] || ""),
            numeroCuenta: String(row["NUMERO DE CUENTA"] || ""),
            montoPrestado: cleanNumber(row["CAPITAL"]),
            interesPorcentaje: cleanNumber(row["PORCIENTO"]),
            interesMontoTotal: cleanNumber(row["INTERÉS"]),
            capitalRestante: cleanNumber(row["RESTANTE A PAGAR"]),
            cantidadCuotas: isNaN(total) ? 0 : total,
            cuotasRestantes: isNaN(total - completados) ? 0 : Math.max(0, total - completados),
            montoCuota: cleanNumber(row["CUOTAS"]),
            modalidadPago: String(row["PERÍODO DE PAGO"] || "mensual").toLowerCase().trim(),
            fechaInicio: parseExcelDate(row["FECHA DE INICIO"]),
            fechaFinEstimada: parseExcelDate(row["FECHA FINAL"]),
            responsableNombre: row["Responsable"] || "Admin"
          }
        })

        const response = await api.post('/import', { rows: mappedRows })
        alert(`Importación completada: ${response.data.success} éxitos, ${response.data.errors.length} errores.`)
        if (response.data.errors.length > 0) {
          console.error('Errores de importación:', response.data.errors)
        }
      } catch (err) {
        console.error(err)
        alert('Error procesando el archivo Excel')
      } finally {
        setIsImporting(false)
        if (e.target) e.target.value = '' // Limpiar input
      }
    }
    reader.readAsBinaryString(file)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">
          Personaliza la apariencia y comportamiento de la aplicación
        </p>
      </div>

      {/* Tema y Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#213685]" />
            Tema y Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza la apariencia visual de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Modo de Color</Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className={`h-20 flex-col gap-2 ${theme === "light" ? "bg-[#213685] hover:bg-[#213685]/90" : "hover:bg-[#213685]/10"}`}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-6 w-6" />
                <span>Claro</span>
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className={`h-20 flex-col gap-2 ${theme === "dark" ? "bg-[#213685] hover:bg-[#213685]/90" : "hover:bg-[#213685]/10"}`}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-6 w-6" />
                <span>Oscuro</span>
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className={`h-20 flex-col gap-2 ${theme === "system" ? "bg-[#213685] hover:bg-[#213685]/90" : "hover:bg-[#213685]/10"}`}
                onClick={() => setTheme("system")}
              >
                <Monitor className="h-6 w-6" />
                <span>Sistema</span>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecciona el tema que prefieras. El modo "Sistema" se ajustará automáticamente según la configuración de tu dispositivo.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base font-medium">Vista Actual</Label>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                {theme === "light" ? "Modo Claro" : theme === "dark" ? "Modo Oscuro" : "Modo Sistema"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Tema actualmente activo
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalización de Empresa */}
      {(user?.rol === 'AdminEmpresa' || user?.rol === 'admin_empresa' || user?.rol === 'Admin' || user?.rol === 'admin_sistema' || user?.rol === 'SuperAdmin') && (
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-[#213685]" />
                Identidad Visual
             </CardTitle>
             <CardDescription>
                Personaliza el nombre, color base y logotipo de tu plataforma SaaS
             </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-4">
               <div>
                 <Label>Nombre de la Plataforma</Label>
                 <Input value={empresaNombre} onChange={(e) => setEmpresaNombre(e.target.value)} className="mt-1" />
               </div>
               <div>
                 <Label>Color de Marca (HEX)</Label>
                 <div className="flex gap-2 mt-1">
                    <Input type="color" className="w-16 h-10 p-1" value={empresaColor} onChange={(e) => setEmpresaColor(e.target.value)} />
                    <Input value={empresaColor} onChange={(e) => setEmpresaColor(e.target.value)} />
                 </div>
               </div>
               <div>
                  <Label>Icono del Logo</Label>
                  <select value={empresaIcono} onChange={(e) => setEmpresaIcono(e.target.value)} className="w-full mt-1 p-2 border rounded-md text-sm outline-none">
                     <option value="Building2">Edificio (Por defecto)</option>
                     <option value="Briefcase">Maletín Empresarial</option>
                     <option value="Landmark">Banco / Institución</option>
                     <option value="Gem">Diamante</option>
                     <option value="Rocket">Cohete STARTUP</option>
                     <option value="Star">Estrella</option>
                  </select>
               </div>
               <Button onClick={handleSaveTheming} disabled={isSavingTheming} className="mt-2" style={{ backgroundColor: empresaColor }}>
                  {isSavingTheming ? "Guardando..." : "Guardar Identidad"}
               </Button>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#213685]" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cómo y cuándo recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Notificaciones Push</Label>
              <p className="text-sm text-muted-foreground">
                Recibe alertas sobre vencimientos y pagos
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sonidos</Label>
              <p className="text-sm text-muted-foreground">
                Reproducir sonidos para notificaciones
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#213685]" />
            Sistema
          </CardTitle>
          <CardDescription>
            Configuraciones del sistema y respaldos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Respaldo Automático</Label>
              <p className="text-sm text-muted-foreground">
                Crear respaldos automáticos de los datos
              </p>
            </div>
            <Switch
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-base font-medium">Acciones del Sistema</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <Button 
                variant="outline" 
                className="justify-start gap-2 hover:bg-[#213685]/10"
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Exportar Datos (Excel)
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  id="excel-upload"
                  onChange={handleImportExcel}
                  disabled={isImporting}
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 hover:bg-[#213685]/10"
                  asChild
                  disabled={isImporting}
                >
                  <label htmlFor="excel-upload" className="cursor-pointer flex items-center gap-2">
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Importar Datos (Excel)
                  </label>
                </Button>
              </div>

              <Button variant="outline" className="justify-start gap-2 hover:bg-[#213685]/10">
                <Shield className="h-4 w-4" />
                Limpiar Caché
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información de la Aplicación */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la Aplicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm font-medium">Versión</Label>
              <p className="text-sm text-muted-foreground">v1.0.0</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Última Actualización</Label>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Desarrollado por</Label>
              <p className="text-sm text-muted-foreground">Nylast-Bit</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Soporte</Label>
              <p className="text-sm text-muted-foreground">support@prestamospro.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
