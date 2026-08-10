import { Request, Response } from "express";
import { logger } from "../utils/logger";
import {
  calcularMoraService,
  perdonarMoraService,
  getHistorialMoraService,
  getMorasPendientesService,
  verificarMoraPendienteCliente
} from "../services/mora.service";

export const calcularMora = async (req: any, res: Response) => {
  try {
    const { idPrestamo } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const result = await calcularMoraService(Number(idPrestamo), idEmpresa);
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Error en calcularMora:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const perdonarMora = async (req: any, res: Response) => {
  try {
    const { idPrestamo } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const usuario = req.user.Nombre || "Usuario";
    
    await perdonarMoraService(Number(idPrestamo), idEmpresa, usuario);
    res.json({ success: true, message: "Mora perdonada exitosamente" });
  } catch (error: any) {
    logger.error("Error en perdonarMora:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getHistorialMora = async (req: any, res: Response) => {
  try {
    const { idPrestamo } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const result = await getHistorialMoraService(Number(idPrestamo), idEmpresa);
    res.json(result);
  } catch (error: any) {
    logger.error("Error en getHistorialMora:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMorasPendientes = async (req: any, res: Response) => {
  try {
    const idEmpresa = req.user.IdEmpresa;
    const result = await getMorasPendientesService(idEmpresa);
    res.json(result);
  } catch (error: any) {
    logger.error("Error en getMorasPendientes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verificarMoraCliente = async (req: any, res: Response) => {
  try {
    const { idCliente } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const result = await verificarMoraPendienteCliente(Number(idCliente), idEmpresa);
    res.json(result);
  } catch (error: any) {
    logger.error("Error en verificarMoraCliente:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
