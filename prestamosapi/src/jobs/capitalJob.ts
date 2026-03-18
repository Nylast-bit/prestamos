import cron from 'node-cron';
// Importamos la función de lógica que acabamos de arreglar en el servicio
import { checkAndCreateConsolidation } from '../services/capitaljob.service';
import { supabase } from '../config/supabaseClient';

export const startCapitalJob = () => {

    // Programación: Todos los días a las 00:00 (Medianoche)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ CRON JOB: Iniciando verificación de cierre de caja...');

        try {
            const { data: empresas, error } = await supabase.from('Empresa').select('IdEmpresa');
            if (error || !empresas) {
                console.error("❌ CRON JOB ERROR: No se pudieron obtener las empresas.");
                return;
            }

            for (const empresa of empresas) {
                try {
                    // Llamamos a la lógica "Lazy" que verifica si hace falta crearla para esta empresa
                    const resultado = await checkAndCreateConsolidation(empresa.IdEmpresa);

                    if (resultado) {
                        console.log(`✅ CRON JOB: Caja asegurada para Empresa ${empresa.IdEmpresa} (ID: ${resultado.IdConsolidacion})`);
                    }
                } catch (e: any) {
                    console.error(`❌ CRON JOB ERROR (Empresa ${empresa.IdEmpresa}):`, e.message);
                }
            }
        } catch (error: any) {
            console.error('❌ CRON JOB MAIN ERROR:', error.message);
        }
    });

    console.log("✅ Cron Job scheduler iniciado (00:00 Daily).");
};