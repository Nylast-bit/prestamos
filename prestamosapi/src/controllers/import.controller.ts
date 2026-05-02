import { Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as importService from "../services/import.service";
import { supabase } from "../config/supabaseClient";

export const importBatch = asyncHandler(async (req: any, res: Response) => {
  const { rows } = req.body;
  const idEmpresa = req.user.IdEmpresa;
  const isSuperAdmin = req.user.Rol === 'SuperAdmin' || req.user.Rol === 'admin_sistema';

  if (!rows || !Array.isArray(rows)) {
    return res.status(400).json({ error: "Se requiere un array de filas para importar" });
  }

  const results = await importService.importBatchService(rows, idEmpresa, isSuperAdmin);
  res.json(results);
});

export const exportAll = asyncHandler(async (req: any, res: Response) => {
  const idEmpresa = req.user.IdEmpresa;

  const { data: prestamos, error } = await supabase
    .from("Prestamo")
    .select(`
      *,
      Cliente (Nombre, Cedula, Telefono, Direccion, NumeroCuenta),
      Prestatario (Nombre)
    `)
    .eq("IdEmpresa", idEmpresa);

  if (error) throw error;

  // Formatear para que el frontend lo convierta a Excel fácilmente
  const formatted = prestamos.map(p => ({
    "Check / validador de pago": p.Estado === 'Pagado' ? 'PAGADO' : 'PENDIENTE',
    "NOMBRES": p.Cliente?.Nombre,
    "CAPITAL": p.MontoPrestado,
    "INTERÉS": p.InteresMontoTotal,
    "PORCIENTO": p.InteresPorcentaje,
    "RESTANTE A PAGAR": p.CapitalRestante,
    "PAGOS": `${p.CantidadCuotas - p.CuotasRestantes}/${p.CantidadCuotas}`,
    "CUOTAS": p.MontoCuota,
    "PERÍODO DE PAGO": p.ModalidadPago,
    "Responsable": p.Prestatario?.Nombre,
    "TELÉFONO": p.Cliente?.Telefono,
    "NUMERO DE CUENTA": p.Cliente?.NumeroCuenta,
    "CÉDULA": p.Cliente?.Cedula,
    "DIRECCIÓN": p.Cliente?.Direccion,
    "FECHA DE INICIO": p.FechaInicio,
    "FECHA FINAL": p.FechaFinEstimada,
    "ÚLTIMO PAGO": "Consultar Historial"
  }));

  res.json(formatted);
});
