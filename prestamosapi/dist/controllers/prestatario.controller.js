"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePrestatario = exports.updatePrestatario = exports.getPrestatarioById = exports.getAllPrestatarios = exports.createPrestatario = void 0;
const client_1 = __importDefault(require("../prisma/client"));
// Crear prestatario
const createPrestatario = async (req, res) => {
    try {
        const data = req.body;
        const nuevo = await client_1.default.prestatario.create({
            data: {
                Nombre: data.Nombre,
                Telefono: data.Telefono,
                Email: data.Email,
                Clave: data.Clave,
            }
        });
        res.status(201).json(nuevo);
    }
    catch (error) {
        res.status(500).json({ error: "Error creando prestatario", details: error });
    }
};
exports.createPrestatario = createPrestatario;
// Obtener todos los prestatarios
const getAllPrestatarios = async (req, res) => {
    try {
        const lista = await client_1.default.prestatario.findMany();
        res.json(lista);
    }
    catch (error) {
        res.status(500).json({ error: "Error obteniendo prestatarios", details: error });
    }
};
exports.getAllPrestatarios = getAllPrestatarios;
// Obtener prestatario por id
const getPrestatarioById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const prestatario = await client_1.default.prestatario.findUnique({
            where: { IdPrestatario: id }
        });
        if (!prestatario)
            return res.status(404).json({ error: "Prestatario no encontrado" });
        res.json(prestatario);
    }
    catch (error) {
        res.status(500).json({ error: "Error buscando prestatario", details: error });
    }
};
exports.getPrestatarioById = getPrestatarioById;
// Actualizar prestatario
const updatePrestatario = async (req, res) => {
    const id = Number(req.params.id);
    const data = req.body;
    try {
        const updated = await client_1.default.prestatario.update({
            where: { IdPrestatario: id },
            data: {
                Nombre: data.Nombre,
                Telefono: data.Telefono,
                Email: data.Email,
                Clave: data.Clave,
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: "Error actualizando prestatario", details: error });
    }
};
exports.updatePrestatario = updatePrestatario;
// Eliminar prestatario
const deletePrestatario = async (req, res) => {
    const id = Number(req.params.id);
    try {
        await client_1.default.prestatario.delete({ where: { IdPrestatario: id } });
        res.json({ message: "Prestatario eliminado" });
    }
    catch (error) {
        res.status(500).json({ error: "Error eliminando prestatario", details: error });
    }
};
exports.deletePrestatario = deletePrestatario;
