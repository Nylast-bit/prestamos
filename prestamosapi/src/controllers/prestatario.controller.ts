// src/controllers/prestatario.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as prestatarioService from "../services/prestatario.service";

import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient';

// Crear prestatario
export const createPrestatario = asyncHandler(async (req: any, res: Response) => {
    const data = req.body;
    const targetEmpresa = req.user.IdEmpresa;
    data.IdEmpresa = targetEmpresa;

    if (req.user.Rol !== 'SuperAdmin' && req.user.Rol !== 'admin_sistema') {
        const { data: suscripcion } = await supabase
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

        const { count, error: countError } = await supabase
            .from('Usuario')
            .select('*', { count: 'exact', head: true })
            .eq('IdEmpresa', targetEmpresa)
            .neq('Rol', 'admin_empresa');

        if (countError) throw countError;

        if ((count || 0) >= plan.LimiteUsuarios) {
            res.status(403).json({ error: 'Se ha alcanzado el límite de usuarios de su plan actual.' });
            return;
        }
    }

    if (data.Clave && data.Nombre) {
        const salt = await bcrypt.genSalt(10);
        const hashedClave = await bcrypt.hash(data.Clave, salt);
        
        let autogenEmail = data.Email;
        if (!autogenEmail) {
            const randomNums = Math.floor(1000 + Math.random() * 9000);
            autogenEmail = `${data.Nombre.replace(/\s+/g, '').toLowerCase()}${randomNums}@empresa.local`;
            data.Email = autogenEmail; // Guardar para el retorno e insersión al prestatario
        }

        const { data: usuarioCreado, error: userError } = await supabase.from('Usuario').insert([{
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
export const getAllPrestatarios = asyncHandler(async (req: any, res: Response) => {
    const idEmpresa = req.user.IdEmpresa;
    const lista = await prestatarioService.getAllPrestatariosService(idEmpresa);
    res.json(lista);
});

// Obtener prestatario por id
export const getPrestatarioById = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const prestatario = await prestatarioService.getPrestatarioByIdService(id, idEmpresa);
    res.json(prestatario);
});

// Actualizar prestatario
export const updatePrestatario = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const data = { ...req.body };
    if (data.IdEmpresa) delete data.IdEmpresa;

    // Si la clave viene vacía o no fue proporcionada, la eliminamos para no sobrescribir
    if (!data.Clave || typeof data.Clave !== 'string' || data.Clave.trim() === '') {
        delete data.Clave;
    } else {
        // Si proporcionaron una nueva clave, la hasheamos y también actualizamos la tabla Usuario
        const salt = await bcrypt.genSalt(10);
        const hashedClave = await bcrypt.hash(data.Clave, salt);
        data.Clave = hashedClave;

        const { data: prestatario } = await supabase
            .from('Prestatario')
            .select('IdUsuario, Email')
            .eq('IdPrestatario', id)
            .eq('IdEmpresa', idEmpresa)
            .maybeSingle();

        if (prestatario?.IdUsuario) {
            await supabase.from('Usuario').update({ Clave: hashedClave }).eq('IdUsuario', prestatario.IdUsuario);
        } else if (prestatario?.Email) {
            await supabase.from('Usuario').update({ Clave: hashedClave }).eq('Email', prestatario.Email).eq('IdEmpresa', idEmpresa);
        }
    }

    // Actualizar datos del Usuario vinculado (Nombre, Email, Rol)
    if (data.Nombre || data.Email || data.Rol) {
        const { data: prestatario } = await supabase
            .from('Prestatario')
            .select('IdUsuario, Email')
            .eq('IdPrestatario', id)
            .eq('IdEmpresa', idEmpresa)
            .maybeSingle();

        const userUpdate: any = {};
        if (data.Nombre) userUpdate.Nombre = data.Nombre;
        if (data.Email) userUpdate.Email = data.Email;
        if (data.Rol) userUpdate.Rol = data.Rol;

        if (Object.keys(userUpdate).length > 0) {
            if (prestatario?.IdUsuario) {
                await supabase.from('Usuario').update(userUpdate).eq('IdUsuario', prestatario.IdUsuario);
            } else if (prestatario?.Email) {
                await supabase.from('Usuario').update(userUpdate).eq('Email', prestatario.Email).eq('IdEmpresa', idEmpresa);
            }
        }
    }

    delete data.Rol; // Eliminar Rol ya que pertenece a Usuario, no a Prestatario

    const updated = await prestatarioService.updatePrestatarioService(id, idEmpresa, data);
    res.json(updated);
});

// Eliminar prestatario
export const deletePrestatario = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const result = await prestatarioService.deletePrestatarioService(id, idEmpresa);
    res.json(result);
});

// Toggle estado prestamista (activar/desactivar)
export const toggleEstadoPrestatario = asyncHandler(async (req: any, res: Response) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const result = await prestatarioService.toggleEstadoPrestatarioService(id, idEmpresa);
    res.json(result);
});

// Obtener perfil propio
export const getMyProfile = asyncHandler(async (req: any, res: Response) => {
    const idPrestatario = req.user.IdPrestatario;
    const idEmpresa = req.user.IdEmpresa;

    if (!idPrestatario) {
        res.status(404).json({ error: 'No se encontró un perfil de prestamista vinculado a tu cuenta.' });
        return;
    }

    const prestatario = await prestatarioService.getPrestatarioByIdService(idPrestatario, idEmpresa);

    // Obtener datos del Usuario también
    const { data: usuario } = await supabase
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
export const updateMyProfile = asyncHandler(async (req: any, res: Response) => {
    const idPrestatario = req.user.IdPrestatario;
    const idUsuario = req.user.IdUsuario;
    const idEmpresa = req.user.IdEmpresa;

    if (!idPrestatario) {
        res.status(404).json({ error: 'No se encontró un perfil de prestamista vinculado a tu cuenta.' });
        return;
    }

    const { Nombre, Telefono, Email, claveActual, claveNueva } = req.body;

    // Actualizar Prestatario
    const prestatarioUpdate: any = {};
    if (Nombre) prestatarioUpdate.Nombre = Nombre;
    if (Telefono !== undefined) prestatarioUpdate.Telefono = Telefono;
    if (Email) prestatarioUpdate.Email = Email;

    if (Object.keys(prestatarioUpdate).length > 0) {
        await prestatarioService.updatePrestatarioService(idPrestatario, idEmpresa, prestatarioUpdate);
    }

    // Actualizar Usuario (nombre, email, contraseña)
    const usuarioUpdate: any = {};
    if (Nombre) usuarioUpdate.Nombre = Nombre;
    if (Email) usuarioUpdate.Email = Email;

    // Cambio de contraseña
    if (claveActual && claveNueva) {
        const { data: usuario } = await supabase
            .from('Usuario')
            .select('Clave')
            .eq('IdUsuario', idUsuario)
            .single();

        if (!usuario) {
            res.status(404).json({ error: 'Usuario no encontrado.' });
            return;
        }

        const isMatch = await bcrypt.compare(claveActual, usuario.Clave);
        // Fallback for plaintext passwords
        const isPlainMatch = !isMatch && usuario.Clave === claveActual;

        if (!isMatch && !isPlainMatch) {
            res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        usuarioUpdate.Clave = await bcrypt.hash(claveNueva, salt);
    }

    if (Object.keys(usuarioUpdate).length > 0) {
        const { error: userError } = await supabase
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