// services/cliente.service.ts
import { supabase } from "../config/supabaseClient";

const CLIENT_TABLE_NAME = 'Cliente';

export const getAllClientesService = async (idEmpresa: number) => {
  // 1. Pedimos los clientes Y sus préstamos (solo el estado para no pesar tanto)
  const { data, error } = await supabase
    .from(CLIENT_TABLE_NAME)
    .select(`
      *,
      Prestamo (
        Estado
      )
    `)
    .eq('IdEmpresa', idEmpresa)
    .order('IdCliente', { ascending: true }); // Ordenamos para que no salgan desordenados

  if (error) throw new Error(error.message);

  // 2. Procesamos la lista para contar los activos
  const clientesConConteo = data.map((cliente: any) => {
    // Filtramos los que estén en estado 'Activo'
    // Asegúrate que 'Activo' es exactamente como lo guardas en BBDD (mayúsculas/minúsculas)
    const prestamosActivos = cliente.Prestamo?.filter((p: any) => p.Estado === 'Activo') || [];

    return {
      ...cliente,
      // Agregamos la nueva propiedad
      cantidadPrestamosActivos: prestamosActivos.length,
      // Opcional: Eliminamos el array 'Prestamo' para limpiar la respuesta si no lo necesitas en el front
      // Prestamo: undefined 
    };
  });

  return clientesConConteo;
};
export const getClienteByIdService = async (id: number, idEmpresa: number) => {
  const { data, error } = await supabase
    .from(CLIENT_TABLE_NAME)
    .select('*')
    .eq('IdCliente', id)
    .eq('IdEmpresa', idEmpresa)
    .single();

  if (error) {
    // Si el error es que no encontró filas, devolvemos null para manejarlo en el controller
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
};

export const createClienteService = async (clienteData: any) => {
  const { data, error } = await supabase
    .from(CLIENT_TABLE_NAME)
    .insert(clienteData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updateClienteService = async (id: number, idEmpresa: number, clienteData: any) => {
  const { data, error } = await supabase
    .from(CLIENT_TABLE_NAME)
    .update(clienteData)
    .eq('IdCliente', id)
    .eq('IdEmpresa', idEmpresa)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(error.message);
  }
  return data;
};

export const deleteClienteService = async (id: number, idEmpresa: number) => {
  const { data, error } = await supabase
    .from(CLIENT_TABLE_NAME)
    .delete()
    .eq('IdCliente', id)
    .eq('IdEmpresa', idEmpresa)
    .select();

  if (error) throw new Error(error.message);

  // Si data está vacío, significa que no borró nada porque no existía el ID
  return data && data.length > 0;
};