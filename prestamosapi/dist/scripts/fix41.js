"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prestamo_service_1 = require("../services/prestamo.service");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function fix() {
    const idPrestamo = 41;
    const monto = 10000;
    const tasaInteres = 10;
    const cuotas = 2;
    const tipoCalculo = "solo_interes";
    console.log("Generando nueva simulación para Préstamo 41...");
    const simulacion = (0, prestamo_service_1.simularPrestamoService)({
        monto,
        tasaInteres,
        numeroCuotas: cuotas,
        tipoCalculo
    });
    console.log("Simulación:", simulacion);
    const updatePayload = {
        TipoCalculo: tipoCalculo,
        InteresPorcentaje: tasaInteres,
        InteresMontoTotal: simulacion.montoTotalInteres,
        CapitalTotalPagar: simulacion.montoTotalAPagar,
        MontoCuota: simulacion.montoCuota,
        CantidadCuotas: cuotas,
        CuotasRestantes: cuotas,
        TablaPagos: JSON.stringify(simulacion.tablaAmortizacion)
    };
    const { error } = await supabase.from("Prestamo").update(updatePayload).eq("IdPrestamo", idPrestamo);
    if (error) {
        console.error("Error actualizando:", error);
    }
    else {
        console.log("✅ Préstamo 41 actualizado exitosamente a Solo Interés.");
    }
}
fix();
