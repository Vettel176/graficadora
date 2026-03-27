import express from 'express';
import pg from 'pg';
import cors from 'cors';

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: 'monorail.proxy.rlwy.net',
  port: 50961,
  database: 'railway',
  user: 'planet',
  password: 'planet',
});


app.get('/api/schema', async (req, res) => {
  try {
    const query = `
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'empresa'
      ORDER BY table_name, ordinal_position;
    `;
    const { rows } = await pool.query(query);

    // Group columns by table_name
    const schemaDb = {};
    for (const row of rows) {
      if (!schemaDb[row.table_name]) {
        schemaDb[row.table_name] = [];
      }
      schemaDb[row.table_name].push(row.column_name);
    }

    res.json(schemaDb);
  } catch (err) {
    console.error('Error in /api/schema:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint generic to get distribution data from a selected table and column
app.get('/api/chart-data', async (req, res) => {
  const { table, column, yColumn } = req.query;

  if (!table || !column) {
    return res.status(400).json({ error: 'Faltan parámetros table o column' });
  }

  try {
    // Very basic SQL injection prevention for identifiers
    if (!/^[a-zA-Z0-9_]+$/.test(table) || !/^[a-zA-Z0-9_]+$/.test(column)) {
      return res.status(400).json({ error: 'Nombre de tabla o columna inválido' });
    }

    let query = '';

    if (yColumn) {
      if (!/^[a-zA-Z0-9_]+$/.test(yColumn)) {
        return res.status(400).json({ error: 'Nombre de columna Y inválido' });
      }
      query = `
        SELECT "${column}" AS label, SUM("${yColumn}") as count 
        FROM empresa."${table}" 
        GROUP BY "${column}" 
        ORDER BY count DESC 
        LIMIT 15;
      `;
    } else {
      query = `
        SELECT "${column}" AS label, COUNT(*) as count 
        FROM empresa."${table}" 
        GROUP BY "${column}" 
        ORDER BY count DESC 
        LIMIT 15;
      `;
    }

    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error in /api/chart-data:', err);
    res.status(500).json({ error: err.message });
  }
});

// Nuevo endpoint para ejecutar queries personalizados
app.post('/api/execute', async (req, res) => {
  const { sql } = req.body;

  if (!sql) {
    return res.status(400).json({ error: 'El query SQL es requerido' });
  }

  // Validación básica: Solo permitir SELECT para evitar DELETE/DROP accidentales
  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
  if (!isSelect) {
    return res.status(403).json({ error: 'Solo se permiten consultas de lectura (SELECT).' });
  }

  try {
    // Ejecutamos el query tal cual llega del frontend
    const { rows } = await pool.query(sql);

    // IMPORTANTE: Para graficar, el frontend espera una estructura.
    // Intentaremos estandarizar la salida o enviarla cruda.
    res.json(rows);
  } catch (err) {
    console.error('Error ejecutando SQL manual:', err);
    // Enviamos el error detallado de Postgres para que el admin sepa qué falló en su sintaxis
    res.status(400).json({ error: `Error de SQL: ${err.message}` });
  }
});

// 1. Guardar una nueva configuración
app.post('/api/save-chart', async (req, res) => {
  const { titulo, descripcion, tipo, sql } = req.body;
  try {
    await pool.query(
      'INSERT INTO empresa.graficas_config (titulo, descripcion, tipo_grafico, query_sql) VALUES ($1, $2, $3, $4)',
      [titulo, descripcion, tipo, sql]
    );
    res.json({ message: 'Gráfica guardada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Obtener todas las gráficas guardadas
app.get('/api/my-charts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM empresa.graficas_config ORDER BY posicion ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
