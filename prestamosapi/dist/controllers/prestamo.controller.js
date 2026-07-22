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
exports.getPrestamosActivosCount = exports.obtenerRangoCuotas = exports.calcularTasaPorCuota = exports.opcionesSimularPrestamoCapitalInteres = exports.simularPrestamo = exports.getPrestamoParaEliminar = exports.deletePrestamo = exports.updatePrestamo = exports.reengancharPrestamo = exports.createPrestamo = exports.getPrestamoById = exports.getPrestamos = void 0;
const logger_1 = require("../utils/logger");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const prestamoService = __importStar(require("../services/prestamo.service"));
const supabaseClient_1 = require("../config/supabaseClient");
// Obtener todos los préstamos
exports.getPrestamos = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idEmpresa = req.user.IdEmpresa;
    const prestamos = await prestamoService.getPrestamosService(idEmpresa);
    res.json(prestamos);
});
// Obtener un préstamo por ID
exports.getPrestamoById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    const prestamo = await prestamoService.getPrestamoByIdService(Number(id), idEmpresa);
    res.json(prestamo);
});
// Crear préstamo
exports.createPrestamo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.Rol === 'Cajero') {
        res.status(403).json({ success: false, error: 'Acceso denegado. Los cajeros no están autorizados para crear préstamos.' });
        return;
    }
    const data = req.body;
    data.IdEmpresa = req.user.IdEmpresa;
    const isSuperAdmin = req.user.Rol === 'SuperAdmin';
    try {
        const nuevoPrestamo = await prestamoService.createPrestamoService(data, req.user.IdEmpresa, isSuperAdmin);
        res.status(201).json({
            success: true,
            prestamo: nuevoPrestamo,
        });
    }
    catch (error) {
        if (error.message.includes("suscripción activa") ||
            error.message.includes("Límite de préstamos") ||
            error.message.includes("Saldo insuficiente")) {
            return res.status(400).json({ success: false, error: error.message });
        }
        throw error;
    }
});
// Reenganchar préstamo
exports.reengancharPrestamo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.Rol === 'Cajero') {
        res.status(403).json({ success: false, error: 'Acceso denegado. Los cajeros no están autorizados para reenganchar préstamos.' });
        return;
    }
    const idPrestamoOriginal = Number(req.params.id);
    const data = req.body;
    const idEmpresa = req.user.IdEmpresa;
    const isSuperAdmin = req.user.Rol === 'SuperAdmin';
    try {
        const resultado = await prestamoService.reengancharPrestamoService(idPrestamoOriginal, data, idEmpresa, isSuperAdmin);
        res.status(200).json({
            success: true,
            data: resultado
        });
    }
    catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
});
// Actualizar préstamo
exports.updatePrestamo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.Rol === 'Cajero') {
        res.status(403).json({ error: 'Acceso denegado. Los cajeros no tienen permiso para editar préstamos.' });
        return;
    }
    const { id } = req.params;
    const idEmpresa = req.user.IdEmpresa;
    if (req.user?.Rol === 'Prestamista') {
        const { data: prestamoActual } = await supabaseClient_1.supabase
            .from('Prestamo')
            .select('IdPrestatario')
            .eq('IdPrestamo', Number(id))
            .eq('IdEmpresa', idEmpresa)
            .maybeSingle();
        if (prestamoActual && req.user.IdPrestatario && prestamoActual.IdPrestatario !== req.user.IdPrestatario) {
            res.status(403).json({ error: 'Acceso denegado. Solo el prestamista asignado puede modificar este préstamo.' });
            return;
        }
    }
    const data = req.body;
    if (data.IdEmpresa)
        delete data.IdEmpresa;
    const prestamo = await prestamoService.updatePrestamoService(Number(id), idEmpresa, data);
    res.json(prestamo);
});
// Eliminar préstamo
exports.deletePrestamo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.Rol === 'Cajero') {
        res.status(403).json({ error: 'Acceso denegado. Los cajeros no tienen permiso para eliminar préstamos.' });
        return;
    }
    const { id } = req.params;
    const idPrestamo = Number(id);
    const idEmpresa = req.user.IdEmpresa;
    if (req.user?.Rol === 'Prestamista') {
        const { data: prestamoActual } = await supabaseClient_1.supabase
            .from('Prestamo')
            .select('IdPrestatario')
            .eq('IdPrestamo', idPrestamo)
            .eq('IdEmpresa', idEmpresa)
            .maybeSingle();
        if (prestamoActual && req.user.IdPrestatario && prestamoActual.IdPrestatario !== req.user.IdPrestatario) {
            res.status(403).json({ error: 'Acceso denegado. Solo el prestamista asignado puede eliminar este préstamo.' });
            return;
        }
    }
    const resultado = await prestamoService.deletePrestamoService(idPrestamo, idEmpresa);
    res.json({
        success: true,
        message: "Préstamo eliminado correctamente.",
        resultado: resultado
    });
});
// Función adicional para obtener información antes de eliminar
exports.getPrestamoParaEliminar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const idPrestamo = Number(id);
    const idEmpresa = req.user.IdEmpresa;
    // 1. Llamamos al servicio para obtener los datos crudos
    // El 'try/catch' ya no es necesario aquí, 'asyncHandler' lo hace
    const prestamo = await prestamoService.getPrestamoConDetallesService(idPrestamo, idEmpresa);
    // 2. El controlador se encarga de 'dar formato' a la respuesta
    res.json({
        success: true,
        // El controlador formatea los datos del préstamo
        prestamo: {
            id: prestamo.IdPrestamo,
            cliente: prestamo.Cliente[0].Nombre,
            prestatario: prestamo.Prestatario[0].Nombre,
            monto: prestamo.MontoPrestado,
            estado: prestamo.Estado
        },
        // El controlador hace los cálculos de '.length'
        registrosRelacionados: {
            pagos: prestamo.Pagos.length,
            acuerdos: prestamo.Acuerdos.length,
            pagosPersonalizados: prestamo.PagosPersonalizados.length,
            volantes: prestamo.Volantes.length
        },
        // El controlador organiza los detalles
        detalles: {
            pagos: prestamo.Pagos,
            acuerdos: prestamo.Acuerdos,
            pagosPersonalizados: prestamo.PagosPersonalizados.length, // (Pequeño bug en tu código original, quizás querías el array?)
            volantes: prestamo.Volantes.length // (Igual aquí)
        },
        // El controlador añade la advertencia estática
        advertencia: "Al eliminar este préstamo se eliminarán TODOS los registros relacionados de forma permanente."
    });
});
// Simular préstamo
const simularPrestamo = async (req, res) => {
    try {
        const { monto, tasaInteres, numeroCuotas, tipoCalculo } = req.body;
        // 1. El controlador hace la validación de entrada
        if (!monto || !tasaInteres || !numeroCuotas || !tipoCalculo) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        // 2. El controlador llama al servicio con los datos limpios
        // Nota: Esta llamada ya NO es 'async'
        const simulacion = prestamoService.simularPrestamoService({
            monto,
            tasaInteres,
            numeroCuotas,
            tipoCalculo,
        });
        // 3. El controlador envía la respuesta
        return res.json({
            success: true,
            ...simulacion, // El objeto que devolvió el servicio
        });
    }
    catch (error) {
        logger_1.logger.error(error);
        // 4. Atrapamos el error que 'lanzó' el servicio
        if (error.message === "Tipo de cálculo no soportado") {
            return res.status(400).json({ error: error.message });
        }
        // Cualquier otro error inesperado
        return res.status(500).json({ error: "Error en simulación", details: error.message });
    }
};
exports.simularPrestamo = simularPrestamo;
//opciones prestamo
const opcionesSimularPrestamoCapitalInteres = async (req, res) => {
    try {
        const { monto, tasaInteres, numeroCuotas } = req.body;
        // 1. El controlador valida la entrada
        if (!monto || !tasaInteres || !numeroCuotas) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        // 2. El controlador llama al servicio (no es async)
        const prestamos = prestamoService.opcionesSimularPrestamoService({
            monto,
            tasaInteres,
            numeroCuotas,
        });
        // 3. El controlador envía la respuesta
        return res.json({
            success: true,
            prestamos, // El array que devolvió el servicio
        });
    }
    catch (error) {
        logger_1.logger.error(error);
        // 4. Atrapamos el error de lógica de negocio (el que añadimos)
        if (error.message.includes("El número de cuotas debe ser mayor a 2")) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: "Error en simulación", details: error.message });
    }
};
exports.opcionesSimularPrestamoCapitalInteres = opcionesSimularPrestamoCapitalInteres;
//Recalcular el interés del prestamo para ajustar el monto de cuotas
const calcularTasaPorCuota = async (req, res) => {
    try {
        // 1. El controlador valida la entrada
        const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = req.body;
        if (!monto || !cuotaDeseada || !numeroCuotas || !tipoCalculo) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        // 2. El controlador llama al servicio (no es async)
        const resultadoCalculo = prestamoService.calcularTasaPorCuotaService({
            monto,
            cuotaDeseada,
            numeroCuotas,
            tipoCalculo,
        });
        // 3. El controlador envía la respuesta
        return res.json({
            success: true,
            ...resultadoCalculo, // El objeto que devolvió el servicio
        });
    }
    catch (error) {
        logger_1.logger.error(error);
        // 4. Atrapamos los errores de lógica de negocio
        if (error.message.includes("No se pudo encontrar una tasa válida")) {
            return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("Tipo de cálculo no soportado")) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({
            error: "Error en el cálculo de tasa",
            details: error.message
        });
    }
};
exports.calcularTasaPorCuota = calcularTasaPorCuota;
// Función auxiliar para validar que la cuota deseada sea razonable
// Endpoint adicional para obtener el rango válido de cuotas
const obtenerRangoCuotas = async (req, res) => {
    try {
        // 1. El controlador valida la entrada
        const { monto, numeroCuotas } = req.body;
        if (!monto || !numeroCuotas) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }
        // 2. El controlador llama al servicio (no es async)
        const rango = prestamoService.obtenerRangoCuotasService({
            monto,
            numeroCuotas,
        });
        // 3. El controlador envía la respuesta (añade el mensaje estático)
        return res.json({
            success: true,
            ...rango, // { cuotaMinima, cuotaMaximaSugerida }
            mensaje: "La cuota mínima cubre solo el capital. La cuota máxima sugerida es el doble para mantener tasas razonables."
        });
    }
    catch (error) {
        logger_1.logger.error(error);
        // 4. Atrapamos el error de lógica de negocio (división por cero)
        if (error.message.includes("El número de cuotas debe ser un valor positivo")) {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({
            error: "Error al calcular rango de cuotas",
            details: error.message
        });
    }
};
exports.obtenerRangoCuotas = obtenerRangoCuotas;
const getPrestamosActivosCount = async (req, res) => {
    try {
        const { idPrestatario } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        if (!idPrestatario) {
            return res.status(400).json({ error: "El ID del prestatario es obligatorio" });
        }
        const cantidad = await prestamoService.countPrestamosActivosByPrestatarioService(Number(idPrestatario), idEmpresa);
        res.json({
            idPrestatario: Number(idPrestatario),
            cantidadActivos: cantidad
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPrestamosActivosCount = getPrestamosActivosCount;
