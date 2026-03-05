import { Request, Response } from "express";
import { solicitudPrestamoSchema } from "../validators/solicitudprestamo.validator";
import * as solicitudService from "../services/solicitudprestamo.service";

// Crear solicitud de préstamo
export const createSolicitudPrestamo = async (req: Request, res: Response) => {
  try {
    const data = solicitudPrestamoSchema.parse(req.body);
    const nuevaSolicitud = await solicitudService.createSolicitudService(data);
    
    res.status(201).json(nuevaSolicitud);
  } catch (error: any) {
    if (error.message === "Cliente no encontrado") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error creando solicitud de préstamo", details: error.message || error });
  }
};

// Obtener todas las solicitudes
export const getAllSolicitudesPrestamo = async (req: Request, res: Response) => {
  try {
    const lista = await solicitudService.getAllSolicitudesService();
    res.json(lista);
  } catch (error: any) {
    res.status(500).json({ error: "Error obteniendo solicitudes de préstamo", details: error.message || error });
  }
};

// Obtener solicitud por ID
export const getSolicitudPrestamoById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const solicitud = await solicitudService.getSolicitudByIdService(id);
    res.json(solicitud);
  } catch (error: any) {
    if (error.message === "Solicitud no encontrada") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Error buscando solicitud de préstamo", details: error.message || error });
  }
};

// Actualizar solicitud
export const updateSolicitudPrestamo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = solicitudPrestamoSchema.parse(req.body);
    const actualizado = await solicitudService.updateSolicitudService(id, data);
    
    res.json(actualizado);
  } catch (error: any) {
    if (error.message === "Cliente no encontrado") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error actualizando solicitud de préstamo", details: error.message || error });
  }
};

// Eliminar solicitud
export const deleteSolicitudPrestamo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await solicitudService.deleteSolicitudService(id);
    res.json({ message: "Solicitud de préstamo eliminada exitosamente" });
  } catch (error: any) {
    res.status(500).json({ error: "Error eliminando solicitud de préstamo", details: error.message || error });
  }
};