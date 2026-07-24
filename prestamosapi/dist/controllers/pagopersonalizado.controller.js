"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPagosPersonalizados = exports.createPagoPersonalizado = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
const pagoPersonalizadoService = __importStar(require("../services/pagopersonalizado.service"));
const supabaseClient_1 = require("../config/supabaseClient");
exports.createPagoPersonalizado = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { idPrestamo, idConsolidacion, montoPagado, fechaPago, concepto, esLiquidacion, esAbonoExtraordinario, tipoPago } = req.body;
    const isAbonoExtra = esAbonoExtraordinario === true || esAbonoExtraordinario === 'true' || tipoPago === 'Extraordinario';
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
        const { data: prestamo } = await supabaseClient_1.supabase
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
        concepto: concepto || (isAbonoExtra ? "Abono Extraordinario a Capital" : (esLiquidacion ? "Liquidación de Préstamo" : "Pago Personalizado")),
        esLiquidacion: !!esLiquidacion,
        esAbonoExtraordinario: isAbonoExtra
    });
    // 3. Respuesta exitosa
    res.status(201).json({
        success: true,
        message: "Pago personalizado procesado correctamente.",
        data: resultado
    });
});
exports.getAllPagosPersonalizados = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idEmpresa = req.user.IdEmpresa;
    const pagos = await pagoPersonalizadoService.getAllPagosPersonalizadosService(idEmpresa);
    res.status(200).json(pagos);
});
