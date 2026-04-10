import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);


const ChartCard = ({ config, onEdit, onDelete }) => {
  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parseo seguro del JSONB de PostgreSQL
  const extra = typeof config.config_extra === 'string' 
    ? JSON.parse(config.config_extra) 
    : (config.config_extra || {});

  const [localParams, setLocalParams] = useState(extra.dynamic_params || []);

  const mainColor = extra.main_color || '#a8e600';
  const titleColor = extra.title_color || '#00295f';
  const titlePos = extra.title_position || 'top';
  const borderRadius = extra.border_radius || 0;
  const showLegend = extra.show_legend ?? true;

  // Paleta de colores para Widgets y Pasteles
  const piePalette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  const injectParams = (sql, params) => {
  let processedSql = sql;
  params.forEach(p => {
    if (p.key) {
      const regex = new RegExp(`{{${p.key}}}`, 'g');
      processedSql = processedSql.replace(regex, p.value);
      }
    });
    return processedSql;
  };


const fetchChartData = async () => {
    setLoading(true);
    setError(null);
    try {
      // INYECTAMOS LOS PARÁMETROS ANTES DEL FETCH
      const sqlFinal = injectParams(config.query_sql, localParams);
      
      const response = await fetch('/api/graphics/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlFinal }),
      });

      if (!response.ok) throw new Error('Error al cargar datos');
      const rows = await response.json();

      if (rows.length > 0) {
        setResults(rows);
        
        if (config.tipo_grafico !== 'widget') {
          const keys = Object.keys(rows[0]);
          // La primera columna siempre es la etiqueta (Eje X)
          const labels = rows.map(r => r[keys[0]] || 'Nulo');

          // Recuperamos los colores guardados. Si no existen, usamos una paleta por defecto
          const savedColors = extra.colors || [mainColor, '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

          // --- CAMBIO CLAVE: Mapeamos todas las columnas desde la segunda en adelante ---
          const datasets = keys.slice(1).map((key, index) => ({
            label: key, // El alias del SQL será el nombre de la serie
            data: rows.map(r => Number(r[key])),
            // Si es Pay (Pie), usamos la paleta multicolor; si no, el color guardado para esa serie
            backgroundColor: config.tipo_grafico === 'pie' ? piePalette : (savedColors[index] || mainColor),
            borderColor: '#ffffff',
            borderWidth: 1,
            borderRadius: config.tipo_grafico === 'bar' ? borderRadius : 0,
          }));

          setData({
            labels,
            datasets // Ahora es un array dinámico, no uno fijo
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []); // Solo al montar

  const handleParamChange = (key, value) => {
    setLocalParams(prev => prev.map(p => p.key === key ? { ...p, value } : p));
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend, labels: { color: '#805e00' } },
      title: {
        display: true,
        text: config.titulo,
        position: titlePos,
        color: titleColor,
        font: { size: 16 }
      }
    },
    //Configuracion Texto Y y X de la grafica mas grid
    scales: config.tipo_grafico !== 'pie' && config.tipo_grafico !== 'widget' ? {
      y: { ticks: { color: '#00440c' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      x: { ticks: { color: '#00440c' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    } : {}
  };

  return (
    
    <div className="info-card chart-card-container" style={{ position: 'relative' }}>
      {/* BOTONES DE ACCIÓN (Esquina superior derecha) */}
      <div className="chart-actions" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        <button 
          onClick={() => onEdit(config)} 
          title="Editar Gráfica"
          className="action-btn edit-btn"
          style={{ background: 'rgba(96, 165, 250, 0.15)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px' }}
        >
          ✏️
        </button>
        <button 
          onClick={() => onDelete(config.grafica_id)} 
          title="Eliminar Gráfica"
          className="action-btn delete-btn"
          style={{ background: 'rgba(244, 63, 94, 0.15)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '5px' }}
        >
          🗑️
        </button>
      </div>

      {/* SECCIÓN DE FILTROS DINÁMICOS (Si existen) */}
      {localParams.length > 0 && (
        <div className="dynamic-filters-overlay" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          padding: '10px', 
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          marginBottom: '10px'
        }}>
          {localParams.map(p => (
            <div key={p.key} style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.label || p.key}</label>
              <input 
                type={p.type || 'text'} 
                className="elegant-input"
                style={{ padding: '4px 8px', fontSize: '0.8rem', width: '120px' }}
                value={p.value}
                onChange={(e) => handleParamChange(p.key, e.target.value)}
              />
            </div>
          ))}
          <button 
            onClick={fetchChartData} 
            className="btn-primary" 
            style={{ padding: '5px 15px', alignSelf: 'flex-end', fontSize: '0.8rem' }}
          >
            Actualizar
          </button>
        </div>

      )}

      {/* Render (Título, Gráfica */}

      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        {loading && <div className="spinner mini-spinner"></div>}
        {error && <p style={{ color: '#f43f5e', fontSize: '0.8rem' }}>{error}</p>}
        
        {!loading && !error && (
          config.tipo_grafico === 'widget' && results ? (
             <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <div style={{ color: mainColor, fontSize: '4rem', fontWeight: 'bold' }}>
                  {results[0] ? Object.values(results[0])[0] : '0'}
                </div>
                <p style={{ color: '#0062ec' }}>{config.titulo}</p>
             </div>
          ) : (
            data && (
              <>
                {config.tipo_grafico === 'bar' && <Bar data={data} options={options} />}
                {config.tipo_grafico === 'pie' && <Pie data={data} options={options} />}
                {config.tipo_grafico === 'line' && <Line data={data} options={options} />}
              </>
            )
          )
        )}
      </div>
    </div>
  );
};

// Componente Principal Dashboard
const DashboardPersonalized = ({onEditChart}) => {
  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/graphics/handler')
      .then(res => res.json())
      .then(data => {
        setSavedCharts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando dashboard:", err);
        setLoading(false);
      });
  }, []);

  // --- Eliminar - Deshabilitar ---
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta gráfica?")) return;

    try {
      const response = await fetch(`/api/graphics/handler?id=${id}`, { method: 'PATCH' });
      if (response.ok) {
        setSavedCharts(prev => prev.filter(c => c.grafica_id !== id));
        alert("Gráfica deshabilitada");
      }
    } catch (err) {
      console.error("Error al deshabilitar:", err);
    }
  };

    
  if (loading) return <div className="page-wrapper"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      
      {savedCharts.length === 0 ? (
        <div className="info-card"><p className="empty-state">No hay métricas configuradas.</p></div>
      ) : (
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {savedCharts.map(chart => (
            <ChartCard 
              key={chart.grafica_id} 
              config={chart} 
              onEdit={onEditChart} 
              onDelete={handleDelete}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPersonalized;