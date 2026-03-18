import { supabase } from '../src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function crearUsuarioPrueba() {
    console.log("🔍 Buscando Empresa base para el usuario de prueba...");

    // Buscar la primera empresa o crear una si no existe
    let { data: empresa } = await supabase.from('Empresa').select('*').limit(1).single();

    if (!empresa) {
        console.log("⚠️ No se encontró ninguna empresa. Creando Empresa de Prueba...");
        const { data: nuevaEmpresa, error: errEmpresa } = await supabase.from('Empresa').insert({
            Nombre: 'Empresa de Prueba SA',
            DocumentoIdentidad: '123456789',
            Telefono: '555-0000',
            Email: 'contacto@empresaprueba.com',
            AdminConfig: {}
        }).select().single();

        if (errEmpresa || !nuevaEmpresa) {
            console.error("❌ Error creando empresa:", errEmpresa?.message);
            return;
        }
        empresa = nuevaEmpresa;
        console.log("✅ Empresa de Prueba creada con ID:", empresa.IdEmpresa);
    } else {
        console.log("✅ Empresa encontrada:", empresa.Nombre, "(ID:", empresa.IdEmpresa, ")");
    }

    // Comprobar si ya existe el usuario
    const emailPrueba = 'admin@prueba.com';
    const { data: usuarioExistente } = await supabase.from('Usuario').select('*').eq('Email', emailPrueba).single();

    if (usuarioExistente) {
        console.log(`✅ El usuario de prueba (${emailPrueba}) ya existe. Password es '123456'`);
        return;
    }

    console.log("⏳ Encriptando contraseña '123456'...");
    const salt = await bcrypt.genSalt(10);
    const hashClave = await bcrypt.hash('123456', salt);

    console.log("⏳ Creando Usuario de Prueba...");
    const { data: nuevoUsuario, error: errUsuario } = await supabase.from('Usuario').insert({
        IdEmpresa: empresa.IdEmpresa,
        Nombre: 'Admin De Prueba',
        Email: emailPrueba,
        Clave: hashClave,
        Rol: 'admin_empresa',
        Estado: 'Activo'
    }).select().single();

    if (errUsuario || !nuevoUsuario) {
        console.error("❌ Error creando usuario de prueba:", errUsuario?.message);
    } else {
        console.log("🎉 ¡Usuario de prueba creado exitosamente!");
        console.log("   - Email: admin@prueba.com");
        console.log("   - Clave: 123456");
        console.log("   - IdEmpresa:", empresa.IdEmpresa);
    }
}

crearUsuarioPrueba();
