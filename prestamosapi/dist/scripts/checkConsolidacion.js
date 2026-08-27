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
async function checkConsolidacion() {
    const idPago = 46;
    console.log("Checking RegistroConsolidacion for idPago 46...");
    const { data: registros } = await supabase
        .from("RegistroConsolidacion")
        .select("*")
        .eq("ReferenciaId", idPago)
        .eq("Categoria", "Pago Prestamo");
    console.log("Registros:", registros);
    if (registros && registros.length > 0) {
        for (const r of registros) {
            console.log(`Deleting orphaned RegistroConsolidacion ID: ${r.IdRegistro}`);
            await supabase.from("RegistroConsolidacion").delete().eq("IdRegistro", r.IdRegistro);
        }
    }
    // To register the new payment, we need the active consolidacion
    const { data: consolidaciones } = await supabase
        .from("ConsolidacionCapital")
        .select("*")
        .eq("IdEmpresa", 1)
        .eq("Estado", "Activa");
    console.log("Consolidaciones activas:", consolidaciones);
}
checkConsolidacion();
