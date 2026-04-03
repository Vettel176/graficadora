// src/app/api/my-charts/route.ts
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

export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM empresa.graficas_config ORDER BY posicion ASC'
    );
    
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}