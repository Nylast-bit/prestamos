-- Ejecuta esto en el editor SQL de Supabase para agregar los campos a Empresa

ALTER TABLE "Empresa"
ADD COLUMN IF NOT EXISTS "ColorFondo" VARCHAR(50) DEFAULT '#213685',
ADD COLUMN IF NOT EXISTS "Icono" VARCHAR(50) DEFAULT 'Building2';
