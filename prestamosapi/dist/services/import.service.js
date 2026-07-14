"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importBatchService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prestatario_service_1 = require("./prestatario.service");
const cliente_service_1 = require("./cliente.service");
const prestamo_service_1 = require("./prestamo.service");
const importBatchService = async (rows, idEmpresa, isSuperAdmin = false) => {
    const results = {
        success: 0,
        errors: [],
    };
    // 0. Obtener límites del plan
    let planLimits = { LimiteUsuarios: Infinity, LimitePrestamos: Infinity };
    if (!isSuperAdmin) {
        const { data: suscripcion } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .select('Plan:IdPlan (LimiteUsuarios, LimitePrestamos)')
            .eq('IdEmpresa', idEmpresa)
            .eq('Estado', 'Activa')
            .order('IdSuscripcion', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (suscripcion && suscripcion.Plan) {
            const p = Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan;
            planLimits = {
                LimiteUsuarios: p.LimiteUsuarios,
                LimitePrestamos: p.LimitePrestamos
            };
        }
        else {
            // Si no hay suscripción activa, lanzamos error general
            throw new Error("La empresa no cuenta con una suscripción activa.");
        }
    }
    // Obtener conteos actuales
    let { count: currentUsers } = await supabaseClient_1.supabase
        .from('Usuario')
        .select('*', { count: 'exact', head: true })
        .eq('IdEmpresa', idEmpresa)
        .neq('Rol', 'admin_empresa');
    let { count: currentLoans } = await supabaseClient_1.supabase
        .from('Prestamo')
        .select('*', { count: 'exact', head: true })
        .eq('IdEmpresa', idEmpresa)
        .eq('Estado', 'Activo');
    let userCount = currentUsers || 0;
    let loanCount = currentLoans || 0;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
            // 1. Gestionar Responsable (Prestatario)
            let { data: prestatario } = await supabaseClient_1.supabase
                .from("Prestatario")
                .select("IdPrestatario")
                .eq("Nombre", row.responsableNombre)
                .eq("IdEmpresa", idEmpresa)
                .maybeSingle();
            if (!prestatario) {
                // Validar límite de usuarios antes de crear uno nuevo
                if (userCount >= planLimits.LimiteUsuarios) {
                    throw new Error(`Límite de usuarios (${planLimits.LimiteUsuarios}) alcanzado. No se puede crear al responsable: ${row.responsableNombre}`);
                }
                // Crear nuevo prestatario/prestamista
                const salt = await bcryptjs_1.default.genSalt(10);
                const hashClave = await bcryptjs_1.default.hash("123456", salt);
                const email = `${row.responsableNombre.toLowerCase().replace(/\s/g, "")}${Math.floor(Math.random() * 1000)}@empresa.com`;
                prestatario = await (0, prestatario_service_1.createPrestatarioService)({
                    Nombre: row.responsableNombre,
                    Email: email,
                    Clave: hashClave,
                    IdEmpresa: idEmpresa,
                });
                userCount++;
            }
            // 2. Gestionar Cliente
            let { data: cliente } = await supabaseClient_1.supabase
                .from("Cliente")
                .select("IdCliente")
                .eq("Cedula", row.cedula)
                .eq("IdEmpresa", idEmpresa)
                .maybeSingle();
            if (!cliente) {
                cliente = await (0, cliente_service_1.createClienteService)({
                    Nombre: row.nombreCliente,
                    Cedula: row.cedula,
                    Telefono: row.telefono,
                    Direccion: row.direccion,
                    NumeroCuenta: row.numeroCuenta,
                    IdEmpresa: idEmpresa,
                });
            }
            // 3. Crear Préstamo
            const isActivo = row.capitalRestante > 0;
            // Validar límite de préstamos si el nuevo préstamo está activo
            if (isActivo) {
                if (loanCount >= planLimits.LimitePrestamos) {
                    throw new Error(`Límite de préstamos activos (${planLimits.LimitePrestamos}) alcanzado.`);
                }
            }
            await (0, prestamo_service_1.createPrestamoService)({
                IdCliente: cliente.IdCliente,
                IdPrestatario: prestatario.IdPrestatario,
                MontoPrestado: row.montoPrestado,
                InteresPorcentaje: row.interesPorcentaje,
                InteresMontoTotal: row.interesMontoTotal,
                CapitalRestante: row.capitalRestante,
                CapitalTotalPagar: row.montoPrestado + row.interesMontoTotal,
                MontoCuota: row.montoCuota,
                CantidadCuotas: row.cantidadCuotas,
                CuotasRestantes: row.cuotasRestantes,
                ModalidadPago: row.modalidadPago.toLowerCase(),
                FechaInicio: row.fechaInicio,
                FechaFinEstimada: row.fechaFinEstimada,
                TipoCalculo: "capital+interes",
                Estado: isActivo ? "Activo" : "Pagado",
                IdEmpresa: idEmpresa,
            }, idEmpresa, true);
            if (isActivo)
                loanCount++;
            results.success++;
        }
        catch (error) {
            logger_1.logger.error(`Error importando fila ${i + 1}:`, error.message);
            results.errors.push({ row: i + 1, error: error.message });
        }
    }
    return results;
};
exports.importBatchService = importBatchService;
