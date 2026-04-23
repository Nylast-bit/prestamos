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

        const { error: userError } = await supabase.from('Usuario').insert([{
            IdEmpresa: targetEmpresa,
            Nombre: data.Nombre,
            Email: autogenEmail,
            Clave: hashedClave,
            Rol: 'Prestamista',
            Estado: 'Activo'
        }]);
        
        if (userError) {
             res.status(400).json({ error: 'El email ya existe o hubo error creando cuenta de acceso: ' + userError.message });
             return;
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
    const data = req.body;
    if (data.IdEmpresa) delete data.IdEmpresa;
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