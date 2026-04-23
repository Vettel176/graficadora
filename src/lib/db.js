import { Pool } from 'pg'; 

// Configuracio de cadena de conexion de Base de Datos
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const poolGraphs = new Pool({
  connectionString: process.env.DATABASE_URL_GRAPHS,
});

