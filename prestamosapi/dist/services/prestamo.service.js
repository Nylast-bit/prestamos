"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.countPrestamosActivosByPrestatarioService = exports.obtenerRangoCuotasService = exports.calcularTasaPorCuotaService = exports.opcionesSimularPrestamoService = exports.simularPrestamoService = exports.getPrestamoConDetallesService = exports.deletePrestamoService = exports.updatePrestamoService = exports.getPrestamoByIdService = exports.getPrestamosService = exports.createPrestamoService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const capitalJobService = __importStar(require("./capitaljob.service"));
// ==========================================
// 1. CRUD BÁSICO (Ya lo tenías, lo mantengo)
// ==========================================
const createPrestamoService = async (data, idEmpresa, isSuperAdmin = false) => {
    if (!isSuperAdmin) {
        const { data: suscripcion } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .select('Plan:IdPlan (LimitePrestamos)')
            .eq('IdEmpresa', idEmpresa)
            .eq('Estado', 'Activa')
            .order('IdSuscripcion', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (!suscripcion || !suscripcion.Plan) {
            throw new Error('La empresa no cuenta con una suscripción activa.');
        }
        const plan = Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan;
        const { count } = await supabaseClient_1.supabase
            .from('Prestamo')
            .select('*', { count: 'exact', head: true })
            .eq('IdEmpresa', idEmpresa)
            .eq('Estado', 'Activo');
        if ((count || 0) >= plan.LimitePrestamos) {
            throw new Error('Límite de préstamos activos de su plan excedido.');
        }
    }
    const hoy = new Date().toISOString();
    // 1. INTENTAR OBTENER CAJA ABIERTA
    let { data: consolidacion } = await supabaseClient_1.supabase
        .from("ConsolidacionCapital")
        .select("IdConsolidacion")
        .eq("IdEmpresa", idEmpresa)
        .lte("FechaInicio", hoy)
        .gte("FechaFin", hoy)
        .order("FechaInicio", { ascending: false })
        .limit(1)
        .maybeSingle();
    // 🚨 PLAN DE EMERGENCIA: SI NO HAY CAJA, LA CREAMOS AHORA MISMO
    if (!consolidacion) {
        logger_1.logger.info("⚠️ Caja cerrada detectada al crear préstamo. Ejecutando apertura de emergencia...");
        try {
            // Llamamos al servicio que creamos antes
            const nuevaCaja = await capitalJobService.checkAndCreateConsolidation(idEmpresa);
            if (nuevaCaja && nuevaCaja.IdConsolidacion) {
                consolidacion = { IdConsolidacion: nuevaCaja.IdConsolidacion };
                logger_1.logger.info("✅ Caja de emergencia creada y asignada.");
            }
        }
        catch (e) {
            logger_1.logger.error("❌ Falló la apertura de emergencia:", e);
        }
    }
    // Si después del intento sigue sin haber consolidación, ahí sí lanzamos error
    if (!consolidacion) {
        throw new Error("ERROR CRÍTICO: No se pudo abrir la caja del día automáticamente. Verifica el sistema.");
    }
    // 2. Obtener Cliente
    const { data: cliente } = await supabaseClient_1.supabase
        .from("Cliente")
        .select("Nombre")
        .eq("IdCliente", data.IdCliente)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (!cliente)
        throw new Error("Cliente no encontrado.");
    // 3. Crear Préstamo
    const { data: nuevoPrestamo, error: errorPrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .insert(data)
        .select()
        .single();
    if (errorPrestamo)
        throw new Error(errorPrestamo.message);
    // 4. Registrar Salida de dinero (Egreso)
    const { error: errorRegistro } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .insert({
        IdConsolidacion: consolidacion.IdConsolidacion,
        FechaRegistro: hoy,
        TipoRegistro: "Egreso",
        Estado: "Prestado",
        Descripcion: `Préstamo - ${cliente.Nombre}`,
        Monto: data.MontoPrestado,
    });
    if (errorRegistro)
        throw new Error(`Error contable: ${errorRegistro.message}`);
    return nuevoPrestamo;
};
exports.createPrestamoService = createPrestamoService;
const getPrestamosService = async (idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select(`*, Cliente(Nombre), Prestatario(Nombre)`)
        .eq("IdEmpresa", idEmpresa)
        .order("IdPrestamo", { ascending: false });
    if (error)
        throw new Error(error.message);
    return data.map((p) => ({
        ...p,
        clienteNombre: p.Cliente?.Nombre || 'N/A',
        prestatarioNombre: p.Prestatario?.Nombre || 'N/A'
    }));
};
exports.getPrestamosService = getPrestamosService;
const getPrestamoByIdService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select(`*, Cliente(*), Prestatario(*)`)
        .eq("IdPrestamo", id)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (error)
        throw new Error(error.message);
    return data;
};
exports.getPrestamoByIdService = getPrestamoByIdService;
const updatePrestamoService = async (id, idEmpresa, data) => {
    const { data: updated, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .update(data)
        .eq("IdPrestamo", id)
        .eq("IdEmpresa", idEmpresa)
        .select()
        .single();
    if (error)
        throw new Error(error.message);
    return updated;
};
exports.updatePrestamoService = updatePrestamoService;
const deletePrestamoService = async (id, idEmpresa) => {
    // Verificamos propiedad de la empresa primero
    const prest = await (0, exports.getPrestamoByIdService)(id, idEmpresa);
    if (!prest)
        throw new Error("No tienes permisos o no existe");
    // Primero borramos registros hijos para evitar errores de FK si no tienes Cascade
    await supabaseClient_1.supabase.from("Pago").delete().eq("IdPrestamo", id);
    await supabaseClient_1.supabase.from("Volantes").delete().eq("IdPrestamo", id);
    // Borrar préstamo
    const { error } = await supabaseClient_1.supabase.from("Prestamo").delete().eq("IdPrestamo", id);
    if (error)
        throw new Error(error.message);
    return true;
};
exports.deletePrestamoService = deletePrestamoService;
// ==========================================
// 2. FUNCIONES AVANZADAS (LAS QUE FALTABAN)
// ==========================================
// A. Obtener detalles completos para eliminar
const getPrestamoConDetallesService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select(`
        IdPrestamo, MontoPrestado, Estado,
        Cliente (Nombre),
        Prestatario (Nombre),
        Pagos (IdPago),
        Acuerdos (IdAcuerdo),
        PagosPersonalizados (IdPagoPersonalizado),
        Volantes (IdVolante)
    `)
        .eq("IdPrestamo", id)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (error)
        throw new Error(error.message);
    if (!data)
        throw new Error("Préstamo no encontrado");
    return data;
};
exports.getPrestamoConDetallesService = getPrestamoConDetallesService;
// B. Lógica de Simulación Matemática
const simularPrestamoService = (params) => {
    const { monto, tasaInteres, numeroCuotas, tipoCalculo } = params;
    let cuotas = [];
    let montoCuota = 0;
    let totalInteres = 0;
    let totalPagar = 0;
    if (tipoCalculo === "amortizable") {
        const i = tasaInteres / 100;
        if (i === 0) {
            montoCuota = monto / numeroCuotas;
        }
        else {
            montoCuota = monto * ((i * Math.pow(1 + i, numeroCuotas)) / (Math.pow(1 + i, numeroCuotas) - 1));
        }
        let saldo = monto;
        totalPagar = montoCuota * numeroCuotas;
        totalInteres = totalPagar - monto;
        for (let j = 1; j <= numeroCuotas; j++) {
            const interesPeriodo = saldo * i;
            const capitalPeriodo = montoCuota - interesPeriodo;
            let nuevoSaldo = saldo - capitalPeriodo;
            if (j === numeroCuotas)
                nuevoSaldo = 0; // Ajuste final
            cuotas.push({
                numeroCuota: j,
                cuota: Number(montoCuota.toFixed(2)),
                interes: Number(interesPeriodo.toFixed(2)),
                capital: Number(capitalPeriodo.toFixed(2)),
                saldo: nuevoSaldo > 0 ? Number(nuevoSaldo.toFixed(2)) : 0
            });
            saldo = nuevoSaldo;
        }
    }
    else {
        // FLAT
        const interesPorCuota = monto * (tasaInteres / 100);
        const capitalPorCuota = monto / numeroCuotas;
        montoCuota = capitalPorCuota + interesPorCuota;
        totalInteres = interesPorCuota * numeroCuotas;
        totalPagar = monto + totalInteres;
        let saldo = monto;
        for (let j = 1; j <= numeroCuotas; j++) {
            saldo -= capitalPorCuota;
            cuotas.push({
                numeroCuota: j,
                cuota: Number(montoCuota.toFixed(2)),
                interes: Number(interesPorCuota.toFixed(2)),
                capital: Number(capitalPorCuota.toFixed(2)),
                saldo: saldo > 0 ? Number(saldo.toFixed(2)) : 0
            });
        }
    }
    return {
        montoSolicitado: monto,
        tasaInteres,
        numeroCuotas,
        tipoCalculo,
        montoCuota: Number(montoCuota.toFixed(2)),
        montoTotalInteres: Number(totalInteres.toFixed(2)),
        montoTotalAPagar: Number(totalPagar.toFixed(2)),
        tablaAmortizacion: cuotas
    };
};
exports.simularPrestamoService = simularPrestamoService;
// C. Opciones de Simulación (Generar varios escenarios)
const opcionesSimularPrestamoService = (params) => {
    // Generamos 3 opciones: la pedida, +2 cuotas, +4 cuotas (ejemplo)
    const opcionesCuotas = [params.numeroCuotas, params.numeroCuotas + 2, params.numeroCuotas + 4];
    const resultados = opcionesCuotas.map(n => {
        return (0, exports.simularPrestamoService)({
            monto: params.monto,
            tasaInteres: params.tasaInteres,
            numeroCuotas: n,
            tipoCalculo: 'capital+interes' // Por defecto para esta vista rápida
        });
    });
    return resultados;
};
exports.opcionesSimularPrestamoService = opcionesSimularPrestamoService;
// D. Calcular Tasa Inversa (Dado un monto de cuota, hallar el %)
const calcularTasaPorCuotaService = (params) => {
    const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = params;
    // Validación inicial: La cuota debe cubrir al menos el capital
    const capitalMinimo = monto / numeroCuotas;
    if (cuotaDeseada <= capitalMinimo) {
        throw new Error("La cuota deseada es muy baja, no cubre el capital.");
    }
    let tasaEncontrada = 0;
    if (tipoCalculo === 'capital+interes') {
        // Fórmula directa: Cuota = (Monto/n) + (Monto * Tasa/100)
        // Despejando Tasa:
        // InteresMonto = Cuota - (Monto/n)
        // Tasa = (InteresMonto / Monto) * 100
        const interesMonto = cuotaDeseada - capitalMinimo;
        tasaEncontrada = (interesMonto / monto) * 100;
    }
    else {
        // Amortizable (Newton-Raphson o Búsqueda Binaria)
        // Usaremos búsqueda binaria simple entre 0% y 100% mensual
        let low = 0;
        let high = 100;
        let epsilon = 0.001; // Precisión
        for (let i = 0; i < 100; i++) { // Max 100 iteraciones
            let mid = (low + high) / 2;
            const sim = (0, exports.simularPrestamoService)({
                monto, tasaInteres: mid, numeroCuotas, tipoCalculo: 'amortizable'
            });
            if (Math.abs(sim.montoCuota - cuotaDeseada) < epsilon) {
                tasaEncontrada = mid;
                break;
            }
            else if (sim.montoCuota < cuotaDeseada) {
                low = mid;
            }
            else {
                high = mid;
            }
            tasaEncontrada = mid;
        }
    }
    return {
        monto,
        numeroCuotas,
        cuotaObjetivo: cuotaDeseada,
        tasaCalculada: Number(tasaEncontrada.toFixed(2)),
        tipoCalculo
    };
};
exports.calcularTasaPorCuotaService = calcularTasaPorCuotaService;
// E. Obtener Rango de Cuotas
const obtenerRangoCuotasService = (params) => {
    if (params.numeroCuotas <= 0)
        throw new Error("El número de cuotas debe ser un valor positivo");
    const cuotaMinima = params.monto / params.numeroCuotas; // 0% interés
    const cuotaMaximaSugerida = cuotaMinima * 2; // Ejemplo: hasta 100% de interés total (muy alto, pero es un techo)
    return {
        cuotaMinima: Number(cuotaMinima.toFixed(2)),
        cuotaMaximaSugerida: Number(cuotaMaximaSugerida.toFixed(2))
    };
};
exports.obtenerRangoCuotasService = obtenerRangoCuotasService;
const countPrestamosActivosByPrestatarioService = async (idPrestatario, idEmpresa) => {
    const { count, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("*", { count: "exact", head: true }) // 'head: true' significa "solo dame el número, no los datos"
        .eq("IdPrestatario", idPrestatario)
        .eq("IdEmpresa", idEmpresa)
        .eq("Estado", "Activo"); // O el estado que uses para definir 'Activo'
    if (error) {
        throw new Error(error.message);
    }
    return count || 0;
};
exports.countPrestamosActivosByPrestatarioService = countPrestamosActivosByPrestatarioService;
