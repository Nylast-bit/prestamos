"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClienteService = exports.updateClienteService = exports.createClienteService = exports.getClienteByIdService = exports.getAllClientesService = void 0;
// services/cliente.service.ts
const supabaseClient_1 = require("../config/supabaseClient");
const CLIENT_TABLE_NAME = 'Cliente';
const getAllClientesService = async (idEmpresa) => {
    // 1. Pedimos los clientes Y sus préstamos (solo el estado para no pesar tanto)
    const { data, error } = await supabaseClient_1.supabase
        .from(CLIENT_TABLE_NAME)
        .select(`
      *,
      Prestamo (
        Estado
      )
    `)
        .eq('IdEmpresa', idEmpresa)
        .order('IdCliente', { ascending: true }); // Ordenamos para que no salgan desordenados
    if (error)
        throw new Error(error.message);
    // 2. Procesamos la lista para contar los activos
    const clientesConConteo = data.map((cliente) => {
        // Filtramos los que estén en estado 'Activo'
        // Asegúrate que 'Activo' es exactamente como lo guardas en BBDD (mayúsculas/minúsculas)
        const prestamosActivos = cliente.Prestamo?.filter((p) => p.Estado === 'Activo') || [];
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
exports.getAllClientesService = getAllClientesService;
const getClienteByIdService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from(CLIENT_TABLE_NAME)
        .select('*')
        .eq('IdCliente', id)
        .eq('IdEmpresa', idEmpresa)
        .single();
    if (error) {
        // Si el error es que no encontró filas, devolvemos null para manejarlo en el controller
        if (error.code === 'PGRST116')
            return null;
        throw new Error(error.message);
    }
    return data;
};
exports.getClienteByIdService = getClienteByIdService;
const createClienteService = async (clienteData) => {
    const { data: maxCliente } = await supabaseClient_1.supabase
        .from(CLIENT_TABLE_NAME)
        .select("NumeroEmpresa")
        .eq("IdEmpresa", clienteData.IdEmpresa)
        .order("NumeroEmpresa", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextNumeroEmpresa = ((maxCliente?.NumeroEmpresa) || 0) + 1;
    const clienteToInsert = {
        ...clienteData,
        NumeroEmpresa: nextNumeroEmpresa
    };
    const { data, error } = await supabaseClient_1.supabase
        .from(CLIENT_TABLE_NAME)
        .insert(clienteToInsert)
        .select()
        .single();
    if (error)
        throw new Error(error.message);
    return data;
};
exports.createClienteService = createClienteService;
const updateClienteService = async (id, idEmpresa, clienteData) => {
    const { data, error } = await supabaseClient_1.supabase
        .from(CLIENT_TABLE_NAME)
        .update(clienteData)
        .eq('IdCliente', id)
        .eq('IdEmpresa', idEmpresa)
        .select()
        .single();
    if (error) {
        if (error.code === 'PGRST116')
            return null; // No encontrado
        throw new Error(error.message);
    }
    return data;
};
exports.updateClienteService = updateClienteService;
const deleteClienteService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from(CLIENT_TABLE_NAME)
        .delete()
        .eq('IdCliente', id)
        .eq('IdEmpresa', idEmpresa)
        .select();
    if (error)
        throw new Error(error.message);
    // Si data está vacío, significa que no borró nada porque no existía el ID
    return data && data.length > 0;
};
exports.deleteClienteService = deleteClienteService;
