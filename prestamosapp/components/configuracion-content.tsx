"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Monitor, Settings, Palette, Bell, Shield, Database } from 'lucide-react'
import { useTheme } from "next-themes"

export function ConfiguracionContent() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [autoBackup, setAutoBackup] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)

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
              <Button variant="outline" className="justify-start gap-2 hover:bg-[#213685]/10">
                <Database className="h-4 w-4" />
                Exportar Datos
              </Button>
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
              <p className="text-sm text-muted-foreground">Enero 2025</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Desarrollado por</Label>
              <p className="text-sm text-muted-foreground">Préstamos Pro Team</p>
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
