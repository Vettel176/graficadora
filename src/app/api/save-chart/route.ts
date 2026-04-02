import { NextResponse } from 'next/server';
import pool from '@/lib/db'; 

export async function POST(request) {
  try {
    const { titulo, descripcion, tipo, sql, config_extra } = await request.json();

    // Nota: Agregué config_extra por si quieres guardar los colores/bordes que definiste antes
    await pool.query(
      'INSERT INTO empresa.graficas_config (titulo, descripcion, tipo_grafico, query_sql, config_extra) VALUES ($1, $2, $3, $4, $5)',
      [titulo, descripcion, tipo, sql, JSON.stringify(config_extra)]
    );

    return NextResponse.json({ message: 'Gráfica guardada con éxito' });
  } catch (err) {
    console.error('Error en save-chart:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}