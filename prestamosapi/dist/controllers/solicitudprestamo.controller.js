"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSolicitudPrestamo = exports.updateSolicitudPrestamo = exports.getSolicitudPrestamoById = exports.getAllSolicitudesPrestamo = exports.createSolicitudPrestamo = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const solicitudprestamo_validator_1 = require("../validators/solicitudprestamo.validator");
// Crear solicitud de préstamo
const createSolicitudPrestamo = async (req, res) => {
    try {
        const data = solicitudprestamo_validator_1.solicitudPrestamoSchema.parse(req.body);
        // Validar que el cliente exista
        const clienteExistente = await client_1.default.cliente.findUnique({
            where: { IdCliente: data.IdCliente },
        });
        if (!clienteExistente)
            return res.status(400).json({ error: "Cliente no encontrado" });
        const nuevaSolicitud = await client_1.default.solicitudPrestamo.create({
            data: {
                IdCliente: data.IdCliente,
                MontoSolicitado: data.MontoSolicitado,
                FechaDeseada: new Date(data.FechaDeseada),
                Estado: data.Estado,
                Notas: data.Notas || null,
                FechaCreacion: new Date(data.FechaCreacion),
            },
        });
        res.status(201).json(nuevaSolicitud);
    }
    catch (error) {
        res.status(500).json({
            error: "Error creando solicitud de préstamo",
            details: error,
        });
    }
};
exports.createSolicitudPrestamo = createSolicitudPrestamo;
// Obtener todas las solicitudes
const getAllSolicitudesPrestamo = async (req, res) => {
    try {
        const lista = await client_1.default.solicitudPrestamo.findMany({
            include: {
                Cliente: true,
            },
        });
        res.json(lista);
    }
    catch (error) {
        res.status(500).json({
            error: "Error obteniendo solicitudes de préstamo",
            details: error,
        });
    }
};
exports.getAllSolicitudesPrestamo = getAllSolicitudesPrestamo;
// Obtener solicitud por ID
const getSolicitudPrestamoById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const solicitud = await client_1.default.solicitudPrestamo.findUnique({
            where: { IdSolicitud: id },
            include: { Cliente: true },
        });
        if (!solicitud)
            return res.status(404).json({ error: "Solicitud no encontrada" });
        res.json(solicitud);
    }
    catch (error) {
        res.status(500).json({
            error: "Error buscando solicitud de préstamo",
            details: error,
        });
    }
};
exports.getSolicitudPrestamoById = getSolicitudPrestamoById;
// Actualizar solicitud
const updateSolicitudPrestamo = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const data = solicitudprestamo_validator_1.solicitudPrestamoSchema.parse(req.body);
        // Validar que el cliente exista
        const clienteExistente = await client_1.default.cliente.findUnique({
            where: { IdCliente: data.IdCliente },
        });
        if (!clienteExistente)
            return res.status(400).json({ error: "Cliente no encontrado" });
        const actualizado = await client_1.default.solicitudPrestamo.update({
            where: { IdSolicitud: id },
            data: {
                IdCliente: data.IdCliente,
                MontoSolicitado: data.MontoSolicitado,
                FechaDeseada: new Date(data.FechaDeseada),
                Estado: data.Estado,
                Notas: data.Notas || null,
                FechaCreacion: new Date(data.FechaCreacion),
            },
        });
        res.json(actualizado);
    }
    catch (error) {
        res.status(500).json({
            error: "Error actualizando solicitud de préstamo",
            details: error,
        });
    }
};
exports.updateSolicitudPrestamo = updateSolicitudPrestamo;
// Eliminar solicitud
const deleteSolicitudPrestamo = async (req, res) => {
    const id = Number(req.params.id);
    try {
        await client_1.default.solicitudPrestamo.delete({ where: { IdSolicitud: id } });
        res.json({ message: "Solicitud de préstamo eliminada" });
    }
    catch (error) {
        res.status(500).json({
            error: "Error eliminando solicitud de préstamo",
            details: error,
        });
    }
};
exports.deleteSolicitudPrestamo = deleteSolicitudPrestamo;
