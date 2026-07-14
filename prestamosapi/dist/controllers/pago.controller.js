"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistorialPagos = exports.deletePago = exports.updatePago = exports.getProximaCuota = exports.getPagoById = exports.getAllPagos = exports.createPago = void 0;
const logger_1 = require("../utils/logger");
// Importamos TODOS los servicios
const pago_service_1 = require("../services/pago.service");
// NOTA: Asegúrate que la ruta al service sea correcta (../services/pagos.service o ../services/pago.service)
// 1. CREAR PAGO (Ya lo tenías, pero asegúrate que esté exportado)
const createPago = async (req, res) => {
    try {
        // 1. Recibimos los nuevos parámetros del Frontend
        const { IdPrestamo, MontoPagado, TipoPago, Observaciones, MontoInteresPagado, // <--- NUEVO
        MontoCapitalAbonado, // <--- NUEVO
        NumeroCuota // <--- NUEVO
         } = req.body;
        if (!IdPrestamo || !TipoPago || !MontoPagado) {
            return res.status(400).json({ error: "Datos incompletos." });
        }
        const resultado = await (0, pago_service_1.createPagoService)({
            IdPrestamo: Number(IdPrestamo),
            MontoPagado: Number(MontoPagado),
            TipoPago,
            Observaciones,
            // Pasamos los datos al servicio
            MontoInteresPagado: Number(MontoInteresPagado),
            MontoCapitalAbonado: Number(MontoCapitalAbonado),
            NumeroCuota: Number(NumeroCuota)
        }, req.user.IdEmpresa);
        res.status(201).json({
            success: true,
            message: "Pago registrado exitosamente.",
            data: resultado
        });
    }
    catch (error) {
        logger_1.logger.error("Error en createPago:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createPago = createPago;
// 2. OBTENER TODOS (Faltaba este export)
const getAllPagos = async (req, res) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const pagos = await (0, pago_service_1.getAllPagosService)(idEmpresa);
        res.json(pagos);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllPagos = getAllPagos;
// 3. OBTENER POR ID (Faltaba este export)
const getPagoById = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const pago = await (0, pago_service_1.getPagoByIdService)(Number(id), idEmpresa);
        res.json(pago);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPagoById = getPagoById;
// 4. OBTENER PRÓXIMA CUOTA (Faltaba este export)
const getProximaCuota = async (req, res) => {
    try {
        const { IdPrestamo } = req.params; // Viene de la URL /proxima-cuota/:IdPrestamo
        const idEmpresa = req.user.IdEmpresa;
        const info = await (0, pago_service_1.getProximaCuotaService)(Number(IdPrestamo), idEmpresa);
        res.json(info);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProximaCuota = getProximaCuota;
// 5. ACTUALIZAR PAGO (Faltaba este export)
const updatePago = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const data = req.body;
        const pago = await (0, pago_service_1.updatePagoService)(Number(id), idEmpresa, data);
        res.json(pago);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updatePago = updatePago;
// 6. ELIMINAR PAGO (Faltaba este export)
const deletePago = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        await (0, pago_service_1.deletePagoService)(Number(id), idEmpresa);
        res.json({ message: "Pago eliminado correctamente" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deletePago = deletePago;
const getHistorialPagos = async (req, res) => {
    try {
        // 1. Extraemos el idPrestamo de los parámetros de la URL
        // Por ejemplo: /pagos/historial/123 -> id = 123
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        // 2. Validación simple
        if (!id) {
            return res.status(400).json({ error: "El ID del préstamo es obligatorio" });
        }
        // 3. Llamamos al servicio (convertimos el id a Number porque viene como string)
        const historial = await (0, pago_service_1.getHistorialPagosService)(Number(id), idEmpresa);
        // 4. Respondemos con éxito
        return res.status(200).json(historial);
    }
    catch (error) {
        logger_1.logger.error("Error en getHistorialPagosController:", error);
        return res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
};
exports.getHistorialPagos = getHistorialPagos;
