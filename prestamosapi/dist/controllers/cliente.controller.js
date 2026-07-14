"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCliente = exports.updateCliente = exports.createCliente = exports.getClienteById = exports.getAllClientes = void 0;
const cliente_service_1 = require("../services/cliente.service");
const getAllClientes = async (req, res, next) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const clientes = await (0, cliente_service_1.getAllClientesService)(idEmpresa);
        res.json(clientes);
    }
    catch (err) {
        next(err);
    }
};
exports.getAllClientes = getAllClientes;
const getClienteById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const idEmpresa = req.user.IdEmpresa;
        const cliente = await (0, cliente_service_1.getClienteByIdService)(id, idEmpresa);
        if (!cliente) {
            return res.status(404).json({ error: "Cliente no encontrado" });
        }
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
};
exports.getClienteById = getClienteById;
const createCliente = async (req, res, next) => {
    try {
        const data = req.body;
        data.IdEmpresa = req.user.IdEmpresa;
        const nuevoCliente = await (0, cliente_service_1.createClienteService)(data);
        res.status(201).json(nuevoCliente);
    }
    catch (err) {
        next(err);
    }
};
exports.createCliente = createCliente;
const updateCliente = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const idEmpresa = req.user.IdEmpresa;
        const data = req.body;
        // No permitimos actualizar el IdEmpresa por seguridad
        if (data.IdEmpresa)
            delete data.IdEmpresa;
        const clienteActualizado = await (0, cliente_service_1.updateClienteService)(id, idEmpresa, data);
        if (!clienteActualizado) {
            return res.status(404).json({ error: "Cliente no encontrado para actualizar" });
        }
        res.json(clienteActualizado);
    }
    catch (err) {
        next(err);
    }
};
exports.updateCliente = updateCliente;
const deleteCliente = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const idEmpresa = req.user.IdEmpresa;
        const fueEliminado = await (0, cliente_service_1.deleteClienteService)(id, idEmpresa);
        if (!fueEliminado) {
            return res.status(404).json({ error: "Cliente no encontrado para eliminar" });
        }
        res.json({ message: "Cliente eliminado correctamente" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCliente = deleteCliente;
