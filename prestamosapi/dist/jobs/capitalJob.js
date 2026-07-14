"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCapitalJob = void 0;
const logger_1 = require("../utils/logger");
const node_cron_1 = __importDefault(require("node-cron"));
// Importamos la función de lógica que acabamos de arreglar en el servicio
const capitaljob_service_1 = require("../services/capitaljob.service");
const supabaseClient_1 = require("../config/supabaseClient");
const startCapitalJob = () => {
    // Programación: Todos los días a las 00:00 (Medianoche)
    node_cron_1.default.schedule('0 0 * * *', async () => {
        logger_1.logger.info('⏰ CRON JOB: Iniciando verificación de cierre de caja...');
        try {
            const { data: empresas, error } = await supabaseClient_1.supabase.from('Empresa').select('IdEmpresa');
            if (error || !empresas) {
                logger_1.logger.error("❌ CRON JOB ERROR: No se pudieron obtener las empresas.");
                return;
            }
            for (const empresa of empresas) {
                try {
                    // Llamamos a la lógica "Lazy" que verifica si hace falta crearla para esta empresa
                    const resultado = await (0, capitaljob_service_1.checkAndCreateConsolidation)(empresa.IdEmpresa);
                    if (resultado) {
                        logger_1.logger.info(`✅ CRON JOB: Caja asegurada para Empresa ${empresa.IdEmpresa} (ID: ${resultado.IdConsolidacion})`);
                    }
                }
                catch (e) {
                    logger_1.logger.error(`❌ CRON JOB ERROR (Empresa ${empresa.IdEmpresa}):`, e.message);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('❌ CRON JOB MAIN ERROR:', error.message);
        }
    });
    logger_1.logger.info("✅ Cron Job scheduler iniciado (00:00 Daily).");
};
exports.startCapitalJob = startCapitalJob;
