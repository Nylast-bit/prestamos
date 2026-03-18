// controllers/cliente.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  getAllClientesService,
  getClienteByIdService,
  createClienteService,
  updateClienteService,
  deleteClienteService
} from "../services/cliente.service";

export const getAllClientes = async (req: any, res: Response, next: NextFunction) => {
  try {
    const idEmpresa = req.user.IdEmpresa;
    const clientes = await getAllClientesService(idEmpresa);
    res.json(clientes);
  } catch (err) {
    next(err);
  }
};

export const getClienteById = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const cliente = await getClienteByIdService(id, idEmpresa);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(cliente);
  } catch (err) {
    next(err);
  }
};

export const createCliente = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    data.IdEmpresa = req.user.IdEmpresa;
    const nuevoCliente = await createClienteService(data);
    res.status(201).json(nuevoCliente);
  } catch (err) {
    next(err);
  }
};

export const updateCliente = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const data = req.body;

    // No permitimos actualizar el IdEmpresa por seguridad
    if (data.IdEmpresa) delete data.IdEmpresa;

    const clienteActualizado = await updateClienteService(id, idEmpresa, data);

    if (!clienteActualizado) {
      return res.status(404).json({ error: "Cliente no encontrado para actualizar" });
    }

    res.json(clienteActualizado);
  } catch (err) {
    next(err);
  }
};

export const deleteCliente = async (req: any, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const fueEliminado = await deleteClienteService(id, idEmpresa);

    if (!fueEliminado) {
      return res.status(404).json({ error: "Cliente no encontrado para eliminar" });
    }

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (err) {
    next(err);
  }
};