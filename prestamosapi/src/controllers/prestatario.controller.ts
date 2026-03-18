// src/controllers/prestatario.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as prestatarioService from "../services/prestatario.service";

// Crear prestatario
export const createPrestatario = asyncHandler(async (req: any, res: Response) => {
    const data = req.body;
    data.IdEmpresa = req.user.IdEmpresa;
    const nuevo = await prestatarioService.createPrestatarioService(data);
    res.status(201).json(nuevo);
});

// Obtener todos los prestatarios
export const getAllPrestatarios = asyncHandler(async (req: any, res: Response) => {
    const idEmpresa = req.user.IdEmpresa;
    const lista = await prestatarioService.getAllPrestatariosService(idEmpresa);
    res.json(lista);
});

// Obtener prestatario por id
export const getPrestatarioById = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const prestatario = await prestatarioService.getPrestatarioByIdService(id, idEmpresa);
    res.json(prestatario);
});

// Actualizar prestatario
export const updatePrestatario = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const data = req.body;
    if (data.IdEmpresa) delete data.IdEmpresa;
    const updated = await prestatarioService.updatePrestatarioService(id, idEmpresa, data);
    res.json(updated);
});

// Eliminar prestatario
export const deletePrestatario = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const result = await prestatarioService.deletePrestatarioService(id, idEmpresa);
    res.json(result);
});