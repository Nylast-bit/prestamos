const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/Proyectos/Prestamos/prestamosapi/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('Usuario').select('IdUsuario, Nombre, Email, Clave, Rol, IdEmpresa').order('IdUsuario', { ascending: false }).limit(5);
  if (error) console.error(error);
  console.log(data);
}

check();
