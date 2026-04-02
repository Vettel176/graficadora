// src/app/api/execute/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Reutiliza tu configuración de Pool (lo ideal es tenerlo en /src/lib/db.js)
const pool = new Pool({
  host: 'monorail.proxy.rlwy.net',
  port: 50961,
  database: 'railway',
  user: 'planet',
  password: 'planet',
});

export async function POST(request) {
  try {
    // En Next.js extraemos el body así:
    const { sql } = await request.json();

    if (!sql) {
      return NextResponse.json(
        { error: 'El query SQL es requerido' }, 
        { status: 400 }
      );
    }

    // Tu validación de seguridad (¡Muy importante!)
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    if (!isSelect) {
      return NextResponse.json(
        { error: 'Solo se permiten consultas de lectura (SELECT).' }, 
        { status: 403 }
      );
    }

    // Ejecución del query
    const { rows } = await pool.query(sql);

    // Respuesta exitosa
    return NextResponse.json(rows);

  } catch (err) {
    console.error('Error ejecutando SQL manual:', err);
    return NextResponse.json(
      { error: `Error de SQL: ${err.message }` }, 
      { status: 400 }
    );
  }
}