import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicateNumeroEmpresa() {
  console.log("🚀 Starting duplicate NumeroEmpresa fix...");

  try {
    const { data: prestamos, error } = await supabase
      .from("Prestamo")
      .select("IdPrestamo, IdEmpresa, NumeroEmpresa")
      .order("IdEmpresa", { ascending: true })
      .order("IdPrestamo", { ascending: true });

    if (error) throw error;

    // Group by company
    const byCompany = new Map<number, any[]>();
    for (const p of prestamos) {
        if (!byCompany.has(p.IdEmpresa)) byCompany.set(p.IdEmpresa, []);
        byCompany.get(p.IdEmpresa)!.push(p);
    }

    let fixedCount = 0;

    for (const [idEmpresa, loans] of byCompany.entries()) {
        const seen = new Set<number>();
        let maxNum = 0;
        
        // Find true max
        for (const p of loans) {
            if (p.NumeroEmpresa && !seen.has(p.NumeroEmpresa)) {
                seen.add(p.NumeroEmpresa);
                if (p.NumeroEmpresa > maxNum) maxNum = p.NumeroEmpresa;
            }
        }

        seen.clear();
        
        for (const p of loans) {
            if (!p.NumeroEmpresa || seen.has(p.NumeroEmpresa)) {
                // It's a duplicate or null! Assign a new one
                maxNum++;
                console.log(`Fixing duplicate/null for Prestamo ID: ${p.IdPrestamo}. New NumeroEmpresa: ${maxNum}`);
                await supabase.from("Prestamo").update({ NumeroEmpresa: maxNum }).eq("IdPrestamo", p.IdPrestamo);
                seen.add(maxNum);
                fixedCount++;
            } else {
                seen.add(p.NumeroEmpresa);
            }
        }
    }
    
    console.log(`✅ Fixed ${fixedCount} duplicate/null Prestamos!`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

fixDuplicateNumeroEmpresa();
