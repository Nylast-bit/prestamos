import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";
import { getConsolidacionActivaId, getBalanceDisponibleActivoService } from "./consolidacioncapital.service";

interface RegistroConsolidacionData {
    IdConsolidacion?: number;
    FechaRegistro?: string | Date;
    TipoRegistro: string;
    Estado: string;
    Descripcion: string;
    Monto: number;
    IdPago?: number;
}

// --- CREAR REGISTRO ---
export const createRegistroConsolidacionService = async (data: RegistroConsolidacionData, idEmpresa: number) => {
    let idConsolidacionFinal: number;

    if (data.IdConsolidacion) {
        idConsolidacionFinal = data.IdConsolidacion;
    } else {
        const fechaRegistroParaBusqueda = data.FechaRegistro
            ? new Date(data.FechaRegistro).toISOString()
            : new Date().toISOString();

        idConsolidacionFinal = await getConsolidacionActivaId(fechaRegistroParaBusqueda, idEmpresa);
    }

    const fechaFinalISO = data.FechaRegistro
        ? new Date(data.FechaRegistro).toISOString()
        : new Date().toISOString();

    const tipoNorm = (data.TipoRegistro || '').toLowerCase().trim();
    const estadoNorm = (data.Estado || '').toLowerCase().trim();

    if (tipoNorm === 'egreso' && estadoNorm !== 'pendiente') {
        const infoBalance = await getBalanceDisponibleActivoService(idEmpresa, fechaFinalISO);
        const balanceDisponible = infoBalance.balanceDisponible;
        const montoEgreso = Number(data.Monto || 0);

        if (montoEgreso > balanceDisponible) {
            const formattedBalance = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(balanceDisponible);
            const formattedMonto = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(montoEgreso);
            throw new Error(`Saldo insuficiente en caja. El balance disponible es ${formattedBalance} y se intentó retirar/desembolsar ${formattedMonto}.`);
        }
    }

    const { data: nuevoRegistro, error } = await supabase
        .from("RegistroConsolidacion")
        .insert({
            IdConsolidacion: idConsolidacionFinal,
            FechaRegistro: fechaFinalISO,
            TipoRegistro: data.TipoRegistro,
            Estado: data.Estado,
            Descripcion: data.Descripcion,
            Monto: data.Monto,
            IdPago: data.IdPago || null
        })
        .select()
        .single();

    if (error) {
        logger.error("Error en createRegistroConsolidacionService:", error.message);
        throw new Error(`Error creando registro: ${error.message}`);
    }
    return nuevoRegistro;
};

// --- OBTENER TODOS (Con filtro opcional por idConsolidacion) ---
export const getAllRegistrosConsolidacionService = async (idEmpresa: number, idConsolidacion?: number) => {
    let query = supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            ConsolidacionCapital!inner (*)
        `)
        .eq("ConsolidacionCapital.IdEmpresa", idEmpresa)
        .order("IdRegistro", { ascending: false });

    if (idConsolidacion) {
        query = query.eq("IdConsolidacion", idConsolidacion);
    }

    const { data: lista, error } = await query;

    if (error) {
        logger.error("Error en getAllRegistrosConsolidacionService:", error.message);
        throw new Error(`Error obteniendo registros: ${error.message}`);
    }
    return lista;
};

// --- OBTENER POR ID ---
export const getRegistroConsolidacionByIdService = async (id: number, idEmpresa: number) => {
    const { data: registro, error } = await supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            ConsolidacionCapital!inner (*)
        `)
        .eq("IdRegistro", id)
        .eq("ConsolidacionCapital.IdEmpresa", idEmpresa)
        .maybeSingle();

    if (error) {
        throw new Error(`Error de BBDD buscando registro: ${error.message}`);
    }
    if (!registro) {
        throw new Error("Registro no encontrado");
    }
    return registro;
};

// --- ACTUALIZAR ---
export const updateRegistroConsolidacionService = async (id: number, idEmpresa: number, data: RegistroConsolidacionData) => {
    await getRegistroConsolidacionByIdService(id, idEmpresa);

    const fechaRegistro = data.FechaRegistro
        ? new Date(data.FechaRegistro).toISOString()
        : new Date().toISOString();

    const { data: actualizado, error } = await supabase
        .from("RegistroConsolidacion")
        .update({
            IdConsolidacion: data.IdConsolidacion,
            FechaRegistro: fechaRegistro,
            TipoRegistro: data.TipoRegistro,
            Estado: data.Estado,
            Descripcion: data.Descripcion,
            Monto: data.Monto,
        })
        .eq("IdRegistro", id)
        .select()
        .single();

    if (error) {
        throw new Error(`Error actualizando registro: ${error.message}`);
    }
    if (!actualizado) {
        throw new Error("Registro no encontrado para actualizar");
    }
    return actualizado;
};

// --- ELIMINAR ---
export const deleteRegistroConsolidacionService = async (id: number, idEmpresa: number) => {
    await getRegistroConsolidacionByIdService(id, idEmpresa);

    const { data, error } = await supabase
        .from("RegistroConsolidacion")
        .delete()
        .eq("IdRegistro", id)
        .select()
        .maybeSingle();

    if (error) {
        throw new Error(`Error eliminando registro: ${error.message}`);
    }
    if (!data) {
        throw new Error("Registro no encontrado para eliminar");
    }
    return { message: "Registro de consolidación eliminado" };
};