"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_RESULTADOS = 8

interface ClienteComboboxProps {
  clientes: any[]
  value: string // IdCliente como string ("" = sin seleccionar)
  onChange: (idCliente: string) => void
  disabled?: boolean
}

// Sin tildes ni mayúsculas: "Angélica" coincide con "angelica"
const normalizar = (texto: any) =>
  String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

// Selector de cliente: orden alfabético, buscador (nombre, cédula o teléfono) y solo 8 resultados a la vez
export function ClienteCombobox({ clientes, value, onChange, disabled }: ClienteComboboxProps) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [activo, setActivo] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const ordenados = useMemo(
    () => [...(clientes || [])].sort((a, b) => String(a.Nombre || "").localeCompare(String(b.Nombre || ""), "es", { sensitivity: "base" })),
    [clientes]
  )

  const coincidencias = useMemo(() => {
    const q = normalizar(busqueda)
    if (!q) return ordenados
    const qDigitos = q.replace(/\D/g, "")
    return ordenados.filter((c) =>
      normalizar(c.Nombre).includes(q) ||
      (qDigitos.length >= 3 && (String(c.Cedula || "").replace(/\D/g, "").includes(qDigitos) || String(c.Telefono || "").replace(/\D/g, "").includes(qDigitos)))
    )
  }, [ordenados, busqueda])

  const visibles = coincidencias.slice(0, MAX_RESULTADOS)
  const seleccionado = ordenados.find((c) => String(c.IdCliente) === String(value))

  useEffect(() => { setActivo(0) }, [busqueda])
  useEffect(() => {
    if (abierto) {
      setBusqueda("")
      // Enfocar el buscador al abrir (después de que el popover se monte)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [abierto])

  const elegir = (cliente: any) => {
    onChange(String(cliente.IdCliente))
    setAbierto(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActivo((i) => Math.min(i + 1, visibles.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); if (visibles[activo]) elegir(visibles[activo]) }
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          aria-label="Seleccionar cliente"
          disabled={disabled}
          className={cn("w-full justify-between bg-muted/50 h-9.5 text-sm font-normal", !seleccionado && "text-muted-foreground")}
        >
          <span className="truncate">{seleccionado ? seleccionado.Nombre : "Seleccionar cliente"}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[260px] p-0 z-[60]" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar por nombre, cédula o teléfono..."
            className="h-10 w-full bg-transparent text-base sm:text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Buscar cliente"
          />
        </div>

        <ul role="listbox" className="max-h-[min(440px,55vh)] overflow-y-auto overscroll-contain p-1">
          {visibles.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No se encontraron clientes</li>
          ) : (
            visibles.map((cliente, i) => {
              const esSeleccionado = String(cliente.IdCliente) === String(value)
              return (
                <li
                  key={cliente.IdCliente}
                  role="option"
                  aria-selected={esSeleccionado}
                  onMouseEnter={() => setActivo(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(cliente)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    i === activo ? "bg-accent text-accent-foreground" : ""
                  )}
                >
                  <Check className={cn("h-4 w-4 shrink-0", esSeleccionado ? "opacity-100 text-[#213685] dark:text-blue-300" : "opacity-0")} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cliente.Nombre}</p>
                    {(cliente.Cedula || cliente.Telefono) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {[cliente.Cedula, cliente.Telefono].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </li>
              )
            })
          )}
        </ul>

        {coincidencias.length > MAX_RESULTADOS && (
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            Mostrando {MAX_RESULTADOS} de {coincidencias.length}. Escribe para buscar otro cliente.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
