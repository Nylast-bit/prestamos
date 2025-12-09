// src/controllers/registroConsolidacion.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
// Importamos el validador Zod y el servicio
import { registroConsolidacionSchema } from "../validators/registroconsolidacion.validator";
import * as registroConsolidacionService from "../services/registroconsolidacion.service"; 


// Crear registro de consolidación
export const createRegistroConsolidacion = asyncHandler(async (req: Request, res: Response) => {
    // 1. Validar y parsear la data de entrada (Trabajo del controlador)
    // El middleware validate(registroConsolidacionSchema) ya debe haber hecho esto,
    // pero si se llama directamente, usamos parse:
    const data = registroConsolidacionSchema.parse(req.body); 

    // 2. Llamar al servicio (Trabajo del controlador)
    const nuevoRegistro = await registroConsolidacionService.createRegistroConsolidacionService(data);

    res.status(201).json(nuevoRegistro);
});

// Obtener todos los registros
export const getAllRegistrosConsolidacion = asyncHandler(async (req: Request, res: Response) => {
    const lista = await registroConsolidacionService.getAllRegistrosConsolidacionService();
    res.json(lista);
});

// Obtener registro por ID
export const getRegistroConsolidacionById = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const registro = await registroConsolidacionService.getRegistroConsolidacionByIdService(id);
    res.json(registro);
});

// Actualizar registro
export const updateRegistroConsolidacion = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = registroConsolidacionSchema.parse(req.body);

    const actualizado = await registroConsolidacionService.updateRegistroConsolidacionService(id, data);
    
    res.json(actualizado);
});

// Eliminar registro
export const deleteRegistroConsolidacion = asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const resultado = await registroConsolidacionService.deleteRegistroConsolidacionService(id);
    
    res.json(resultado);
});