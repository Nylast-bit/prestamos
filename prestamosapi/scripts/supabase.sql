-- Ejecuta esto en el editor SQL de Supabase

CREATE TABLE IF NOT EXISTS "Plan" (
    "IdPlan" SERIAL PRIMARY KEY,
    "Nombre" VARCHAR(100) NOT NULL,
    "Precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "LimiteUsuarios" INTEGER NOT NULL DEFAULT 5,
    "LimitePrestamos" INTEGER NOT NULL DEFAULT 50,
    "Activo" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "Suscripcion" (
    "IdSuscripcion" SERIAL PRIMARY KEY,
    "IdEmpresa" INTEGER NOT NULL REFERENCES "Empresa"("IdEmpresa"),
    "IdPlan" INTEGER NOT NULL REFERENCES "Plan"("IdPlan"),
    "FechaInicio" TIMESTAMP NOT NULL DEFAULT NOW(),
    "FechaVencimiento" TIMESTAMP NOT NULL,
    "Estado" VARCHAR(50) NOT NULL DEFAULT 'Activa'
);

-- Insertar el plan gratuito para tu uso interno
INSERT INTO "Plan" ("Nombre", "Precio", "LimiteUsuarios", "LimitePrestamos", "Activo")
VALUES ('Gratis', 0, 5, 20, true)
ON CONFLICT DO NOTHING;

-- Si actualmente existen empresas, se les puede inicializar con el plan gratis
INSERT INTO "Suscripcion" ("IdEmpresa", "IdPlan", "FechaVencimiento", "Estado")
SELECT "IdEmpresa", 1, NOW() + INTERVAL '10 years', 'Activa'
FROM "Empresa";
