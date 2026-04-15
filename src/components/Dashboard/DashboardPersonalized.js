import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Typography, Button, Box } from '@mui/material';
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


const ChartCard = ({ config, onEdit, onDelete, globalParams}) => {
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
      //Logica Global Params
      let finalParamsForQuery = [...localParams];

      // 2. BUSCAMOS EL MATCH: 
      // Si un parámetro global tiene la misma KEY que uno local, usamos el valor GLOBAL
      finalParamsForQuery = finalParamsForQuery.map(localP => {
        const matchGlobal = globalParams.find(gp => gp.key === localP.key);
        return matchGlobal ? { ...localP, value: matchGlobal.value } : localP;
      });

      // INYECTAMOS LOS PARÁMETROS ANTES DEL FETCH
      const sqlFinal = injectParams(config.query_sql, finalParamsForQuery);
      
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
  }, [globalParams]); // Global Params reaccionando

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
  
  // 1. Estado para los filtros en los inputs
  const [globalParams, setGlobalParams] = useState([]);
  // 2. Estado para los filtros aplicados a las gráficas
  const [activeFilters, setActiveFilters] = useState([]);
  const [newFilterConfig, setNewFilterConfig] = useState({ key: '', label: '', type: 'text' });

  // --- CARGA INICIAL ---
  useEffect(() => {
    fetch('/api/graphics/handler')
      .then(res => res.json())
      .then(data => {
        setSavedCharts(data);
        
        // Si existen gráficas y la primera tiene parámetros globales, los cargamos
        if (data.length > 0 && data[0].global_params) {
          const loadedParams = data[0].global_params;
          setGlobalParams(loadedParams);
          setActiveFilters(loadedParams); // Para que carguen con datos de inmediato
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando dashboard:", err);
        setLoading(false);
      });
  }, []);

  // --- PERSISTENCIA (GUARDAR EN DB) ---
  const saveGlobalSettings = async () => {
    try {
      const response = await fetch('/api/graphics/global', { // Tu nuevo endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: globalParams }),
      });

      if (response.ok) {
        alert("Configuración de filtros guardada permanentemente");
      } else {
        throw new Error("Error al guardar");
      }
    } catch (err) {
      alert("No se pudo guardar la configuración: " + err.message);
    }
  };

  const applyFilters = () => {
    setActiveFilters([...globalParams]);
  };

  const addGlobalFilter = () => {
  if (!newFilterConfig.key || !newFilterConfig.label) {
    alert("Por favor rellena la Llave y la Etiqueta");
    return;
  }

  const newFilter = { 
    ...newFilterConfig, 
    id: Date.now(), 
    value: '' 
  };

    setGlobalParams([...globalParams, newFilter]);
    // Limpiamos el mini-formulario
    setNewFilterConfig({ key: '', label: '', type: 'text' });
  };

  const handleGlobalChange = (key, value) => {
    setGlobalParams(prev => prev.map(p => p.key === key ? { ...p, value } : p));
  };

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
      <div className="info-card" style={{ marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        {/* --- SECCIÓN 1: CONFIGURAR NUEVO FILTRO --- */}
      <Box sx={{ mb: 3, pb: 2, borderBottom: '1px dashed #cbd5e1' }}>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
          Configurar Nuevo Filtro Global
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            placeholder="Llave SQL" 
            className="elegant-input" 
            style={{ width: '200px' }}
            value={newFilterConfig.key}
            onChange={(e) => setNewFilterConfig({...newFilterConfig, key: e.target.value})}
          />
          <input 
            placeholder="Etiqueta" 
            className="elegant-input" 
            style={{ width: '250px' }}
            value={newFilterConfig.label}
            onChange={(e) => setNewFilterConfig({...newFilterConfig, label: e.target.value})}
          />
          <select 
            className="elegant-select"
            value={newFilterConfig.type}
            onChange={(e) => setNewFilterConfig({...newFilterConfig, type: e.target.value})}
          >
            <option value="text">Texto</option>
            <option value="date">Fecha</option>
            <option value="number">Número</option>
          </select>
          <Button 
            variant="outlined" 
            onClick={addGlobalFilter}
            sx={{ textTransform: 'none', borderColor: '#6366f1', color: '#6366f1' }}
          >
            + Añadir al Tablero
          </Button>
        </Box>
      </Box>

      {/* --- SECCIÓN 2: FILTROS ACTIVOS (LOS QUE SE CONSULTAN) --- */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            🌍 Filtros del Tablero Actual
          </Typography>
          <Button 
            variant="contained" 
            onClick={saveGlobalSettings} 
            startIcon={<span>💾</span>}
            sx={{ backgroundColor: '#6366f1', textTransform: 'none' }}
          >
            Guardar Cambios
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          {globalParams.map(gp => (
            <Box key={gp.key} sx={{ position: 'relative', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>
                  {gp.label} <small>({gp.key})</small>
                </label>
                <input 
                  type={gp.type}
                  className="elegant-input"
                  style={{ width: '180px', borderLeft: '4px solid #6366f1' }}
                  value={gp.value}
                  onChange={(e) => handleGlobalChange(gp.key, e.target.value)}
                />
              </Box>
              
              {/* Botón para eliminar el filtro del dashboard */}
              <button 
                onClick={() => setGlobalParams(globalParams.filter(p => p.key !== gp.key))}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0 8px 0' }}
                title="Eliminar este filtro"
              >
                ×
              </button>
            </Box>
          ))}

          <Button 
            variant="contained" 
            onClick={applyFilters}
            sx={{ height: '42px', px: 4, backgroundColor: '#06b9aa', textTransform: 'none' }}
          >
            Consultar Tablero
          </Button>
        </Box>
      </Box>
    </div>

      {/* --- GRID DE GRÁFICAS --- */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
        {savedCharts.map(chart => (
          <ChartCard 
            key={chart.grafica_id} 
            config={chart} 
            globalParams={activeFilters} // <-- Las gráficas solo reaccionan a activeFilters
            onEdit={onEditChart} 
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardPersonalized;