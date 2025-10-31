// src/schemas/consolidacionCapital.schema.ts
import { z } from "zod";

export const consolidacionCapitalSchema = z.object({

  FechaInicio: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // opcional
        return !isNaN(Date.parse(val));
      },
      { message: "Formato de fecha inválido" }
    )
    .optional(),

  FechaFin: z
    .string()
    .refine(
      (val) => {
        if (!val) return true; // opcional
        return !isNaN(Date.parse(val));
      },
      { message: "Formato de fecha inválido" }
    )
    .optional(),

  CapitalEntrante: z.preprocess(
    (val) => (val !== "" && val !== undefined ? Number(val) : undefined),
    z.number().refine((n) => !isNaN(n), {
      message: "El capital entrante debe ser un número",
    })
  ),

  CapitalSaliente: z.preprocess(
    (val) => (val !== "" && val !== undefined ? Number(val) : undefined),
    z.number().refine((n) => !isNaN(n), {
      message: "El capital saliente debe ser un número",
    })
  ),

  Observaciones: z.string().optional(),

  FechaGeneracion: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      { message: "Formato de fecha inválido" }
    ),
});
