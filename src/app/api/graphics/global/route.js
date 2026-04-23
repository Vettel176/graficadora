// src/app/api/execute/route.ts
import { NextResponse } from 'next/server';
import { pool }  from '../../../../lib/db';


// Consulta de Graficas en BD
 export async function POST(request) {
    try {
        const { params } = await request.json();
        // Actualizamos la columna global_params en TODAS las gráficas de este usuario
        // para que el dashboard se mantenga sincronizado.
        await pool.query(
          'UPDATE empresa.graficas_config SET global_params = $1',
          [JSON.stringify(params)] 
        );

        return NextResponse.json({ success: true });
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
      }
}