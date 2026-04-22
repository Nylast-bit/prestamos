const postgres = require('postgres');

const strUrl = 'postgresql://postgres.ctmmdqzqwxifjwjuupxq:easywayeslavuelta2024@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
const sql = postgres(strUrl);

async function run() {
    try {
        console.log("Creando tabla Plan...");
        await sql`
            CREATE TABLE IF NOT EXISTS "Plan" (
                "IdPlan" SERIAL PRIMARY KEY,
                "Nombre" VARCHAR(100) NOT NULL,
                "Precio" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "LimiteUsuarios" INTEGER NOT NULL DEFAULT 5,
                "LimitePrestamos" INTEGER NOT NULL DEFAULT 50,
                "Activo" BOOLEAN NOT NULL DEFAULT true
            );
        `;

        console.log("Creando tabla Suscripcion...");
        await sql`
            CREATE TABLE IF NOT EXISTS "Suscripcion" (
                "IdSuscripcion" SERIAL PRIMARY KEY,
                "IdEmpresa" INTEGER NOT NULL REFERENCES "Empresa"("IdEmpresa"),
                "IdPlan" INTEGER NOT NULL REFERENCES "Plan"("IdPlan"),
                "FechaInicio" TIMESTAMP NOT NULL DEFAULT NOW(),
                "FechaVencimiento" TIMESTAMP NOT NULL,
                "Estado" VARCHAR(50) NOT NULL DEFAULT 'Activa'
            );
        `;

        console.log("Insertando plan gratuito...");
        const planes = await sql`SELECT * FROM "Plan" WHERE "Nombre" = 'Gratis'`;
        if (planes.length === 0) {
            await sql`INSERT INTO "Plan" ("Nombre", "Precio", "LimiteUsuarios", "LimitePrestamos", "Activo")
                      VALUES ('Gratis', 0, 5, 20, true)`;
        }

        console.log("Migración finalizada con éxito.");
    } catch (err) {
        console.error("Error running migration:", err);
    } finally {
        process.exit(0);
    }
}

run();
