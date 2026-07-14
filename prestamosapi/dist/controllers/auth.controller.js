"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabaseClient_1 = require("../config/supabaseClient");
const jwt_1 = require("../utils/jwt");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email y contraseña son requeridos' });
            return;
        }
        const cleanEmail = email.trim();
        // Buscar usuario en DB (ilike para insensibilidad a mayúsculas)
        const { data: usuario, error } = await supabaseClient_1.supabase
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
        // Verificar contraseña
        const isMatch = await bcryptjs_1.default.compare(password, usuario.Clave);
        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }
        // Buscar la empresa relacionada para traer el nombre
        const { data: empresa } = await supabaseClient_1.supabase
            .from('Empresa')
            .select('Nombre, ColorFondo, Icono')
            .eq('IdEmpresa', usuario.IdEmpresa)
            .single();
        // Buscar plan activo
        const { data: suscripcion } = await supabaseClient_1.supabase
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
        // Generar Token JWT
        const token = (0, jwt_1.generateToken)({
            IdUsuario: usuario.IdUsuario,
            IdEmpresa: usuario.IdEmpresa,
            Rol: usuario.Rol
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
                nombreEmpresa: empresa ? empresa.Nombre : 'Desconocida',
                colorFondo: empresa?.ColorFondo || '#213685',
                iconoEmpresa: empresa?.Icono || 'Building2',
                suscripcion: suscripcion ? {
                    fechaVencimiento: suscripcion.FechaVencimiento,
                    plan: Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan
                } : null
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Error interno de servidor', details: err.message });
    }
};
exports.login = login;
