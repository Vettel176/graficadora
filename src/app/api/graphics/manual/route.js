// src/app/api/execute/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { poolGraphs }  from '../../../../lib/db';


// Consulta de Graficas en BD
 export async function POST(request) {
  try {

    const { sql } = await request.json();

    if (!sql) {
      return NextResponse.json(
        { error: 'El query SQL es requerido' }, 
        { status: 400 }
      );
    }

    // Validación de seguridad 
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    if (!isSelect) {
      return NextResponse.json(
        { error: 'Solo se permiten consultas de lectura (SELECT).' }, 
        { status: 403 }
      );
    }

    // Ejecución del query
    const { rows } = await poolGraphs.query(sql);

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