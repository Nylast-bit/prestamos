import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";
import { getConsolidacionActivaId } from './consolidacioncapital.service';

// --- FUNCIÓN PRINCIPAL DE JOB DE CAPITAL ---
export const checkAndCreateConsolidation = async (idEmpresa: number) => {
    const hoy = new Date().toISOString();
    logger.info(`🔍 Verificando/creando consolidación para hoy (${hoy}) en Empresa #${idEmpresa}...`);

    const idConsolidacion = await getConsolidacionActivaId(hoy, idEmpresa);

    const { data } = await supabase
        .from("ConsolidacionCapital")
        .select("*")
        .eq("IdConsolidacion", idConsolidacion)
        .single();

    return data;
};