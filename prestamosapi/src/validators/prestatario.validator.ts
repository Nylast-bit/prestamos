import { z } from "zod";

export const prestatarioSchema = z.object({
  Nombre: z
    .string()
    .min(1, { message: "El nombre es requerido" })
    .max(100, { message: "El nombre no puede exceder los 100 caracteres" }),

  Telefono: z
    .string()
    .regex(/^[0-9]{10}$/, { message: "El teléfono debe tener 10 dígitos" })
    .optional()
    .nullable(),

  Email: z
    .string()
    .email({ message: "Debe ser un correo válido" })
    .optional()
    .nullable(),

  Clave: z
    .string()
    .min(6, { message: "La clave debe tener mínimo 6 caracteres" }),
});

export type PrestatarioSchema = z.infer<typeof prestatarioSchema>;
