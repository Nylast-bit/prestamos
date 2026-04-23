import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as pagoPersonalizadoService from "../services/pagopersonalizado.service";

interface CrearPagoPersonalizadoBody {
    idPrestamo: number;
    idConsolidacion: number; // Para registrar el ingreso en la caja
    montoPagado: number;
    fechaPago: string;
    concepto: string;
}

export const createPagoPersonalizado = asyncHandler(async (req: Request<{}, {}, CrearPagoPersonalizadoBody>, res: Response) => {
    const { idPrestamo, idConsolidacion, montoPagado, fechaPago, concepto } = req.body;

    // 1. Validación básica
    if (!idPrestamo || !idConsolidacion || !montoPagado) {
        res.status(400);
        throw new Error("Faltan parámetros obligatorios (idPrestamo, idConsolidacion, montoPagado).");
    }

    if (montoPagado <= 0) {
        res.status(400);
        throw new Error("El monto pagado debe ser mayor a 0.");
    }

    // 2. Llamada al servicio que hace la matemática y guarda en DB
    const resultado = await pagoPersonalizadoService.createPagoPersonalizadoService({
        idPrestamo,
        idConsolidacion,
        montoPagado,
        fechaPago: fechaPago || new Date().toISOString(),
        concepto: concepto || "Pago Personalizado"
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