// src/services/consolidacionCapital.service.ts
import { supabase } from "../config/supabaseClient";

// Define un tipo para los datos de entrada
interface ConsolidacionCapitalData {
  FechaInicio?: string | Date | null;
  FechaFin?: string | Date | null;
  CapitalEntrante?: number;
  CapitalSaliente?: number;
  Observaciones?: string | null;
  FechaGeneracion?: string | Date;
}

interface GastoFijo {
    IdGasto: number;
    Nombre: string;
    Monto: number;
    Frecuencia: string; // 'Mensual' | 'Quincenal'
    Dia1: number;
    Dia2?: number | null;
    Activo: boolean;
}

// Función auxiliar para verificar si un día específico cae dentro del rango de fechas
const fechaEstaEnRango = (diaPago: number, inicio: Date, fin: Date): Date | null => {
    // Caso 1: Verificar si el día cae en el MES y AÑO de la fecha de inicio
    const fechaCandidata1 = new Date(inicio.getFullYear(), inicio.getMonth(), diaPago);
    fechaCandidata1.setHours(12, 0, 0, 0); // Ponemos medio día para evitar problemas de timezone

    if (fechaCandidata1 >= inicio && fechaCandidata1 <= fin) {
        return fechaCandidata1;
    }

    // Caso 2: Verificar si el día cae en el MES y AÑO de la fecha de fin (cuando cruza de mes)
    // Ejemplo: Rango 23 Feb - 7 Mar. Si el gasto es el día 2, caerá en Marzo.
    const fechaCandidata2 = new Date(fin.getFullYear(), fin.getMonth(), diaPago);
    fechaCandidata2.setHours(12, 0, 0, 0);

    if (fechaCandidata2 >= inicio && fechaCandidata2 <= fin) {
        return fechaCandidata2;
    }

    return null;
};

const procesarGastosFijos = async (idConsolidacion: number, fechaInicioISO: string, fechaFinISO: string) => {
    const inicio = new Date(fechaInicioISO);
    const fin = new Date(fechaFinISO);
    
    const { data: gastos, error } = await supabase
        .from("GastoFijo")
        .select("*")
        .eq("Activo", true);

    if (error || !gastos) return;

    const nuevosRegistros = [];

    for (const gasto of gastos) {
        // Normalizamos la palabra: la pasamos a minúscula y le quitamos espacios extra
        const frecuencia = (gasto.Frecuencia || "").toLowerCase().trim();
        
        // A. Verificar Dia 1 (Siempre se verifica)
        const fechaPago1 = fechaEstaEnRango(gasto.Dia1, inicio, fin);
        if (fechaPago1) {
            nuevosRegistros.push({
                IdConsolidacion: idConsolidacion,
                FechaRegistro: fechaPago1.toISOString(),
                Monto: gasto.Monto,
                TipoRegistro: "Egreso",
                Estado: "Pendiente",
                Descripcion: `Gasto Fijo: ${gasto.Nombre}`
            });
        }

        // B. Verificar Dia 2 (Solo si tiene día 2 y la palabra normalizada coincide)
        if (gasto.Dia2 && (frecuencia === 'quincenal' || frecuencia === 'semanal')) {
            const fechaPago2 = fechaEstaEnRango(gasto.Dia2, inicio, fin);
            if (fechaPago2) {
                nuevosRegistros.push({
                    IdConsolidacion: idConsolidacion,
                    FechaRegistro: fechaPago2.toISOString(),
                    Monto: gasto.Monto,
                    TipoRegistro: "Egreso",
                    Estado: "Pendiente",
                    Descripcion: `Gasto Fijo: ${gasto.Nombre} (2da Cuota)`
                });
            }
        }
    }

    if (nuevosRegistros.length > 0) {
        await supabase.from("RegistroConsolidacion").insert(nuevosRegistros);
    }
};

// --- 1. HELPER DE FECHAS (Tu lógica 8-22 / 23-7) ---
const getRangoConsolidacion = (fecha: Date) => {
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    const anio = fecha.getFullYear();
    let fechaInicio: Date, fechaFin: Date;

    if (dia >= 8 && dia <= 22) {
        fechaInicio = new Date(anio, mes, 8);
        fechaFin = new Date(anio, mes, 22);
    } else if (dia >= 23) {
        fechaInicio = new Date(anio, mes, 23);
        fechaFin = new Date(anio, mes + 1, 7); 
    } else {
        fechaInicio = new Date(anio, mes - 1, 23);
        fechaFin = new Date(anio, mes, 7);
    }
    
    fechaInicio.setHours(0, 0, 0, 0);
    fechaFin.setHours(23, 59, 59, 999);

    return { inicioISO: fechaInicio.toISOString(), finISO: fechaFin.toISOString() };
};

// --- 2. FUNCIÓN PRINCIPAL ---
export const getConsolidacionActivaId = async (fechaRegistro: string): Promise<number> => {
    
    // A. ¿YA EXISTE LA CONSOLIDACIÓN?
    const { data: consolidacion } = await supabase
        .from("ConsolidacionCapital")
        .select("IdConsolidacion") 
        .lte("FechaInicio", fechaRegistro) 
        .gte("FechaFin", fechaRegistro)    
        .limit(1)
        .maybeSingle(); 

    if (consolidacion) {
        return consolidacion.IdConsolidacion;
    }

    // B. NO EXISTE -> CREARLA + ARRASTRAR SALDO
    console.log("⚠️ No hay consolidación activa. Creando nueva y arrastrando saldo...");
    
    const fechaObj = new Date(fechaRegistro);
    const { inicioISO, finISO } = getRangoConsolidacion(fechaObj);

    // 1. Buscamos la consolidación INMEDIATAMENTE ANTERIOR para sacar el balance
    const { data: consolidacionAnterior } = await supabase
        .from("ConsolidacionCapital")
        .select("CapitalEntrante, CapitalSaliente") // Traemos los montos para calcular
        .lt("FechaInicio", inicioISO) // Que haya empezado antes
        .order("FechaInicio", { ascending: false }) // La más reciente
        .limit(1)
        .maybeSingle();

    let balanceAnterior = 0;
    if (consolidacionAnterior) {
        // Cálculo simple: Lo que entró menos lo que salió
        balanceAnterior = Number(consolidacionAnterior.CapitalEntrante) - Number(consolidacionAnterior.CapitalSaliente);
        console.log(`💰 Balance anterior encontrado: ${balanceAnterior}`);
    }

    // 2. Insertamos la Nueva Consolidación (Padre)
    const { data: nuevaConsolidacion, error: errorCreate } = await supabase
        .from("ConsolidacionCapital")
        .insert({
            FechaInicio: inicioISO,
            FechaFin: finISO,
            FechaGeneracion: new Date().toISOString(),
            CapitalEntrante: 0, 
            CapitalSaliente: 0
        })
        .select("IdConsolidacion")
        .single();

    if (errorCreate || !nuevaConsolidacion) {
        throw new Error(`Error creando consolidación: ${errorCreate?.message}`);
    }

    const nuevoId = nuevaConsolidacion.IdConsolidacion;

    // 3. 🚨 REGISTRAR EL BALANCE ANTERIOR COMO UNA TRANSACCIÓN 🚨
    // Si el balance es distinto de 0, creamos el registro para que cuadre la caja
    if (balanceAnterior !== 0) {
        const esPositivo = balanceAnterior > 0;
        
        const { error: errorBalance } = await supabase
            .from("RegistroConsolidacion")
            .insert({
                IdConsolidacion: nuevoId,
                FechaRegistro: new Date().toISOString(), // Se registra al momento de crearla
                Monto: Math.abs(balanceAnterior), // Siempre positivo en el monto
                TipoRegistro: esPositivo ? "Ingreso" : "Egreso", // El signo lo define el tipo
                Estado: "Depositado", // Este nace completado porque es un arrastre
                Descripcion: `Balance Inicial (Arrastre periodo anterior)`
            });

        if (errorBalance) {
            console.error("Error crítico insertando balance inicial:", errorBalance);
            // No detenemos el proceso, pero queda el log
        } else {
            console.log("✅ Registro de balance inicial creado correctamente.");
        }
    }

    try {
        // Le pasamos el ID nuevo y las fechas del rango calculado
        await procesarGastosFijos(nuevoId, inicioISO, finISO);
    } catch (e) {
        console.error("Error no bloqueante procesando gastos fijos:", e);
    }

    return nuevoId;
};

// --- CREAR ---
export const createConsolidacionCapitalService = async (data: ConsolidacionCapitalData) => {
  // Nota: Transformamos las fechas antes de enviar a Supabase.
  const { data: nuevo, error } = await supabase
    .from("VistaConsolidacionCapital")
    .insert({
      FechaInicio: data.FechaInicio ? new Date(data.FechaInicio).toISOString() : null,
      FechaFin: data.FechaFin ? new Date(data.FechaFin).toISOString() : null,
      CapitalEntrante: data.CapitalEntrante,
      CapitalSaliente: data.CapitalSaliente,
      Observaciones: data.Observaciones || null,
      FechaGeneracion: data.FechaGeneracion
            ? new Date(data.FechaGeneracion).toISOString()
            : new Date(data.FechaGeneracion!).toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Error en createConsolidacionCapitalService:", error.message);
    throw new Error(`Error creando consolidación: ${error.message}`);
  }
  return nuevo;
};

export const crearConsolidacionAutomatica = async (fechaRegistro: string) => {
    const fechaObj = new Date(fechaRegistro);
    const { inicioISO, finISO } = getRangoConsolidacion(fechaObj);

    console.log(`⏳ Creando consolidación automática: ${inicioISO} al ${finISO}`);

    // A. BUSCAR EL SALDO DE LA CONSOLIDACIÓN ANTERIOR
    // Buscamos la consolidación cuya FechaFin sea inmediatamente anterior a nuestra nueva FechaInicio
    const { data: consolidacionAnterior, error: errorAnt } = await supabase
        .from("ConsolidacionCapital") // O la tabla física donde guardas los datos
        .select("SaldoFinalCalculado") // O como se llame tu campo de saldo final
        .lt("FechaInicio", inicioISO) // Que haya empezado antes que esta
        .order("FechaInicio", { ascending: false }) // La más reciente de las anteriores
        .limit(1)
        .maybeSingle();

    let montoInicial = 0;

    if (consolidacionAnterior) {
        montoInicial = consolidacionAnterior.SaldoFinalCalculado || 0;
        console.log(`💰 Saldo arrastrado de la anterior: ${montoInicial}`);
    } else {
        console.log("⚠️ No hay consolidación anterior. Iniciando con Saldo 0.");
    }

    // B. CREAR LA NUEVA CONSOLIDACIÓN
    const { data: nuevaConsolidacion, error: errorCreate } = await supabase
        .from("ConsolidacionCapital") // Asegúrate que esta sea la tabla INSERTABLE
        .insert({
            FechaInicio: inicioISO,
            FechaFin: finISO,
            Estado: "Abierta",
            MontoInicial: montoInicial, // <--- AQUÍ ARRASTRAMOS EL SALDO
            FechaGeneracion: new Date().toISOString() // Fecha de creación del registro
        })
        .select("IdConsolidacion")
        .single();

    if (errorCreate || !nuevaConsolidacion) {
        throw new Error(`Error creando consolidación automática: ${errorCreate?.message}`);
    }

    return nuevaConsolidacion.IdConsolidacion;
};

// --- OBTENER TODAS ---
export const getAllConsolidacionesCapitalService = async () => {
  // Traducción de findMany con include: Registros (Relación uno-a-muchos)
  const { data: lista, error } = await supabase
    .from("VistaConsolidacionCapital")
    .select(`
      *,
      Registros:RegistroConsolidacion (*)
    `);

  if (error) {
    console.error("Error en getAllConsolidacionesCapitalService:", error.message);
    throw new Error(`Error obteniendo consolidaciones: ${error.message}`);
  }
  return lista;
};

// --- OBTENER POR ID ---
export const getConsolidacionCapitalByIdService = async (id: number) => {
  // Traducción de findUnique con include: Registros
  const { data: consolidacion, error } = await supabase
    .from("VistaConsolidacionCapital")
    .select(`
        *,
        Registros:RegistroConsolidacion (*)
    `)
    .eq("IdConsolidacion", id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
        console.error("Error buscando consolidación:", error.message);
        throw new Error(`Error buscando consolidación: ${error.message}`);
    }
  }

  if (!consolidacion) {
    throw new Error("Consolidación no encontrada");
  }

  return consolidacion;
};

// --- ACTUALIZAR ---
export const updateConsolidacionCapitalService = async (id: number, data: ConsolidacionCapitalData) => {
  // Transformación de fechas para el update
  const { data: actualizado, error } = await supabase
    .from("VistaConsolidacionCapital")
    .update({
        FechaInicio: data.FechaInicio ? new Date(data.FechaInicio).toISOString() : null,
        FechaFin: data.FechaFin ? new Date(data.FechaFin).toISOString() : null,
        CapitalEntrante: data.CapitalEntrante,
        CapitalSaliente: data.CapitalSaliente,
        Observaciones: data.Observaciones || null,
        FechaGeneracion: data.FechaGeneracion
            ? new Date(data.FechaGeneracion).toISOString()
            : new Date(data.FechaGeneracion!).toISOString()
    })
    .eq("IdConsolidacion", id)
    .select()
    .single();

  if (error) {
    console.error("Error en updateConsolidacionCapitalService:", error.message);
    throw new Error(`Error actualizando consolidación: ${error.message}`);
  }
  
  if (!actualizado) {
    throw new Error("Consolidación no encontrada para actualizar");
  }

  return actualizado;
};

// --- ELIMINAR CON DEPENDENCIA ---
export const deleteConsolidacionCapitalService = async (id: number) => {
    
    // 1. Eliminar los registros hijos de RegistroConsolidacion
    const { error: errorRegistro } = await supabase
        .from("RegistroConsolidacion")
        .delete()
        .eq("IdConsolidacion", id);

    if (errorRegistro) {
        console.error(`Error eliminando registros de consolidación para ${id}:`, errorRegistro.message);
        throw new Error(`Error eliminando registros dependientes: ${errorRegistro.message}`);
    }

    // 🚨 2. ELIMINAR LOS REGISTROS HIJOS DE GastoFijoRegistro (La nueva dependencia)
    const { error: errorGastoFijo } = await supabase
        .from("GastoFijoRegistro")
        .delete()
        .eq("IdConsolidacion", id);

    if (errorGastoFijo) {
        console.error(`Error eliminando GastoFijoRegistro para ${id}:`, errorGastoFijo.message);
        throw new Error(`Error eliminando registros de gastos fijos dependientes: ${errorGastoFijo.message}`);
    }


    // 3. Eliminar la ConsolidacionCapital padre
    const { data: deleted, error: errorConsolidacion } = await supabase
        .from("ConsolidacionCapital")
        .delete()
        .eq("IdConsolidacion", id)
        .select()
        .maybeSingle();

    if (errorConsolidacion) {
        console.error("Error en deleteConsolidacionCapitalService:", errorConsolidacion.message);
        throw new Error(`Error eliminando consolidación: ${errorConsolidacion.message}`);
    }
    
    if (!deleted) {
        throw new Error("Consolidación no encontrada para eliminar");
    }

    return { message: "Consolidación de capital y todos sus registros dependientes eliminados" };
};

export const getResumenConsolidacionActivaService = async () => {
  // 1. Usamos tu función maestra para obtener el ID de la quincena actual.
  // Le pasamos la fecha de hoy. Si no existe, tu función la va a crear sola.
  const fechaHoy = new Date().toISOString();
  const idConsolidacionActiva = await getConsolidacionActivaId(fechaHoy);

  // 2. Buscamos las fechas de esa consolidación para mostrarlas en el Dashboard
  const { data: consolidacion, error: errorConsolidacion } = await supabase
    .from("ConsolidacionCapital")
    .select("FechaInicio, FechaFin")
    .eq("IdConsolidacion", idConsolidacionActiva)
    .single();

  if (errorConsolidacion || !consolidacion) {
    throw new Error("Error obteniendo detalles de la consolidación activa");
  }

  // 3. Buscamos TODOS los registros atados a este ID (pagos, gastos, arrastre de saldo)
  const { data: registros, error: errorRegistros } = await supabase
    .from("RegistroConsolidacion")
    .select("Monto, TipoRegistro")
    .eq("IdConsolidacion", idConsolidacionActiva);

  if (errorRegistros) {
    throw new Error("Error obteniendo los registros de la consolidación");
  }

  // 4. Sumamos ingresos y egresos
  let ingresosTotal = 0;
  let egresosTotal = 0;

  if (registros) {
    registros.forEach((reg) => {
      const tipo = (reg.TipoRegistro || "").toLowerCase().trim();
      if (tipo === "ingreso") {
        ingresosTotal += Number(reg.Monto);
      } else if (tipo === "egreso") {
        egresosTotal += Number(reg.Monto);
      }
    });
  }

  // 5. Devolvemos la data lista para pintar en el Dashboard
  return {
    ingresosTotal,
    egresosTotal,
    FechaInicio: consolidacion.FechaInicio,
    FechaFin: consolidacion.FechaFin,
    IdConsolidacion: idConsolidacionActiva
  };
};