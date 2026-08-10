import { supabase } from "../config/supabaseClient";
import { logger } from "../utils/logger";

export const calcularMoraService = async (idPrestamo: number, idEmpresa: number) => {
  const { data: prestamo, error } = await supabase
    .from('Prestamo')
    .select('*, Cliente(Nombre)')
    .eq('IdPrestamo', idPrestamo)
    .eq('IdEmpresa', idEmpresa)
    .single();

  if (error || !prestamo) {
    throw new Error('Préstamo no encontrado');
  }

  if (prestamo.Estado === 'Pagado') {
    return prestamo;
  }

  let cuotasEnMora = prestamo.CuotasEnMora || 0;
  let montoMoraAcumulado = prestamo.MontoMoraAcumulado || 0;
  let moraCongelada = prestamo.MoraCongelada || false;

  if (moraCongelada) {
    return prestamo; // Si la mora está congelada, no calculamos más
  }

  let nuevaMoraAgregada = 0;
  let tablaPagosActualizada = false;
  let tabla;

  if (prestamo.TablaPagos) {
    try {
      tabla = JSON.parse(prestamo.TablaPagos);
      const hoy = new Date();
      
      tabla.forEach((cuota: any) => {
        if (!cuota.pagado && !cuota.moraCalculada) {
          let fechaVenc = null;
          if (cuota.fechaVencimiento) {
            fechaVenc = new Date(cuota.fechaVencimiento);
          } else if (prestamo.FechaInicio && prestamo.ModalidadPago) {
            const date = new Date(prestamo.FechaInicio);
            date.setUTCHours(12, 0, 0, 0);
            const modalidad = prestamo.ModalidadPago.toLowerCase();
            const n = Number(cuota.numeroCuota || 1);
            
            if (modalidad === 'diario') date.setDate(date.getDate() + n);
            else if (modalidad === 'semanal') date.setDate(date.getDate() + (n * 7));
            else if (modalidad === 'quincenal') date.setDate(date.getDate() + (n * 15));
            else if (modalidad === 'mensual') date.setMonth(date.getMonth() + n);
            else if (modalidad === 'anual') date.setFullYear(date.getFullYear() + n);
            else date.setMonth(date.getMonth() + n);
            
            fechaVenc = date;
          }

          if (fechaVenc) {
            const diffTime = Math.abs(hoy.getTime() - fechaVenc.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (hoy > fechaVenc && diffDays > 7) {
            // Asumimos 5% del capital como mora (o tasa fija)
            const tasaMora = 0.05; 
            const capitalCuota = cuota.capital || (prestamo.MontoCuota || 0); // fallback al MontoCuota si es flat
            const montoMoraCuota = capitalCuota * tasaMora;
            
            cuota.moraCalculada = true;
            cuota.montoMora = montoMoraCuota;
            nuevaMoraAgregada += montoMoraCuota;
            cuotasEnMora++;
            tablaPagosActualizada = true;

            // Log de la mora
            supabase.from('MoraLog').insert({
              IdPrestamo: idPrestamo,
              Accion: 'CALCULO',
              MontoMora: montoMoraCuota,
              Detalle: `Mora de cuota #${cuota.numeroCuota}`,
              Fecha: hoy.toISOString()
            }).then();
          }
          }
        }
      });
    } catch (e) {
      logger.error('Error parseando TablaPagos', e);
    }
  }

  if (cuotasEnMora >= 3) {
    moraCongelada = true;
    supabase.from('MoraLog').insert({
      IdPrestamo: idPrestamo,
      Accion: 'CONGELAMIENTO',
      MontoMora: 0,
      Detalle: `Mora congelada por alcanzar 3 cuotas en mora`,
      Fecha: new Date().toISOString()
    }).then();
  }

  if (tablaPagosActualizada || moraCongelada || nuevaMoraAgregada > 0) {
    const payload: any = {
      MontoMoraAcumulado: montoMoraAcumulado + nuevaMoraAgregada,
      CuotasEnMora: cuotasEnMora,
      MoraCongelada: moraCongelada,
      MoraPerdonada: false
    };

    if (tablaPagosActualizada) {
      payload.TablaPagos = JSON.stringify(tabla);
    }

    await supabase.from('Prestamo').update(payload).eq('IdPrestamo', idPrestamo);
    
    return { ...prestamo, ...payload };
  }

  return prestamo;
};

export const perdonarMoraService = async (idPrestamo: number, idEmpresa: number, usuario: string) => {
  const { data: prestamo, error } = await supabase
    .from('Prestamo')
    .select('MontoMoraAcumulado, CuotasEnMora')
    .eq('IdPrestamo', idPrestamo)
    .eq('IdEmpresa', idEmpresa)
    .single();

  if (error || !prestamo) throw new Error('Préstamo no encontrado');

  const { error: updateError } = await supabase.from('Prestamo').update({
    MontoMoraAcumulado: 0,
    MoraPerdonada: true
  }).eq('IdPrestamo', idPrestamo);

  if (updateError) throw new Error('Error al perdonar mora: ' + updateError.message);

  await supabase.from('MoraLog').insert({
    IdPrestamo: idPrestamo,
    Accion: 'PERDON',
    MontoMora: prestamo.MontoMoraAcumulado,
    Detalle: `Mora perdonada por ${usuario}`,
    Fecha: new Date().toISOString()
  });

  return { success: true };
};

export const getHistorialMoraService = async (idPrestamo: number, idEmpresa: number) => {
  const { data: prestamo } = await supabase.from('Prestamo').select('IdPrestamo').eq('IdPrestamo', idPrestamo).eq('IdEmpresa', idEmpresa).single();
  if (!prestamo) throw new Error('Préstamo no encontrado');

  const { data, error } = await supabase
    .from('MoraLog')
    .select('*')
    .eq('IdPrestamo', idPrestamo)
    .order('Fecha', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const getMorasPendientesService = async (idEmpresa: number) => {
  const { data, error } = await supabase
    .from('Prestamo')
    .select('*, Cliente(Nombre)')
    .eq('IdEmpresa', idEmpresa)
    .gt('MontoMoraAcumulado', 0)
    .in('Estado', ['Activo', 'Pagado']); // Puede haber mora de préstamos ya pagados si el capital se saldó pero no la mora

  if (error) throw new Error(error.message);
  return data || [];
};

export const verificarMoraPendienteCliente = async (idCliente: number, idEmpresa: number) => {
  const { data, error } = await supabase
    .from('Prestamo')
    .select('MontoMoraAcumulado, MoraPerdonada')
    .eq('IdCliente', idCliente)
    .eq('IdEmpresa', idEmpresa)
    .gt('MontoMoraAcumulado', 0);

  if (error) throw new Error(error.message);
  
  const tieneMora = data && data.some(p => p.MoraPerdonada !== true);
  const totalMora = data ? data.reduce((acc, curr) => acc + (curr.MoraPerdonada ? 0 : Number(curr.MontoMoraAcumulado)), 0) : 0;

  return { tieneMora, totalMora };
};
