import { supabase } from "../config/supabaseClient";

// Crear solicitud
export const createSolicitudService = async (data: any) => {
  // 1. Validar que el cliente exista
  const { data: clienteExistente, error: errorCliente } = await supabase
    .from("Cliente")
    .select("IdCliente")
    .eq("IdCliente", data.IdCliente)
    .single();

  if (errorCliente || !clienteExistente) {
    throw new Error("Cliente no encontrado");
  }

  // 2. Crear la solicitud
  const { data: nuevaSolicitud, error: errorCreacion } = await supabase
    .from("SolicitudPrestamo")
    .insert([{
      IdCliente: data.IdCliente,
      MontoSolicitado: data.MontoSolicitado,
      FechaDeseada: new Date(data.FechaDeseada).toISOString(),
      Estado: data.Estado,
      Notas: data.Notas || null,
      FechaCreacion: new Date(data.FechaCreacion).toISOString(),
    }])
    .select()
    .single();

  if (errorCreacion) throw new Error(errorCreacion.message);
  
  return nuevaSolicitud;
};

// Obtener todas
export const getAllSolicitudesService = async () => {
  const { data, error } = await supabase
    .from("SolicitudPrestamo")
    .select(`
      *,
      Cliente (*)
    `)
    .order("FechaCreacion", { ascending: false });

  if (error) throw new Error(error.message);
  
  return data;
};

// Obtener por ID
export const getSolicitudByIdService = async (id: number) => {
  const { data: solicitud, error } = await supabase
    .from("SolicitudPrestamo")
    .select(`
      *,
      Cliente (*)
    `)
    .eq("IdSolicitud", id)
    .single();

  if (error || !solicitud) {
    throw new Error("Solicitud no encontrada");
  }

  return solicitud;
};

// Actualizar solicitud
export const updateSolicitudService = async (id: number, data: any) => {
  // 1. Validar que el cliente exista
  const { data: clienteExistente, error: errorCliente } = await supabase
    .from("Cliente")
    .select("IdCliente")
    .eq("IdCliente", data.IdCliente)
    .single();

  if (errorCliente || !clienteExistente) {
    throw new Error("Cliente no encontrado");
  }

  // 2. Actualizar la solicitud
  const { data: actualizado, error: errorActualizacion } = await supabase
    .from("SolicitudPrestamo")
    .update({
      IdCliente: data.IdCliente,
      MontoSolicitado: data.MontoSolicitado,
      FechaDeseada: new Date(data.FechaDeseada).toISOString(),
      Estado: data.Estado,
      Notas: data.Notas || null,
      // Usualmente la FechaCreacion no se actualiza, pero lo dejo por tu código original
      FechaCreacion: new Date(data.FechaCreacion).toISOString(), 
    })
    .eq("IdSolicitud", id)
    .select()
    .single();

  if (errorActualizacion) throw new Error(errorActualizacion.message);

  return actualizado;
};

// Eliminar solicitud
export const deleteSolicitudService = async (id: number) => {
  const { error } = await supabase
    .from("SolicitudPrestamo")
    .delete()
    .eq("IdSolicitud", id);

  if (error) throw new Error(error.message);
  
  return true;
};