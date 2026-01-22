// src/controllers/jobTest.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as gastoFijoJobService from "../services/gastofijojob.service";
import * as capitalJobService from "../services/capitaljob.service"; // Incluimos el servicio de consolidación

// --- EJECUTAR PROCESAMIENTO DE GASTOS FIJOS (Manual) ---
export const runFixedExpenseProcessor = asyncHandler(async (req: Request, res: Response) => {
    const idConsolidacion = Number(req.params.id);

    if (isNaN(idConsolidacion)) {
        return res.status(400).json({ error: "Debe proporcionar un ID de Consolidación válido." });
    }

    console.log(`\n\n=== 🧪 Ejecutando prueba manual de gastos fijos para ID: ${idConsolidacion} ===`);
    
    // 1. Ejecutar la lógica de negocio (el job)
    const resultado = await gastoFijoJobService.processFixedExpenses(idConsolidacion);

    res.json({
        message: "Procesamiento de gastos fijos completado manualmente.",
        consolidacion_id: idConsolidacion,
        details: resultado,
    });
});

// --- EJECUTAR CIERRE DE CONSOLIDACIÓN (Manual) ---
// (Opcional, si quieres probar la lógica de transferencia de capital en cualquier momento)
export const runCheckAndCreateConsolidation = asyncHandler(async (req: Request, res: Response) => {
    console.log('\n\n=== 🧪 Ejecutando prueba manual de Cierre/Apertura de Consolidación ===');
    
    // Esta función encapsula la lógica de verificación de día (8 o 23) y creación.
    const nuevaConsolidacion = await capitalJobService.checkAndCreateConsolidation();
    
    if (nuevaConsolidacion) {
        res.json({
            message: "Nueva consolidación creada con transferencia de capital.",
            IdConsolidacion: nuevaConsolidacion.IdConsolidacion,
            CapitalInicial: nuevaConsolidacion.CapitalEntrante
        });
    } else {
        res.status(200).json({
            message: "No es día de cierre (8 o 23). No se creó una nueva consolidación.",
        });
    }
});