import cron from 'node-cron';
// Importamos la función de lógica que acabamos de arreglar en el servicio
import { checkAndCreateConsolidation } from '../services/capitaljob.service';

export const startCapitalJob = () => {
    
    // Programación: Todos los días a las 00:00 (Medianoche)
    cron.schedule('0 0 * * *', async () => { 
        console.log('⏰ CRON JOB: Iniciando verificación de cierre de caja...');
        
        try {
            // Llamamos a la lógica "Lazy" que verifica si hace falta crearla
            const resultado = await checkAndCreateConsolidation();
            
            if (resultado) {
                console.log(`✅ CRON JOB: Caja del día asegurada (ID: ${resultado.IdConsolidacion})`);
            }
        } catch (error: any) {
            console.error('❌ CRON JOB ERROR:', error.message);
        }
    });

    console.log("✅ Cron Job scheduler iniciado (00:00 Daily).");
};