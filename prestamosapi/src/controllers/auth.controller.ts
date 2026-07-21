import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient';
import { generateToken } from '../utils/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email y contraseña son requeridos' });
            return;
        }

        const cleanEmail = email.trim();

        // Buscar usuario en DB (ilike para insensibilidad a mayúsculas)
        const { data: usuario, error } = await supabase
            .from('Usuario')
            .select('*')
            .ilike('Email', cleanEmail)
            .maybeSingle();

        if (error || !usuario) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        if (usuario.Estado !== 'Activo') {
            res.status(403).json({ error: 'El usuario está inactivo o suspendido' });
            return;
        }

        // Verificar contraseña con bcrypt
        let isMatch = await bcrypt.compare(password, usuario.Clave);

        // Fallback: Si la clave en la base de datos estaba en texto plano
        if (!isMatch && usuario.Clave === password) {
            isMatch = true;
            try {
                // Auto-hashear la clave para mayor seguridad en el futuro
                const salt = await bcrypt.genSalt(10);
                const hashedClave = await bcrypt.hash(password, salt);
                await supabase
                    .from('Usuario')
                    .update({ Clave: hashedClave })
                    .eq('IdUsuario', usuario.IdUsuario);
            } catch (hashErr) {
                console.error("Error auto-encriptando clave en login:", hashErr);
            }
        }

        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // Buscar la empresa relacionada para traer el nombre
        const { data: empresa } = await supabase
            .from('Empresa')
            .select('Nombre, ColorFondo, Icono')
            .eq('IdEmpresa', usuario.IdEmpresa)
            .single();

        // Buscar plan activo
        const { data: suscripcion } = await supabase
            .from('Suscripcion')
            .select(`
                FechaVencimiento,
                Estado,
                Plan:IdPlan (LimiteUsuarios, LimitePrestamos, Nombre)
            `)
            .eq('IdEmpresa', usuario.IdEmpresa)
            .eq('Estado', 'Activa')
            .order('IdSuscripcion', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Buscar o vincular el idPrestatario del usuario si no es SuperAdmin
        let idPrestatario: number | null = null;
        if (usuario.Rol !== 'SuperAdmin' && usuario.Rol !== 'admin_sistema') {
            try {
                // 1. Buscar si ya existe por IdUsuario o por Email
                const { data: prestatarioVinculado } = await supabase
                    .from('Prestatario')
                    .select('IdPrestatario, IdUsuario')
                    .eq('IdEmpresa', usuario.IdEmpresa)
                    .or(`IdUsuario.eq.${usuario.IdUsuario},Email.ilike.${cleanEmail}`)
                    .maybeSingle();

                if (prestatarioVinculado) {
                    idPrestatario = prestatarioVinculado.IdPrestatario;
                    // Vincular IdUsuario oportunísticamente si faltaba
                    if (!prestatarioVinculado.IdUsuario) {
                        await supabase
                            .from('Prestatario')
                            .update({ IdUsuario: usuario.IdUsuario })
                            .eq('IdPrestatario', prestatarioVinculado.IdPrestatario);
                    }
                } else {
                    // Auto-crear el perfil de Prestatario
                    const { data: nuevoPrestatario } = await supabase
                        .from('Prestatario')
                        .insert([{
                            Nombre: usuario.Nombre,
                            Email: usuario.Email,
                            IdEmpresa: usuario.IdEmpresa,
                            IdUsuario: usuario.IdUsuario
                        }])
                        .select('IdPrestatario')
                        .single();

                    if (nuevoPrestatario) {
                        idPrestatario = nuevoPrestatario.IdPrestatario;
                    }
                }
            } catch (errPrestatario) {
                console.error("Error buscando/vinculando prestatario en login:", errPrestatario);
            }
        }

        // Generar Token JWT
        const token = generateToken({
            IdUsuario: usuario.IdUsuario,
            IdEmpresa: usuario.IdEmpresa,
            Rol: usuario.Rol,
            IdPrestatario: idPrestatario
        });

        res.status(200).json({
            message: 'Autenticación exitosa',
            token,
            user: {
                id: usuario.IdUsuario,
                nombre: usuario.Nombre,
                email: usuario.Email,
                rol: usuario.Rol,
                idEmpresa: usuario.IdEmpresa,
                idPrestatario: idPrestatario,
                nombreEmpresa: empresa ? empresa.Nombre : 'Desconocida',
                colorFondo: empresa?.ColorFondo || '#213685',
                iconoEmpresa: empresa?.Icono || 'Building2',
                suscripcion: suscripcion ? {
                    fechaVencimiento: suscripcion.FechaVencimiento,
                    plan: Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan
                } : null
            }
        });

    } catch (err: any) {
        res.status(500).json({ error: 'Error interno de servidor', details: err.message });
    }
};

// --- Módulo de Verificación OTP ---
const otpStore = new Map<string, { code: string, expiresAt: number }>();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'El email es requerido.' });
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // Válido por 10 minutos

        otpStore.set(cleanEmail, { code, expiresAt });
        console.log(`🔑 [OTP SYSTEM] Código generado para ${cleanEmail}: ${code}`);

        res.status(200).json({
            success: true,
            message: `Código de verificación enviado a ${cleanEmail}`,
            previewCode: code // Retornado para comodidad visual en interfaz
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Error enviando código OTP: ' + error.message });
    }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400).json({ error: 'Email y código son obligatorios.' });
            return;
        }

        const cleanEmail = email.trim().toLowerCase();
        const record = otpStore.get(cleanEmail);

        if (!record) {
            res.status(400).json({ error: 'No se ha solicitado un código OTP para este correo.' });
            return;
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(cleanEmail);
            res.status(400).json({ error: 'El código OTP ha expirado. Por favor solicita uno nuevo.' });
            return;
        }

        if (record.code !== code.toString().trim()) {
            res.status(400).json({ error: 'Código de verificación incorrecto.' });
            return;
        }

        // Validación exitosa
        otpStore.delete(cleanEmail);
        res.status(200).json({
            success: true,
            message: '¡Correo electrónico verificado exitosamente con OTP!'
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Error verificando código OTP: ' + error.message });
    }
};
