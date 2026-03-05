// controllers/cliente.controller.ts
import { Request, Response, NextFunction } from "express";
import { 
  getAllClientesService, 
  getClienteByIdService, 
  createClienteService, 
  updateClienteService, 
  deleteClienteService 
} from "../services/cliente.service";

export const getAllClientes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientes = await getAllClientesService();
    res.json(clientes);
  } catch (err) {
    next(err);
  }
};

export const getClienteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const cliente = await getClienteByIdService(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(cliente);
  } catch (err) {
    next(err);
  }
};

export const createCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const nuevoCliente = await createClienteService(data);
    res.status(201).json(nuevoCliente);
  } catch (err) {
    next(err);
  }
};

export const updateCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    
    const clienteActualizado = await updateClienteService(id, data);

    if (!clienteActualizado) {
      return res.status(404).json({ error: "Cliente no encontrado para actualizar" });
    }

    res.json(clienteActualizado);
  } catch (err) {
    next(err);
  }
};

export const deleteCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const fueEliminado = await deleteClienteService(id);

    if (!fueEliminado) {
      return res.status(404).json({ error: "Cliente no encontrado para eliminar" });
    }

    res.json({ message: "Cliente eliminado correctamente" });
  } catch (err) {
    next(err);
  }
};