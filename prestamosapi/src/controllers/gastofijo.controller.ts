// src/controllers/gastofijo.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler"; // Asumo que lo tienes
import * as gastoFijoService from "../services/gastofijo.service"; // Importamos el nuevo servicio

// Crear gasto fijo
export const createGastoFijo = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const nuevo = await gastoFijoService.createGastoFijoService(data);
  res.status(201).json(nuevo);
});

// Obtener todos los gastos fijos
export const getAllGastosFijos = asyncHandler(async (req: Request, res: Response) => {
  const lista = await gastoFijoService.getAllGastosFijosService();
  res.json(lista);
});

// Obtener gasto fijo por id
export const getGastoFijoById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const gasto = await gastoFijoService.getGastoFijoByIdService(id);
  res.json(gasto);
});

// Actualizar gasto fijo
export const updateGastoFijo = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = req.body;
  const actualizado = await gastoFijoService.updateGastoFijoService(id, data);
  res.json(actualizado);
});

// Eliminar gasto fijo
export const deleteGastoFijo = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const resultado = await gastoFijoService.deleteGastoFijoService(id);
  res.json(resultado);
});