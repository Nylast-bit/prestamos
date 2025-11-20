// src/controllers/prestatario.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as prestatarioService from "../services/prestatario.service";

// Crear prestatario
export const createPrestatario = asyncHandler(async (req: Request, res: Response) => {
    const nuevo = await prestatarioService.createPrestatarioService(req.body);
    res.status(201).json(nuevo);
});

// Obtener todos los prestatarios
export const getAllPrestatarios = asyncHandler(async (req: Request, res: Response) => {
    const lista = await prestatarioService.getAllPrestatariosService();
    res.json(lista);
});

// Obtener prestatario por id
export const getPrestatarioById = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const prestatario = await prestatarioService.getPrestatarioByIdService(id);
    res.json(prestatario);
});

// Actualizar prestatario
export const updatePrestatario = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = await prestatarioService.updatePrestatarioService(id, req.body);
    res.json(updated);
});

// Eliminar prestatario
export const deletePrestatario = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await prestatarioService.deletePrestatarioService(id);
    res.json(result);
});