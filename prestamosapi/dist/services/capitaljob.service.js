"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndCreateConsolidation = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const consolidacioncapital_service_1 = require("./consolidacioncapital.service");
// --- FUNCIÓN PRINCIPAL DE JOB DE CAPITAL ---
const checkAndCreateConsolidation = async (idEmpresa) => {
    const hoy = new Date().toISOString();
    logger_1.logger.info(`🔍 Verificando/creando consolidación para hoy (${hoy}) en Empresa #${idEmpresa}...`);
    const idConsolidacion = await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(hoy, idEmpresa);
    const { data } = await supabaseClient_1.supabase
        .from("ConsolidacionCapital")
        .select("*")
        .eq("IdConsolidacion", idConsolidacion)
        .single();
    return data;
};
exports.checkAndCreateConsolidation = checkAndCreateConsolidation;
