"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function fixLoan() {
    const idPago = 46;
    const idPrestamo = 30;
    console.log("🚀 Starting loan fix...");
    // 1. Delete the Pago (this cascades to RegistroConsolidacion)
    const { error: errDel } = await supabase.from("Pago").delete().eq("IdPago", idPago);
    if (errDel) {
        console.error("Error deleting pago:", errDel);
        return;
    }
    console.log("Pago deleted.");
    // 2. Rebuild pristine TablaPagos (8 quotas of 1875 for 10000 loan, interes 6.25%)
    const pristineTabla = [];
    let saldo = 10000;
    for (let i = 1; i <= 8; i++) {
        saldo -= 1250;
        pristineTabla.push({
            numeroCuota: i,
            cuota: 1875,
            interes: 625,
            capital: 1250,
            saldo: Math.max(0, saldo),
            pagado: false
        });
    }
    // 3. Update Prestamo
    const { error: errUpd } = await supabase.from("Prestamo").update({
        CapitalRestante: 10000,
        CuotasRestantes: 8,
        Estado: "Activo",
        TablaPagos: JSON.stringify(pristineTabla)
    }).eq("IdPrestamo", idPrestamo);
    if (errUpd) {
        console.error("Error updating prestamo:", errUpd);
        return;
    }
    console.log("✅ Loan successfully restored to pristine condition!");
}
fixLoan();
