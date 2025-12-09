// src/jobs/capitalJob.ts
import cron from 'node-cron';
import * as capitalJobService from '../services/capitaljob.service'; // Nuevo servicio
import * as registroConsolidacionService from '../services/registroconsolidacion.service'; // Para los registros

export const startCapitalJob = () => {
    // Se ejecuta todos los días a las 00:00 (medianoche)
    cron.schedule('0 0 * * *', async () => { 
        console.log('🤖 Corriendo trabajo de cierre de capital...');
        
        try {
            // 1. VERIFICAR Y CREAR NUEVA CONSOLIDACIÓN
            const nuevaConsolidacion = await capitalJobService.checkAndCreateConsolidation();

            if (nuevaConsolidacion) {
                console.log(`✅ Nueva Consolidación ID: ${nuevaConsolidacion.IdConsolidacion} creada.`);
                
                // 2. PROCESAR GASTOS FIJOS (Se haría aquí en el siguiente paso)
                // await capitalJobService.processFixedExpenses(nuevaConsolidacion.IdConsolidacion);

            } else {
                console.log('⏩ No es día de cierre. Tarea completada.');
            }

        } catch (error: any) {
            console.error('❌ Error fatal en el Job de Capital:', error.message);
        }
    });
};