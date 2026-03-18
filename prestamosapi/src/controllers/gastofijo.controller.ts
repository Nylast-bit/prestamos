// src/controllers/gastofijo.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler"; // Asumo que lo tienes
import * as gastoFijoService from "../services/gastofijo.service"; // Importamos el nuevo servicio

// Crear gasto fijo
export const createGastoFijo = asyncHandler(async (req: any, res: Response) => {
  const data = req.body;
  data.IdEmpresa = req.user.IdEmpresa;
  const nuevo = await gastoFijoService.createGastoFijoService(data);
  res.status(201).json(nuevo);
});

// Obtener todos los gastos fijos
export const getAllGastosFijos = asyncHandler(async (req: any, res: Response) => {
  const idEmpresa = req.user.IdEmpresa;
  const lista = await gastoFijoService.getAllGastosFijosService(idEmpresa);
  res.json(lista);
});

// Obtener gasto fijo por id
export const getGastoFijoById = asyncHandler(async (req: any, res: Response) => {
  const id = Number(req.params.id);
  const idEmpresa = req.user.IdEmpresa;
  const gasto = await gastoFijoService.getGastoFijoByIdService(id, idEmpresa);
  res.json(gasto);
});

// Actualizar gasto fijo
export const updateGastoFijo = asyncHandler(async (req: any, res: Response) => {
  const id = Number(req.params.id);
  const idEmpresa = req.user.IdEmpresa;
  const data = req.body;
  if (data.IdEmpresa) delete data.IdEmpresa;
  const actualizado = await gastoFijoService.updateGastoFijoService(id, idEmpresa, data);
  res.json(actualizado);
});

// Eliminar gasto fijo
export const deleteGastoFijo = asyncHandler(async (req: any, res: Response) => {
  const id = Number(req.params.id);
  const idEmpresa = req.user.IdEmpresa;
  const resultado = await gastoFijoService.deleteGastoFijoService(id, idEmpresa);
  res.json(resultado);
});