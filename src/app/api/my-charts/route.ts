// src/app/api/my-charts/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM empresa.graficas_config ORDER BY posicion ASC'
    );
    
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}