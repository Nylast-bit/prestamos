import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase } from '../src/config/supabaseClient';

dotenv.config();

const usersToSeed = [
    {
        Nombre: 'Super Admin Test',
        Email: 'superadmin@test.com',
        Clave: 'password123',
        Rol: 'SuperAdmin',
        IdEmpresa: 1, // Must be provided due to not-null constraint
        Estado: 'Activo'
    },
    {
        Nombre: 'Admin Empresa Test',
        Email: 'admin@test.com',
        Clave: 'password123',
        Rol: 'admin_empresa',
        IdEmpresa: 1, // Assumes company ID 1 exists
        Estado: 'Activo'
    },
    {
        Nombre: 'Prestamista Test',
        Email: 'prestamista@test.com',
        Clave: 'password123',
        Rol: 'Prestamista',
        IdEmpresa: 1, // Assumes company ID 1 exists
        Estado: 'Activo'
    }
];

const seedUsers = async () => {
    console.log('🌱 Starting user seeding process...');

    try {
        for (const user of usersToSeed) {
            console.log(`Processing user: ${user.Email}`);
            
            // Check if user already exists
            const { data: existingUser } = await supabase
                .from('Usuario')
                .select('IdUsuario')
                .eq('Email', user.Email)
                .single();

            if (existingUser) {
                console.log(`⚠️ User ${user.Email} already exists. Skipping.`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedClave = await bcrypt.hash(user.Clave, salt);

            // Insert user
            const { data, error } = await supabase
                .from('Usuario')
                .insert([{
                    Nombre: user.Nombre,
                    Email: user.Email,
                    Clave: hashedClave,
                    Rol: user.Rol,
                    IdEmpresa: user.IdEmpresa,
                    Estado: user.Estado
                }])
                .select('IdUsuario, Nombre, Email, Rol')
                .single();

            if (error) {
                console.error(`❌ Error inserting user ${user.Email}:`, error.message);
            } else {
                console.log(`✅ Successfully inserted user: ${user.Email}`);
            }
        }
        console.log('🎉 Seeding completed successfully!');
    } catch (err) {
        console.error('💥 Seeding failed:', err);
    }
};

seedUsers();
