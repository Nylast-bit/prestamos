// src/controllers/consolidacionCapital.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as consolidacionService from "../services/consolidacioncapital.service"; // Asumo que importarás el servicio

// Crear consolidación de capital
export const createConsolidacionCapital = asyncHandler(async (req: any, res: Response) => {
  // La lógica de transformación de fechas fue movida al servicio
  const nuevo = await consolidacionService.createConsolidacionCapitalService(req.body, req.user.IdEmpresa);
  res.status(201).json(nuevo);
});

// Obtener todas las consolidaciones
export const getAllConsolidacionesCapital = asyncHandler(async (req: any, res: Response) => {
  const lista = await consolidacionService.getAllConsolidacionesCapitalService(req.user.IdEmpresa);
  res.json(lista);
});

// Obtener una consolidación por ID
export const getConsolidacionCapitalById = asyncHandler(async (req: any, res: Response) => {
  const id = Number(req.params.id);
  // El manejo de errores 404 fue movido al servicio (el servicio lanzará el error)
  const consolidacion = await consolidacionService.getConsolidacionCapitalByIdService(id, req.user.IdEmpresa);
  res.json(consolidacion);
});

// Actualizar consolidación
export const updateConsolidacionCapital = asyncHandler(async (req: any, res: Response) => {
  const id = Number(req.params.id);
  // La lógica de transformación de fechas fue movida al servicio
  const actualizado = await consolidacionService.updateConsolidacionCapitalService(id, req.user.IdEmpresa, req.body);
  res.json(actualizado);
});

// Eliminar consolidación
export const deleteConsolidacionCapital = asyncHandler(async (req: any, res: Response) => {
  const id = Number(req.params.id);
  // El manejo de errores fue movido al servicio
  const resultado = await consolidacionService.deleteConsolidacionCapitalService(id, req.user.IdEmpresa);
  res.json(resultado);
});

export const getResumenConsolidacionActiva = async (req: any, res: Response) => {
  try {
    const resumen = await consolidacionService.getResumenConsolidacionActivaService(req.user.IdEmpresa);
    // Respondemos con el JSON que espera el componente DashboardConsolidacion
    res.json(resumen);
  } catch (error: any) {
    res.status(500).json({
      error: "Error obteniendo el resumen de la consolidación activa",
      details: error.message
    });
  }
};