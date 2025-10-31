// src/controllers/user.controller.ts
import { Request, Response } from "express";

export const getAllUsers = (req: Request, res: Response) => {
  res.json({ message: "Lista de usuarios" });
};
