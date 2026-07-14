"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consolidacionCapitalSchema = void 0;
// src/schemas/consolidacionCapital.schema.ts
const zod_1 = require("zod");
exports.consolidacionCapitalSchema = zod_1.z.object({
    FechaInicio: zod_1.z
        .string()
        .refine((val) => {
        if (!val)
            return true; // opcional
        return !isNaN(Date.parse(val));
    }, { message: "Formato de fecha inválido" })
        .optional(),
    FechaFin: zod_1.z
        .string()
        .refine((val) => {
        if (!val)
            return true; // opcional
        return !isNaN(Date.parse(val));
    }, { message: "Formato de fecha inválido" })
        .optional(),
    CapitalEntrante: zod_1.z.preprocess((val) => (val !== "" && val !== undefined ? Number(val) : undefined), zod_1.z.number().refine((n) => !isNaN(n), {
        message: "El capital entrante debe ser un número",
    })),
    CapitalSaliente: zod_1.z.preprocess((val) => (val !== "" && val !== undefined ? Number(val) : undefined), zod_1.z.number().refine((n) => !isNaN(n), {
        message: "El capital saliente debe ser un número",
    })),
    Observaciones: zod_1.z.string().optional(),
    FechaGeneracion: zod_1.z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Formato de fecha inválido" }),
});
