"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistroConsolidacion = exports.updateRegistroConsolidacion = exports.getRegistroConsolidacionById = exports.getAllRegistrosConsolidacion = exports.createRegistroConsolidacion = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const registroconsolidacion_validator_1 = require("../validators/registroconsolidacion.validator");
// Crear registro de consolidación
const createRegistroConsolidacion = async (req, res) => {
    try {
        const data = registroconsolidacion_validator_1.registroConsolidacionSchema.parse(req.body);
        // Validar que la consolidación exista
        const consolidacionExistente = await client_1.default.consolidacionCapital.findUnique({
            where: { IdConsolidacion: data.IdConsolidacion },
        });
        if (!consolidacionExistente)
            return res.status(400).json({ error: "Consolidación no encontrada" });
        const nuevoRegistro = await client_1.default.registroConsolidacion.create({
            data: {
                IdConsolidacion: data.IdConsolidacion,
                FechaRegistro: new Date(data.FechaRegistro),
                TipoRegistro: data.TipoRegistro,
                Estado: data.Estado,
                Descripcion: data.Descripcion,
                Monto: data.Monto,
            },
        });
        res.status(201).json(nuevoRegistro);
    }
    catch (error) {
        res.status(500).json({
            error: "Error creando registro de consolidación",
            details: error,
        });
    }
};
exports.createRegistroConsolidacion = createRegistroConsolidacion;
// Obtener todos los registros
const getAllRegistrosConsolidacion = async (req, res) => {
    try {
        const lista = await client_1.default.registroConsolidacion.findMany({
            include: { Consolidacion: true },
        });
        res.json(lista);
    }
    catch (error) {
        res.status(500).json({
            error: "Error obteniendo registros de consolidación",
            details: error,
        });
    }
};
exports.getAllRegistrosConsolidacion = getAllRegistrosConsolidacion;
// Obtener registro por ID
const getRegistroConsolidacionById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const registro = await client_1.default.registroConsolidacion.findUnique({
            where: { IdRegistro: id },
            include: { Consolidacion: true },
        });
        if (!registro)
            return res.status(404).json({ error: "Registro no encontrado" });
        res.json(registro);
    }
    catch (error) {
        res.status(500).json({
            error: "Error buscando registro de consolidación",
            details: error,
        });
    }
};
exports.getRegistroConsolidacionById = getRegistroConsolidacionById;
// Actualizar registro
const updateRegistroConsolidacion = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const data = registroconsolidacion_validator_1.registroConsolidacionSchema.parse(req.body);
        // Validar que la consolidación exista
        const consolidacionExistente = await client_1.default.consolidacionCapital.findUnique({
            where: { IdConsolidacion: data.IdConsolidacion },
        });
        if (!consolidacionExistente)
            return res.status(400).json({ error: "Consolidación no encontrada" });
        const actualizado = await client_1.default.registroConsolidacion.update({
            where: { IdRegistro: id },
            data: {
                IdConsolidacion: data.IdConsolidacion,
                FechaRegistro: new Date(data.FechaRegistro),
                TipoRegistro: data.TipoRegistro,
                Estado: data.Estado,
                Descripcion: data.Descripcion,
                Monto: data.Monto,
            },
        });
        res.json(actualizado);
    }
    catch (error) {
        res.status(500).json({
            error: "Error actualizando registro de consolidación",
            details: error,
        });
    }
};
exports.updateRegistroConsolidacion = updateRegistroConsolidacion;
// Eliminar registro
const deleteRegistroConsolidacion = async (req, res) => {
    const id = Number(req.params.id);
    try {
        await client_1.default.registroConsolidacion.delete({ where: { IdRegistro: id } });
        res.json({ message: "Registro de consolidación eliminado" });
    }
    catch (error) {
        res.status(500).json({
            error: "Error eliminando registro de consolidación",
            details: error,
        });
    }
};
exports.deleteRegistroConsolidacion = deleteRegistroConsolidacion;
