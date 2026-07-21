import { logger } from '../utils/logger';
import { Request, Response } from "express";
import { supabase } from "../config/supabaseClient";
import {
  createPagoService,
  getAllPagosService,
  getPagoByIdService,
  getProximaCuotaService,
  updatePagoService,
  deletePagoService,
  getHistorialPagosService
} from "../services/pago.service";

// 1. CREAR PAGO
export const createPago = async (req: any, res: Response) => {
  try {
    const {
      IdPrestamo,
      MontoPagado,
      TipoPago,
      Observaciones,
      MontoInteresPagado,
      MontoCapitalAbonado,
      NumeroCuota
    } = req.body;

    if (!IdPrestamo || !TipoPago || !MontoPagado) {
      return res.status(400).json({ error: "Datos incompletos." });
    }

    if (req.user?.Rol === 'Prestamista') {
      const { data: prestamo } = await supabase
        .from('Prestamo')
        .select('IdPrestatario')
        .eq('IdPrestamo', Number(IdPrestamo))
        .eq('IdEmpresa', req.user.IdEmpresa)
        .maybeSingle();

      if (prestamo && req.user.IdPrestatario && prestamo.IdPrestatario !== req.user.IdPrestatario) {
        return res.status(403).json({ error: "Acceso denegado. Solo puedes registrar pagos en préstamos asignados a tu perfil de prestamista." });
      }
    }

    const resultado = await createPagoService({
      IdPrestamo: Number(IdPrestamo),
      MontoPagado: Number(MontoPagado),
      TipoPago,
      Observaciones,
      MontoInteresPagado: Number(MontoInteresPagado),
      MontoCapitalAbonado: Number(MontoCapitalAbonado),
      NumeroCuota: Number(NumeroCuota)
    }, req.user.IdEmpresa);

    res.status(201).json({
      success: true,
      message: "Pago registrado exitosamente.",
      data: resultado
    });

  } catch (error: any) {
    logger.error("Error en createPago:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. OBTENER TODOS
export const getAllPagos = async (req: any, res: Response) => {
  try {
    const idEmpresa = req.user.IdEmpresa;
    const pagos = await getAllPagosService(idEmpresa);
    res.json(pagos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. OBTENER POR ID
export const getPagoById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const pago = await getPagoByIdService(Number(id), idEmpresa);
    res.json(pago);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. OBTENER PRÓXIMA CUOTA
export const getProximaCuota = async (req: any, res: Response) => {
  try {
    const { IdPrestamo } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const info = await getProximaCuotaService(Number(IdPrestamo), idEmpresa);
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. ACTUALIZAR PAGO
export const updatePago = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const data = req.body;
    const pago = await updatePagoService(Number(id), idEmpresa, data);
    res.json(pago);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. ELIMINAR PAGO
export const deletePago = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    await deletePagoService(Number(id), idEmpresa);
    res.json({ message: "Pago eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHistorialPagos = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const idEmpresa = req.user.IdEmpresa;

    if (!id) {
      return res.status(400).json({ error: "El ID del préstamo es obligatorio" });
    }

    const historial = await getHistorialPagosService(Number(id), idEmpresa);
    return res.status(200).json(historial);

  } catch (error: any) {
    logger.error("Error en getHistorialPagosController:", error);
    return res.status(500).json({ error: error.message || "Error interno del servidor" });
  }
};