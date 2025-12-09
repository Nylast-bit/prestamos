// src/controllers/consolidacionCapital.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as consolidacionService from "../services/consolidacioncapital.service"; // Asumo que importarás el servicio

// Crear consolidación de capital
export const createConsolidacionCapital = asyncHandler(async (req: Request, res: Response) => {
  // La lógica de transformación de fechas fue movida al servicio
  const nuevo = await consolidacionService.createConsolidacionCapitalService(req.body);
  res.status(201).json(nuevo);
});

// Obtener todas las consolidaciones
export const getAllConsolidacionesCapital = asyncHandler(async (req: Request, res: Response) => {
  const lista = await consolidacionService.getAllConsolidacionesCapitalService();
  res.json(lista);
});

// Obtener una consolidación por ID
export const getConsolidacionCapitalById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // El manejo de errores 404 fue movido al servicio (el servicio lanzará el error)
  const consolidacion = await consolidacionService.getConsolidacionCapitalByIdService(id);
  res.json(consolidacion);
});

// Actualizar consolidación
export const updateConsolidacionCapital = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // La lógica de transformación de fechas fue movida al servicio
  const actualizado = await consolidacionService.updateConsolidacionCapitalService(id, req.body);
  res.json(actualizado);
});

// Eliminar consolidación
export const deleteConsolidacionCapital = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  // El manejo de errores fue movido al servicio
  const resultado = await consolidacionService.deleteConsolidacionCapitalService(id);
  res.json(resultado);
});