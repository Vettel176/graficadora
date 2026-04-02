import { Pool } from 'pg'; 

// Configuracio de cadena de conexion de Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;