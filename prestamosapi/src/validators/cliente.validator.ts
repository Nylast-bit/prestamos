// src/schemas/cliente.schema.ts
import { z } from "zod";

export const clienteSchema = z.object({
  Nombre: z.string().min(1, "El nombre es obligatorio"),
  Cedula: z.string().min(5, "La cédula es obligatoria"),
  Telefono: z.string().optional(),
  Email: z.union([z.string().email("Email inválido"), z.literal("")]).optional().nullable(),
  NumeroCuenta: z.string().optional().or(z.literal("")).nullable(),
  Direccion: z.string().optional(),
  FechaRegistro: z.string().optional(), // Puede ser generada automáticamente
});

