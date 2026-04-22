import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { supabase } from '../src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
    try {
        const email = 'superadmin@creditway.com';
        const rawPassword = 'superpassword123'; // Cambia esto si lo deseas
        
        console.log(`Generando hash de seguridad para el usuario...`);
        const salt = await bcrypt.genSalt(10);
        const hashedClave = await bcrypt.hash(rawPassword, salt);

        console.log(`Verificando base de datos...`);
        const { data: existing } = await supabase.from('Usuario').select('*').eq('Email', email);

        if (existing && existing.length > 0) {
            console.log(`El usuario ${email} ya existe en la base de datos.`);
            return;
        }

        console.log(`Insertando usuario SuperAdmin...`);
        const { data, error } = await supabase.from('Usuario').insert([{
            IdEmpresa: 1, 
            Nombre: 'Super Administrador', 
            Email: email, 
            Clave: hashedClave, 
            Rol: 'SuperAdmin', 
            Estado: 'Activo'
        }]).select();

        if (error) {
            throw error;
        }

        console.log(`✅ ¡SuperAdmin creado con éxito!`);
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Contraseña: ${rawPassword}`);
        console.log(`Inicia sesión con estas credenciales para entrar al dashboard SaaS.`);

    } catch (err: any) {
        console.error("❌ Error creando SuperAdmin:", err.message);
    }
}

createSuperAdmin();
