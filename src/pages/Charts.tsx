import React, { useEffect, useState } from 'react';
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
import { Bar, Pie, Line } from 'react-chartjs-2';
import './Charts.css';

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

interface SchemaData {
  [tableName: string]: string[];
}

const Charts: React.FC = () => {
  // --- Estados Originales ---
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [loadingSchema, setLoadingSchema] = useState<boolean>(true);
  const [errorSchema, setErrorSchema] = useState<string | null>(null);

  // --- Nuevos Estados para la Generación Manual ---
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [chartTitle, setChartTitle] = useState<string>('');
  const [chartDescription, setChartDescription] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [selectedTableRef, setSelectedTableRef] = useState<string>('');

  const [chartDataResults, setChartDataResults] = useState<any[] | null>(null);
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [errorChart, setErrorChart] = useState<string | null>(null);

  // Carga del esquema (Se mantiene igual)
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/schema');
        if (!response.ok) throw new Error('Error al obtener el esquema');
        const data = await response.json();
        setSchema(data);
      } catch (err: any) {
        setErrorSchema(err.message);
      } finally {
        setLoadingSchema(false);
      }
    };
    fetchSchema();
  }, []);

  // Nueva función para ejecutar el SQL Manual
  const handleExecuteManualQuery = async () => {
    if (!sqlQuery.trim()) {
      setErrorChart("Por favor, ingresa un query SQL.");
      return;
    }

    setLoadingChart(true);
    setErrorChart(null);

    try {
      const response = await fetch('http://localhost:3001/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al ejecutar el query');
      }

      const data = await response.json();
      setChartDataResults(data);
    } catch (err: any) {
      setErrorChart(err.message);
      setChartDataResults(null);
    } finally {
      setLoadingChart(false);
    }
  };

  const saveToDashboard = async () => {
    await fetch('http://localhost:3001/api/save-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: chartTitle,
        descripcion: chartDescription,
        tipo: chartType,
        sql: sqlQuery
      }),
    });
    alert("¡Gráfica guardada en el dashboard!");
  };

  // Procesador de datos para Chart.js (Adaptado para SQL dinámico)
  const generateChartJsData = () => {
    if (!chartDataResults || chartDataResults.length === 0) return null;

    // Tomamos la primera columna como label y la segunda como valor
    const keys = Object.keys(chartDataResults[0]);
    const labels = chartDataResults.map(row => row[keys[0]] === null ? 'Nulo' : String(row[keys[0]]));
    const dataPoints = chartDataResults.map(row => Number(row[keys[1]]));

    return {
      labels,
      datasets: [
        {
          label: chartTitle || 'Resultado',
          data: dataPoints,
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderRadius: 6,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)'
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#e2e8f0' } },
      title: {
        display: !!chartTitle,
        text: chartTitle,
        color: '#e2e8f0',
        font: { size: 18 }
      },
    },
    scales: chartType !== 'pie' ? {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    } : {}
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Generador de Gráficas SQL</h1>
      <p className="subtitle">Escribe tu consulta personalizada y visualiza los resultados al instante.</p>

      {loadingSchema ? (
        <div className="loader-container"><div className="spinner"></div></div>
      ) : errorSchema ? (
        <div className="error-message"><p>Error: {errorSchema}</p></div>
      ) : (
        <div className="card-container">

          {/* PANEL DE CONFIGURACIÓN RE-DISEÑADO */}
          <div className="info-card elegant-gradient configuration-panel">
            <h2>Configuración del Gráfico</h2>

            <div className="input-group-vertical" style={{ gap: '15px' }}>
              {/* Ayuda visual de Esquema */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  className="elegant-select"
                  onChange={(e) => setSelectedTableRef(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Ver columnas de tabla --</option>
                  {schema && Object.keys(schema).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {selectedTableRef && (
                  <select className="elegant-select" style={{ flex: 1 }}>
                    {schema![selectedTableRef].map(col => <option key={col}>{col}</option>)}
                  </select>
                )}
              </div>

              {/* Título y Descripción */}
              <input
                type="text"
                className="elegant-select" // Reutilizando tu estilo de input
                style={{ padding: '10px' }}
                placeholder="Título del Gráfico"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
              />
              <textarea
                className="elegant-select"
                style={{ padding: '10px', minHeight: '60px', color: 'white' }}
                placeholder="Descripción del gráfico..."
                value={chartDescription}
                onChange={(e) => setChartDescription(e.target.value)}
              />

              {/* Tipo de Gráfico */}
              <select
                className="elegant-select"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
              >
                <option value="bar">Gráfico de Barras</option>
                <option value="pie">Gráfico de Pastel</option>
                <option value="line">Gráfico de Líneas</option>
              </select>

              {/* SQL TEXT AREA */}
              <div className="combobox-group">
                <label className="combobox-label">Consulta SQL (SELECT columna1, columna2 ...)</label>
                <textarea
                  className="elegant-select"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    fontFamily: 'monospace',
                    backgroundColor: '#1e293b',
                    color: '#60a5fa'
                  }}
                  placeholder="Ej: SELECT nombre, edad FROM empresa.usuarios LIMIT 10"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                />
              </div>

              <button
                className="btn-primary"
                disabled={loadingChart}
                onClick={handleExecuteManualQuery}
              >
                {loadingChart ? 'Procesando...' : 'Generar Gráfico'}
              </button>
            </div>
          </div>
          <div>
            <button onClick={saveToDashboard}>Guardar en Dashboard</button>
          </div>

          {/* PANEL DE RESULTADO */}
          {(chartDataResults || loadingChart || errorChart) && (
            <div className="chart-wrapper info-card">
              {loadingChart && <div className="loader-container chart-loader"><div className="spinner mini-spinner"></div></div>}

              {errorChart && !loadingChart && (
                <div className="error-message" style={{ border: '1px solid #f43f5e' }}>
                  <p>Error en SQL: {errorChart}</p>
                </div>
              )}

              {!loadingChart && !errorChart && chartDataResults && (
                <div className="chart-canvas-container">
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#e2e8f0', margin: 0 }}>{chartTitle}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{chartDescription}</p>
                  </div>

                  {chartDataResults.length === 0 ? (
                    <p className="empty-state">No se encontraron registros.</p>
                  ) : (
                    <div style={{ height: '400px', position: 'relative' }}>
                      {chartType === 'bar' && <Bar options={chartOptions as any} data={generateChartJsData() as any} />}
                      {chartType === 'pie' && <Pie options={chartOptions as any} data={generateChartJsData() as any} />}
                      {chartType === 'line' && <Line options={chartOptions as any} data={generateChartJsData() as any} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Charts;