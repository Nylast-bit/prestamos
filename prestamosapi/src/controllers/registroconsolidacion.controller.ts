// src/controllers/registroConsolidacion.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
// Importamos el validador Zod y el servicio
import { registroConsolidacionSchema } from "../validators/registroconsolidacion.validator";
import * as registroConsolidacionService from "../services/registroconsolidacion.service";


// Crear registro de consolidación
export const createRegistroConsolidacion = asyncHandler(async (req: any, res: Response) => {
    const data = registroConsolidacionSchema.parse(req.body);

    try {
        const nuevoRegistro = await registroConsolidacionService.createRegistroConsolidacionService(data, req.user.IdEmpresa);
        res.status(201).json(nuevoRegistro);
    } catch (error: any) {
        if (error.message.includes("Saldo insuficiente")) {
            return res.status(400).json({ success: false, error: error.message });
        }
        throw error;
    }
});

// Obtener todos los registros (con filtro opcional por idConsolidacion)
export const getAllRegistrosConsolidacion = asyncHandler(async (req: any, res: Response) => {
    const idConsolidacion = req.query.idConsolidacion ? Number(req.query.idConsolidacion) : undefined;
    const lista = await registroConsolidacionService.getAllRegistrosConsolidacionService(req.user.IdEmpresa, idConsolidacion);
    res.json(lista);
});

// Obtener registro por ID
export const getRegistroConsolidacionById = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const registro = await registroConsolidacionService.getRegistroConsolidacionByIdService(id, req.user.IdEmpresa);
    res.json(registro);
});

// Actualizar registro
export const updateRegistroConsolidacion = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const data = registroConsolidacionSchema.parse(req.body);

    const actualizado = await registroConsolidacionService.updateRegistroConsolidacionService(id, req.user.IdEmpresa, data);

    res.json(actualizado);
});

// Eliminar registro
export const deleteRegistroConsolidacion = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const resultado = await registroConsolidacionService.deleteRegistroConsolidacionService(id, req.user.IdEmpresa);

    res.json(resultado);
});