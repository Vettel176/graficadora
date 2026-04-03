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

export async function GET(request) {

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const column = searchParams.get('column');
  const yColumn = searchParams.get('yColumn');

  if (!table || !column) {
    return NextResponse.json({ error: 'Faltan parámetros table o column' }, { status: 400 });
  }

  try {
    const validIdentifier = /^[a-zA-Z0-9_]+$/;
    if (!validIdentifier.test(table) || !validIdentifier.test(column)) {
      return NextResponse.json({ error: 'Nombre de tabla o columna inválido' }, { status: 400 });
    }

    let query = '';

    if (yColumn) {
      if (!validIdentifier.test(yColumn)) {
        return NextResponse.json({ error: 'Nombre de columna Y inválido' }, { status: 400 });
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
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error in /api/chart-data:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}