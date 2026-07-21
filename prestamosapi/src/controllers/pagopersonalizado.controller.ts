import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as pagoPersonalizadoService from "../services/pagopersonalizado.service";

import { supabase } from "../config/supabaseClient";

export interface CrearPagoPersonalizadoBody {
    idPrestamo: number;
    idConsolidacion: number; // Para registrar el ingreso en la caja
    montoPagado: number;
    fechaPago: string;
    concepto: string;
    esLiquidacion?: boolean;
}

export const createPagoPersonalizado = asyncHandler(async (req: any, res: Response) => {
    const { idPrestamo, idConsolidacion, montoPagado, fechaPago, concepto, esLiquidacion } = req.body;

    // 1. Validación básica
    if (!idPrestamo || !idConsolidacion || !montoPagado) {
        res.status(400);
        throw new Error("Faltan parámetros obligatorios (idPrestamo, idConsolidacion, montoPagado).");
    }

    if (montoPagado <= 0) {
        res.status(400);
        throw new Error("El monto pagado debe ser mayor a 0.");
    }

    if (req.user?.Rol === 'Prestamista') {
        const { data: prestamo } = await supabase
            .from('Prestamo')
            .select('IdPrestatario')
            .eq('IdPrestamo', Number(idPrestamo))
            .eq('IdEmpresa', req.user.IdEmpresa)
            .maybeSingle();

        if (prestamo && req.user.IdPrestatario && prestamo.IdPrestatario !== req.user.IdPrestatario) {
            res.status(403).json({ error: "Acceso denegado. Solo puedes registrar pagos personalizados en préstamos asignados a tu perfil." });
            return;
        }
    }

    // 2. Llamada al servicio que hace la matemática y guarda en DB
    const resultado = await pagoPersonalizadoService.createPagoPersonalizadoService({
        idPrestamo,
        idConsolidacion,
        montoPagado,
        fechaPago: fechaPago || new Date().toISOString(),
        concepto: concepto || (esLiquidacion ? "Liquidación de Préstamo" : "Pago Personalizado"),
        esLiquidacion: !!esLiquidacion
    });

    // 3. Respuesta exitosa
    res.status(201).json({
        success: true,
        message: "Pago personalizado procesado correctamente.",
        data: resultado
    });
});

export const getAllPagosPersonalizados = asyncHandler(async (req: any, res: Response) => {
    const idEmpresa = req.user.IdEmpresa;
    const pagos = await pagoPersonalizadoService.getAllPagosPersonalizadosService(idEmpresa);
    
    res.status(200).json(pagos);
});