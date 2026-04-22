const bcrypt = require('bcryptjs');
const postgres = require('postgres');

// Utilizamos el connection string de Supabase
const strUrl = 'postgresql://postgres.ctmmdqzqwxifjwjuupxq:easywayeslavuelta2024@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
const sql = postgres(strUrl, { ssl: 'require' });

async function createSuperAdmin() {
    try {
        const email = 'superadmin@creditway.com';
        const rawPassword = 'creditway321'; // Cambia esto si lo deseas

        console.log(`Generando hash de seguridad para el usuario...`);
        const salt = await bcrypt.genSalt(10);
        const hashedClave = await bcrypt.hash(rawPassword, salt);

        console.log(`Insertando usuario en la base de datos...`);

        // Verificamos si ya hay un SuperAdmin con ese correo
        const existing = await sql`SELECT * FROM "Usuario" WHERE "Email" = ${email}`;

        if (existing.length > 0) {
            console.log(`El usuario ${email} ya existe en la base de datos.`);
            return;
        }

        // Insertamos el usuario (Asumimos Empresa 1 como la empresa genérica anfitriona)
        await sql`
            INSERT INTO "Usuario" ("IdEmpresa", "Nombre", "Email", "Clave", "Rol", "Estado")
            VALUES (1, 'Super Administrador', ${email}, ${hashedClave}, 'SuperAdmin', 'Activo')
        `;

        console.log(`✅ ¡SuperAdmin creado con éxito!`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Contraseña: ${rawPassword}`);
        console.log(`Inicia sesión con estas credenciales para entrar al dashboard SaaS.`);

    } catch (err) {
        console.error("❌ Error creando SuperAdmin:", err.message);
    } finally {
        process.exit(0);
    }
}

createSuperAdmin();
