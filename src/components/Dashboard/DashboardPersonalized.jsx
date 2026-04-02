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

// Sub-componente ChartCard: Eliminamos la interfaz y el tipo React.FC
const ChartCard = ({ config }) => {
  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Parseo seguro del JSONB de PostgreSQL
  const extra = typeof config.config_extra === 'string' 
    ? JSON.parse(config.config_extra) 
    : (config.config_extra || {});

  const mainColor = extra.main_color || '#6366f1';
  const titlePos = extra.title_position || 'top';
  const descPos = extra.description_position || 'top';
  const borderRadius = extra.border_radius || 0;
  const showLegend = extra.show_legend ?? true;

  // Paleta de colores para Widgets y Pasteles
  const piePalette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: config.query_sql }),
        });

        if (!response.ok) throw new Error('Error al cargar datos');
        const rows = await response.json();

        if (rows.length > 0) {
          setResults(rows); // Guardamos para el Widget

          if (config.tipo_grafico !== 'widget') {
            const keys = Object.keys(rows[0]);
            setData({
              labels: rows.map(r => r[keys[0]] || 'Nulo'),
              datasets: [{
                label: config.titulo,
                data: rows.map(r => Number(r[keys[1]])),
                backgroundColor: config.tipo_grafico === 'pie' ? piePalette : mainColor,
                borderColor: '#ffffff',
                borderWidth: 1,
                borderRadius: config.tipo_grafico === 'bar' ? borderRadius : 0,
              }]
            });
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [config.query_sql, config.titulo, config.tipo_grafico]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: showLegend, labels: { color: '#805e00' } },
      title: {
        display: true,
        text: config.titulo,
        position: titlePos,
        color: '#00295f',
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
    <div className="info-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      
      {/* Título manual si no se usa el de Chart.js */}
      

      {/* Descripción ARRIBA */}
      {descPos === 'top' && config.descripcion && (
        <p className="subtitle" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{config.descripcion}</p>
      )}

      <div style={{ height: '300px', width: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading && <div className="spinner mini-spinner"></div>}
        {error && <p style={{ color: '#f43f5e' }}>{error}</p>}
        
        {!loading && !error && (
          config.tipo_grafico === 'widget' && results ? (
            /* RENDER WIDGET */
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: mainColor, fontSize: '4rem', fontWeight: 'bold', textShadow: `0 0 20px ${mainColor}33` }}>
                {results[0] ? Object.values(results[0])[0] : '0'}
              </div>
            </div>
          ) : (
            /* RENDER GRÁFICAS */
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

      {/* Descripción ABAJO */}
      {descPos === 'bottom' && config.descripcion && (
        <p className="subtitle" style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>{config.descripcion}</p>
      )}
    </div>
  );
};

// Componente Principal Dashboard
const DashboardPersonalized = () => {
  const [savedCharts, setSavedCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/my-charts')
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

  if (loading) return <div className="page-wrapper"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Dashboard Personalizado</h1>
      {savedCharts.length === 0 ? (
        <div className="info-card"><p className="empty-state">No hay métricas configuradas.</p></div>
      ) : (
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '20px'
        }}>
          {savedCharts.map(chart => (
            <ChartCard key={chart.grafica_id} config={chart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPersonalized;