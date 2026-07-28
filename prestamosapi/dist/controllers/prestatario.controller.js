"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfile = exports.getMyProfile = exports.toggleEstadoPrestatario = exports.deletePrestatario = exports.updatePrestatario = exports.getPrestatarioById = exports.getAllPrestatarios = exports.createPrestatario = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
const prestatarioService = __importStar(require("../services/prestatario.service"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabaseClient_1 = require("../config/supabaseClient");
// Crear prestatario
exports.createPrestatario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const targetEmpresa = req.user.IdEmpresa;
    data.IdEmpresa = targetEmpresa;
    if (req.user.Rol !== 'SuperAdmin' && req.user.Rol !== 'admin_sistema') {
        const { data: suscripcion } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .select('Plan:IdPlan (LimiteUsuarios)')
            .eq('IdEmpresa', targetEmpresa)
            .eq('Estado', 'Activa')
            .order('IdSuscripcion', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (!suscripcion || !suscripcion.Plan) {
            res.status(403).json({ error: 'La empresa no cuenta con una suscripción activa.' });
            return;
        }
        const plan = Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan;
        const { count, error: countError } = await supabaseClient_1.supabase
            .from('Usuario')
            .select('*', { count: 'exact', head: true })
            .eq('IdEmpresa', targetEmpresa)
            .neq('Rol', 'admin_empresa');
        if (countError)
            throw countError;
        if ((count || 0) >= plan.LimiteUsuarios) {
            res.status(403).json({ error: 'Se ha alcanzado el límite de usuarios de su plan actual.' });
            return;
        }
    }
    if (data.Clave && data.Nombre) {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedClave = await bcryptjs_1.default.hash(data.Clave, salt);
        let autogenEmail = data.Email;
        if (!autogenEmail) {
            const randomNums = Math.floor(1000 + Math.random() * 9000);
            autogenEmail = `${data.Nombre.replace(/\s+/g, '').toLowerCase()}${randomNums}@empresa.local`;
            data.Email = autogenEmail; // Guardar para el retorno e insersión al prestatario
        }
        const { data: usuarioCreado, error: userError } = await supabaseClient_1.supabase.from('Usuario').insert([{
                IdEmpresa: targetEmpresa,
                Nombre: data.Nombre,
                Email: autogenEmail,
                Clave: hashedClave,
                Rol: data.Rol || 'Prestamista',
                Estado: 'Activo'
            }]).select('IdUsuario').single();
        if (userError) {
            res.status(400).json({ error: 'El email ya existe o hubo error creando cuenta de acceso: ' + userError.message });
            return;
        }
        if (usuarioCreado) {
            data.IdUsuario = usuarioCreado.IdUsuario;
        }
    }
    const nuevo = await prestatarioService.createPrestatarioService(data);
    res.status(201).json(nuevo);
});
// Obtener todos los prestatarios
exports.getAllPrestatarios = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idEmpresa = req.user.IdEmpresa;
    const lista = await prestatarioService.getAllPrestatariosService(idEmpresa);
    res.json(lista);
});
// Obtener prestatario por id
exports.getPrestatarioById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const prestatario = await prestatarioService.getPrestatarioByIdService(id, idEmpresa);
    res.json(prestatario);
});
// Actualizar prestatario
exports.updatePrestatario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const data = { ...req.body };
    if (data.IdEmpresa)
        delete data.IdEmpresa;
    // Si la clave viene vacía o no fue proporcionada, la eliminamos para no sobrescribir
    if (!data.Clave || typeof data.Clave !== 'string' || data.Clave.trim() === '') {
        delete data.Clave;
    }
    else {
        // Si proporcionaron una nueva clave, la hasheamos y también actualizamos la tabla Usuario
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedClave = await bcryptjs_1.default.hash(data.Clave, salt);
        data.Clave = hashedClave;
        const { data: prestatario } = await supabaseClient_1.supabase
            .from('Prestatario')
            .select('IdUsuario, Email')
            .eq('IdPrestatario', id)
            .eq('IdEmpresa', idEmpresa)
            .maybeSingle();
        if (prestatario?.IdUsuario) {
            await supabaseClient_1.supabase.from('Usuario').update({ Clave: hashedClave }).eq('IdUsuario', prestatario.IdUsuario);
        }
        else if (prestatario?.Email) {
            await supabaseClient_1.supabase.from('Usuario').update({ Clave: hashedClave }).eq('Email', prestatario.Email).eq('IdEmpresa', idEmpresa);
        }
    }
    // Actualizar datos del Usuario vinculado (Nombre, Email, Rol)
    if (data.Nombre || data.Email || data.Rol) {
        const { data: prestatario } = await supabaseClient_1.supabase
            .from('Prestatario')
            .select('IdUsuario, Email')
            .eq('IdPrestatario', id)
            .eq('IdEmpresa', idEmpresa)
            .maybeSingle();
        const userUpdate = {};
        if (data.Nombre)
            userUpdate.Nombre = data.Nombre;
        if (data.Email)
            userUpdate.Email = data.Email;
        if (data.Rol)
            userUpdate.Rol = data.Rol;
        if (Object.keys(userUpdate).length > 0) {
            if (prestatario?.IdUsuario) {
                await supabaseClient_1.supabase.from('Usuario').update(userUpdate).eq('IdUsuario', prestatario.IdUsuario);
            }
            else if (prestatario?.Email) {
                await supabaseClient_1.supabase.from('Usuario').update(userUpdate).eq('Email', prestatario.Email).eq('IdEmpresa', idEmpresa);
            }
        }
    }
    delete data.Rol; // Eliminar Rol ya que pertenece a Usuario, no a Prestatario
    const updated = await prestatarioService.updatePrestatarioService(id, idEmpresa, data);
    res.json(updated);
});
// Eliminar prestatario
exports.deletePrestatario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const result = await prestatarioService.deletePrestatarioService(id, idEmpresa);
    res.json(result);
});
// Toggle estado prestamista (activar/desactivar)
exports.toggleEstadoPrestatario = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const result = await prestatarioService.toggleEstadoPrestatarioService(id, idEmpresa);
    res.json(result);
});
// Obtener perfil propio
exports.getMyProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idPrestatario = req.user.IdPrestatario;
    const idEmpresa = req.user.IdEmpresa;
    if (!idPrestatario) {
        res.status(404).json({ error: 'No se encontró un perfil de prestamista vinculado a tu cuenta.' });
        return;
    }
    const prestatario = await prestatarioService.getPrestatarioByIdService(idPrestatario, idEmpresa);
    // Obtener datos del Usuario también
    const { data: usuario } = await supabaseClient_1.supabase
        .from('Usuario')
        .select('IdUsuario, Nombre, Email, Rol, Estado')
        .eq('IdUsuario', req.user.IdUsuario)
        .single();
    res.json({
        ...prestatario,
        usuario: usuario || null
    });
});
// Actualizar perfil propio
exports.updateMyProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idPrestatario = req.user.IdPrestatario;
    const idUsuario = req.user.IdUsuario;
    const idEmpresa = req.user.IdEmpresa;
    if (!idPrestatario) {
        res.status(404).json({ error: 'No se encontró un perfil de prestamista vinculado a tu cuenta.' });
        return;
    }
    const { Nombre, Telefono, Email, claveActual, claveNueva } = req.body;
    // Actualizar Prestatario
    const prestatarioUpdate = {};
    if (Nombre)
        prestatarioUpdate.Nombre = Nombre;
    if (Telefono !== undefined)
        prestatarioUpdate.Telefono = Telefono;
    if (Email)
        prestatarioUpdate.Email = Email;
    if (Object.keys(prestatarioUpdate).length > 0) {
        await prestatarioService.updatePrestatarioService(idPrestatario, idEmpresa, prestatarioUpdate);
    }
    // Actualizar Usuario (nombre, email, contraseña)
    const usuarioUpdate = {};
    if (Nombre)
        usuarioUpdate.Nombre = Nombre;
    if (Email)
        usuarioUpdate.Email = Email;
    // Cambio de contraseña
    if (claveActual && claveNueva) {
        const { data: usuario } = await supabaseClient_1.supabase
            .from('Usuario')
            .select('Clave')
            .eq('IdUsuario', idUsuario)
            .single();
        if (!usuario) {
            res.status(404).json({ error: 'Usuario no encontrado.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(claveActual, usuario.Clave);
        // Fallback for plaintext passwords
        const isPlainMatch = !isMatch && usuario.Clave === claveActual;
        if (!isMatch && !isPlainMatch) {
            res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        usuarioUpdate.Clave = await bcryptjs_1.default.hash(claveNueva, salt);
    }
    if (Object.keys(usuarioUpdate).length > 0) {
        const { error: userError } = await supabaseClient_1.supabase
            .from('Usuario')
            .update(usuarioUpdate)
            .eq('IdUsuario', idUsuario);
        if (userError) {
            res.status(400).json({ error: 'Error actualizando cuenta: ' + userError.message });
            return;
        }
    }
    res.json({ message: 'Perfil actualizado exitosamente.' });
});
