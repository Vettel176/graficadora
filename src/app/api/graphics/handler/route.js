import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  host: 'monorail.proxy.rlwy.net',
  port: 50961,
  database: 'railway',
  user: 'planet',
  password: 'planet',
});


// --- GET: Listar todas las  Graficas ---

export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM empresa.graficas_config WHERE status = true ORDER BY posicion ASC'
    );
    
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- POST: Guardar Nueva Grafica---
export async function POST(request) {
  try {
    const { titulo, descripcion, tipo_grafico, query_sql, config_extra } = await request.json();

    const result = await pool.query(
      'INSERT INTO empresa.graficas_config (titulo, descripcion, tipo_grafico, query_sql, config_extra, status) VALUES ($1, $2, $3, $4, $5, true) RETURNING grafica_id',
      [titulo, descripcion, tipo_grafico, query_sql, JSON.stringify(config_extra)]
    );

    return NextResponse.json({ message: 'Gráfica guardada', id: result.rows[0].grafica_id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- PUT: Actualizar Grafica ---
export async function PUT(request) {
  try {
    const { grafica_id, titulo, tipo_grafico, query_sql, config_extra } = await request.json();

    await pool.query(
      `UPDATE empresa.graficas_config 
       SET titulo = $2, 
           tipo_grafico = $3, 
           query_sql = $4, 
           config_extra = $5 
       WHERE grafica_id = $1`,
      [grafica_id, titulo, tipo_grafico, query_sql, JSON.stringify(config_extra)]
    );

    return NextResponse.json({ message: 'Gráfica actualizada con éxito' });
  } catch (err) {
    console.error('Error en update-chart:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- DELETE: Deshabilitar ---
export async function PATCH(request) {
  try {

    const { searchParams } = new URL(request.url);
    const grafica_id = searchParams.get('id');

    if (!grafica_id) {
      return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    }
    
    await pool.query(
      'UPDATE empresa.graficas_config SET status =  false WHERE grafica_id = $1',
      [grafica_id]
    );

    return NextResponse.json({ message: 'Gráfica eliminada con éxito' });
  } catch (err) {
    console.error('Error en delete-chart:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}