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
exports.deletePrestatario = exports.updatePrestatario = exports.getPrestatarioById = exports.getAllPrestatarios = exports.createPrestatario = void 0;
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
    const data = req.body;
    if (data.IdEmpresa)
        delete data.IdEmpresa;
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
