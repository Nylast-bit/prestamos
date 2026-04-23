-- Ejecuta esto en el editor SQL de Supabase para agregar la columna de Estado si no existe
ALTER TABLE "Empresa"
ADD COLUMN IF NOT EXISTS "Estado" VARCHAR(50) DEFAULT 'Activa';
