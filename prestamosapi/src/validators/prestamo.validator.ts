// src/schemas/prestamo.schema.ts
import { z } from "zod";

const modalidadPagoEnum = z.union([
  z.literal("semanal"),
  z.literal("quincenal"),
  z.literal("mensual"),
  z.literal("diario"),
]);

export const prestamoSchema = z.object({
  IdCliente: z
    .number()
    .min(1, "IdCliente es obligatorio"),
  IdPrestatario: z
    .number()
    .min(1, "IdPrestatario es obligatorio"),
  MontoPrestado: z
    .number()
    .positive("MontoPrestado debe ser mayor que 0"),
  TipoCalculo: z
    .string()
    .min(1, "TipoCalculo es obligatorio"),
  InteresPorcentaje: z
    .number()
    .min(0, "El interés no puede ser negativo"),
  InteresMontoTotal: z
    .number()
    .min(0),
  CapitalRestante: z
    .number()
    .min(0),
  CapitalTotalPagar: z
    .number()
    .min(0),
  MontoCuota: z
    .number()
    .positive("MontoCuota debe ser mayor que 0"),
  CantidadCuotas: z
    .number()
    .int()
    .positive(),
  CuotasRestantes: z
    .number()
    .int()
    .nonnegative(),
  ModalidadPago: modalidadPagoEnum.refine(
    (val) => ["semanal", "quincenal", "mensual", "diario"].includes(val),
    { message: "ModalidadPago debe ser semanal, quincenal, mensual o diario" }
  ),
  FechaInicio: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "FechaInicio debe ser una fecha válida",
    }),
  FechaFinEstimada: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "FechaFinEstimada debe ser una fecha válida",
    }),
  Estado: z
    .string()
    .min(1, "Estado es obligatorio"),
  Ajustable: z.boolean().optional(),
  Observaciones: z.string().optional(),
});
