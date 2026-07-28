"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prestatarioSchema = void 0;
const zod_1 = require("zod");
exports.prestatarioSchema = zod_1.z.object({
    Nombre: zod_1.z
        .string()
        .min(1, { message: "El nombre es requerido" })
        .max(100, { message: "El nombre no puede exceder los 100 caracteres" }),
    Telefono: zod_1.z
        .string()
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
    Email: zod_1.z
        .string()
        .email({ message: "Debe ser un correo válido" })
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
    Clave: zod_1.z
        .string()
        .min(6, { message: "La clave debe tener mínimo 6 caracteres" })
        .optional()
        .nullable()
        .or(zod_1.z.literal('')),
});
