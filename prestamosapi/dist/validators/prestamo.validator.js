"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prestamoSchema = void 0;
const zod_1 = require("zod");
const modalidadPagoEnum = zod_1.z.union([
    zod_1.z.literal("semanal"),
    zod_1.z.literal("quincenal"),
    zod_1.z.literal("mensual"),
    zod_1.z.literal("diario"),
]);
exports.prestamoSchema = zod_1.z.object({
    IdCliente: zod_1.z
        .number()
        .min(1, "IdCliente es obligatorio"),
    IdPrestatario: zod_1.z
        .number()
        .min(1, "IdPrestatario es obligatorio"),
    MontoPrestado: zod_1.z
        .number()
        .positive("MontoPrestado debe ser mayor que 0"),
    TipoCalculo: zod_1.z
        .string()
        .min(1, "TipoCalculo es obligatorio"),
    InteresPorcentaje: zod_1.z
        .number()
        .min(0, "El interés no puede ser negativo"),
    InteresMontoTotal: zod_1.z
        .number()
        .min(0),
    CapitalRestante: zod_1.z
        .number()
        .min(0),
    CapitalTotalPagar: zod_1.z
        .number()
        .min(0),
    MontoCuota: zod_1.z
        .number()
        .positive("MontoCuota debe ser mayor que 0"),
    CantidadCuotas: zod_1.z
        .number()
        .int()
        .positive(),
    CuotasRestantes: zod_1.z
        .number()
        .int()
        .nonnegative(),
    ModalidadPago: modalidadPagoEnum.refine((val) => ["semanal", "quincenal", "mensual", "diario"].includes(val), { message: "ModalidadPago debe ser semanal, quincenal, mensual o diario" }),
    FechaInicio: zod_1.z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
        message: "FechaInicio debe ser una fecha válida",
    }),
    FechaFinEstimada: zod_1.z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
        message: "FechaFinEstimada debe ser una fecha válida",
    }),
    Estado: zod_1.z
        .string()
        .min(1, "Estado es obligatorio"),
    Ajustable: zod_1.z.boolean().optional(),
    Observaciones: zod_1.z.string().optional(),
});
