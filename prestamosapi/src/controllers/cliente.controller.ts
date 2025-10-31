// src/controllers/cliente.controller.ts
import { Request, Response, NextFunction } from "express";
import prisma from "../prisma/client";

export const getAllClientes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (err) {
    next(err);
  }
};

export const getClienteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const cliente = await prisma.cliente.findUnique({ where: { IdCliente: id } });
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(cliente);
  } catch (err) {
    next(err);
  }
};

export const createCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    data.FechaRegistro = new Date().toISOString();
    const nuevoCliente = await prisma.cliente.create({ data });
    res.status(201).json(nuevoCliente);
  } catch (err) {
    next(err);
  }
};

export const updateCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const clienteActualizado = await prisma.cliente.update({
      where: { IdCliente: id },
      data,
    });
    res.json(clienteActualizado);
  } catch (err) {
    next(err);
  }
};

export const deleteCliente = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await prisma.cliente.delete({ where: { IdCliente: id } });
    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    next(err);
  }
};
