import { logger } from "../utils/logger";
import { supabase } from "../config/supabaseClient";
import bcrypt from "bcryptjs";
import { createPrestatarioService } from "./prestatario.service";
import { createClienteService } from "./cliente.service";
import { createPrestamoService } from "./prestamo.service";

interface ImportRow {
  nombreCliente: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
  numeroCuenta?: string;
  montoPrestado: number;
  interesPorcentaje: number;
  interesMontoTotal: number;
  capitalRestante: number;
  cantidadCuotas: number;
  cuotasRestantes: number;
  montoCuota: number;
  modalidadPago: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  responsableNombre: string;
}

export const importBatchService = async (rows: ImportRow[], idEmpresa: number, isSuperAdmin: boolean = false) => {
  const results = {
    success: 0,
    errors: [] as { row: number; error: string }[],
  };

  // 0. Obtener límites del plan
  let planLimits = { LimiteUsuarios: Infinity, LimitePrestamos: Infinity };
  
  if (!isSuperAdmin) {
    const { data: suscripcion } = await supabase
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
        LimiteUsuarios: p.LimiteUsuarios as number, 
        LimitePrestamos: p.LimitePrestamos as number 
      };
    } else {
        // Si no hay suscripción activa, lanzamos error general
        throw new Error("La empresa no cuenta con una suscripción activa.");
    }
  }

  // Obtener conteos actuales
  let { count: currentUsers } = await supabase
    .from('Usuario')
    .select('*', { count: 'exact', head: true })
    .eq('IdEmpresa', idEmpresa)
    .neq('Rol', 'admin_empresa');

  let { count: currentLoans } = await supabase
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
      let { data: prestatario } = await supabase
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
        const salt = await bcrypt.genSalt(10);
        const hashClave = await bcrypt.hash("123456", salt);
        const email = `${row.responsableNombre.toLowerCase().replace(/\s/g, "")}${Math.floor(Math.random()*1000)}@empresa.com`;
        
        prestatario = await createPrestatarioService({
          Nombre: row.responsableNombre,
          Email: email,
          Clave: hashClave,
          IdEmpresa: idEmpresa,
        });
        userCount++;
      }

      // 2. Gestionar Cliente
      let { data: cliente } = await supabase
        .from("Cliente")
        .select("IdCliente")
        .eq("Cedula", row.cedula)
        .eq("IdEmpresa", idEmpresa)
        .maybeSingle();

      if (!cliente) {
        cliente = await createClienteService({
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

      await createPrestamoService({
        IdCliente: cliente!.IdCliente,
        IdPrestatario: prestatario!.IdPrestatario,
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
      }, idEmpresa);

      if (isActivo) loanCount++;
      results.success++;
    } catch (error: any) {
      logger.error(`Error importando fila ${i + 1}:`, error.message);
      results.errors.push({ row: i + 1, error: error.message });
    }
  }

  return results;
};
