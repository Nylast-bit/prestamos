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
async function migrateNumeroEmpresa() {
    console.log("🚀 Starting NumeroEmpresa migration...");
    try {
        // 1. Migrate Prestamos
        const { data: empresasPrestamo, error: errEmp1 } = await supabase
            .from("Prestamo")
            .select("IdEmpresa")
            .not("IdEmpresa", "is", null);
        if (errEmp1)
            throw errEmp1;
        // Get unique companies
        const uniqueEmpresasPrestamo = [...new Set(empresasPrestamo.map(p => p.IdEmpresa))];
        for (const idEmpresa of uniqueEmpresasPrestamo) {
            // Find the max NumeroEmpresa currently valid
            const { data: maxPrestamo } = await supabase
                .from("Prestamo")
                .select("NumeroEmpresa")
                .eq("IdEmpresa", idEmpresa)
                .not("NumeroEmpresa", "is", null)
                .order("NumeroEmpresa", { ascending: false })
                .limit(1)
                .maybeSingle();
            let nextNum = (maxPrestamo?.NumeroEmpresa || 0) + 1;
            // Fetch all loans with null NumeroEmpresa for this company, ordered by creation (IdPrestamo)
            const { data: nullPrestamos } = await supabase
                .from("Prestamo")
                .select("IdPrestamo")
                .eq("IdEmpresa", idEmpresa)
                .is("NumeroEmpresa", null)
                .order("IdPrestamo", { ascending: true });
            if (nullPrestamos && nullPrestamos.length > 0) {
                console.log(`Migrating ${nullPrestamos.length} Prestamos for Empresa ${idEmpresa}...`);
                for (const p of nullPrestamos) {
                    await supabase.from("Prestamo").update({ NumeroEmpresa: nextNum }).eq("IdPrestamo", p.IdPrestamo);
                    nextNum++;
                }
            }
        }
        // 2. Migrate Pagos
        const { data: nullPagos, error: errNullPagos } = await supabase
            .from("Pago")
            .select("IdPago, Prestamo!inner(IdEmpresa)")
            .is("NumeroEmpresa", null)
            .order("IdPago", { ascending: true });
        if (errNullPagos)
            throw errNullPagos;
        if (nullPagos && nullPagos.length > 0) {
            // Find max NumeroEmpresa per IdEmpresa
            const empresaMaxPagoMap = new Map();
            for (const p of nullPagos) {
                const idEmpresa = p.Prestamo.IdEmpresa;
                if (!empresaMaxPagoMap.has(idEmpresa)) {
                    const { data: maxPago } = await supabase
                        .from("Pago")
                        .select("NumeroEmpresa, Prestamo!inner(IdEmpresa)")
                        .eq("Prestamo.IdEmpresa", idEmpresa)
                        .not("NumeroEmpresa", "is", null)
                        .order("NumeroEmpresa", { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    empresaMaxPagoMap.set(idEmpresa, maxPago?.NumeroEmpresa || 0);
                }
                const nextNum = empresaMaxPagoMap.get(idEmpresa) + 1;
                await supabase.from("Pago").update({ NumeroEmpresa: nextNum }).eq("IdPago", p.IdPago);
                empresaMaxPagoMap.set(idEmpresa, nextNum);
            }
            console.log(`Migrated ${nullPagos.length} Pagos.`);
        }
        console.log("✅ Migration completed successfully!");
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
    }
}
migrateNumeroEmpresa();
