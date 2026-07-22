import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, TrendingUp, TrendingDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { RegistroConsolidacion } from "@/components/consolidacion-content" 

interface ConsolidacionTableProps {
  registros: RegistroConsolidacion[];
  onEdit: (registro: RegistroConsolidacion) => void;
  onDelete: (id: number) => void;
  formatDate: (isoString: string) => string;
}

export function ConsolidacionTable({ 
  registros, 
  onEdit, 
  onDelete, 
  formatDate 
}: ConsolidacionTableProps) {
  
  // Estado para controlar el orden (desc = más nuevos primero)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reiniciar a la página 1 cuando cambia la lista de registros
  useEffect(() => {
    setCurrentPage(1);
  }, [registros.length]);

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
    return tipo === "Ingreso" 
      ? <TrendingUp className="h-4 w-4 text-green-600" /> 
      : <TrendingDown className="h-4 w-4 text-red-600" />
  }

  // Ordenar los registros justo antes de paginarlos
  const sortedRegistros = [...registros].sort((a, b) => {
    const dateA = new Date(a.FechaRegistro).getTime();
    const dateB = new Date(b.FechaRegistro).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    setCurrentPage(1);
  };

  // Lógica de Paginación
  const totalPages = Math.ceil(sortedRegistros.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRegistros = sortedRegistros.slice(startIndex, startIndex + pageSize);

  if (registros.length === 0) {
    return <div className="text-center py-10 text-slate-500 border rounded-lg">No se encontraron registros para esta consolidación con los filtros actuales.</div>
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-bold">INGRESOS</TableHead>
            <TableHead className="font-bold">EGRESOS</TableHead>
            <TableHead 
              className="font-bold cursor-pointer hover:bg-slate-200 transition-colors group select-none"
              onClick={toggleSort}
              title="Clic para ordenar por fecha"
            >
              <div className="flex items-center gap-1">
                FECHA
                <ArrowUpDown className={`h-4 w-4 transition-colors ${sortOrder === 'asc' ? 'text-[#213685]' : 'text-slate-400 group-hover:text-slate-600'}`} />
              </div>
            </TableHead>
            <TableHead className="font-bold">CONCEPTO</TableHead>
            <TableHead className="font-bold">TOTAL</TableHead>
            <TableHead className="font-bold">ESTADO</TableHead>
            <TableHead className="text-right font-bold">ACCIONES</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRegistros.map((registro) => (
            <TableRow key={registro.IdRegistro} className="hover:bg-slate-50/50">
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
              <TableCell className="text-slate-600">{formatDate(registro.FechaRegistro)}</TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate font-medium text-slate-800" title={registro.Descripcion}>
                  {registro.Descripcion}
                </div>
              </TableCell>
              <TableCell>
                <span className={`font-bold ${registro.TipoRegistro === "Ingreso" ? "text-green-600" : "text-red-600"}`}>
                  RD${registro.Monto.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="default" className={`${getEstadoBadgeColor(registro.Estado)} shadow-none`}>
                  {registro.Estado}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-300 hover:bg-[#213685]/10"
                    onClick={() => onEdit(registro)}
                  >
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0 border-slate-300 hover:bg-red-50 hover:border-red-200"
                    onClick={() => onDelete(registro.IdRegistro)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* --- BARRA DE PAGINACIÓN DE REGISTROS DE CONSOLIDACIÓN --- */}
      {sortedRegistros.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#213685]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>registros por página</span>
          </div>

          <div className="text-slate-500">
            Mostrando <span className="font-semibold text-slate-700">{startIndex + 1}</span> a{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + pageSize, sortedRegistros.length)}
            </span>{" "}
            de <span className="font-semibold text-slate-700">{sortedRegistros.length}</span> registros
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 font-semibold text-slate-700">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}