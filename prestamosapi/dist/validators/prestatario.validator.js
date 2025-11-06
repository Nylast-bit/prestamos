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
        .regex(/^[0-9]{10}$/, { message: "El teléfono debe tener 10 dígitos" })
        .optional()
        .nullable(),
    Email: zod_1.z
        .string()
        .email({ message: "Debe ser un correo válido" })
        .optional()
        .nullable(),
    Clave: zod_1.z
        .string()
        .min(6, { message: "La clave debe tener mínimo 6 caracteres" }),
});
