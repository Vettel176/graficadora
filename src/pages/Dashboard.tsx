import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import './Charts.css'; // Reutilizamos tus estilos

// Sub-componente que ejecuta su propia lógica de datos
const ChartCard: React.FC<{ config: any }> = ({ config }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: config.query_sql }),
        });

        if (!response.ok) throw new Error('Error al cargar datos');
        const results = await response.json();

        if (results.length > 0) {
          const keys = Object.keys(results[0]);
          setData({
            labels: results.map((r: any) => r[keys[0]] || 'Nulo'),
            datasets: [{
              label: config.titulo,
              data: results.map((r: any) => Number(r[keys[1]])),
              backgroundColor: 'rgba(99, 102, 241, 0.5)',
              borderColor: '#6366f1',
              borderWidth: 1,
            }]
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [config.query_sql, config.titulo]);

  return (
    <div className="info-card" style={{ minHeight: '350px', marginBottom: '20px' }}>
      <h3 style={{ color: '#e2e8f0', marginBottom: '5px' }}>{config.titulo}</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '15px' }}>{config.descripcion}</p>

      <div style={{ height: '250px', position: 'relative' }}>
        {loading && <div className="spinner mini-spinner"></div>}
        {error && <p style={{ color: '#f43f5e' }}>{error}</p>}
        {data && (
          <>
            {config.tipo_grafico === 'bar' && <Bar data={data} options={{ maintainAspectRatio: false }} />}
            {config.tipo_grafico === 'pie' && <Pie data={data} />}
            {config.tipo_grafico === 'line' && <Line data={data} options={{ maintainAspectRatio: false }} />}
          </>
        )}
      </div>
    </div>
  );
};

// Componente Principal
const Dashboard: React.FC = () => {
  const [savedCharts, setSavedCharts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/my-charts')
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
      <h1 className="page-title">Mi Dashboard Personalizado</h1>
      <p className="subtitle">Visualización en tiempo real de tus métricas guardadas.</p>

      {savedCharts.length === 0 ? (
        <div className="info-card">
          <p className="empty-state">No tienes gráficas guardadas aún. Ve al configurador para crear una.</p>
        </div>
      ) : (
        <div className="dashboard-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
          gap: '20px'
        }}>
          {savedCharts.map(chartConfig => (
            <ChartCard key={chartConfig.grafica_id} config={chartConfig} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
