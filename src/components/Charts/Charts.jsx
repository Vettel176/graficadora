import  { useState } from 'react';
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



const Charts = () => {
  //--- Personalizacion Grafica
  const [designConfig, setDesignConfig] = useState({
    mainColor: '#6366f1',
    titlePosition: 'top',
    descriptionPosition: 'top',
    showLegend: true,
    borderRadius: 6
  });


  // --- Nuevos Estados para la Generación Manual ---
  const [sqlQuery, setSqlQuery] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [chartType, setChartType] = useState('bar');

  const [chartDataResults, setChartDataResults] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [errorChart, setErrorChart] = useState(null);

  //Personalizacion Grafica real-time Fase 2
  const dynamicOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: designConfig.showLegend,
        position: 'bottom', // Puedes hacerlo dinámico también
      },
      title: {
        display: true,
        text: chartTitle || 'Vista Previa del Título',
        position: designConfig.titlePosition, //Titulo interno
        color: '#001531',
        font: { size: 18 }
      },
    },
    scales: chartType !== 'pie' ? {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
    } : {}
  };



  // Nueva función para ejecutar el SQL Manual
  const handleExecuteManualQuery = async () => {
    if (!sqlQuery.trim()) {
      setErrorChart("Por favor, ingresa un query SQL.");
      return;
    }

    setLoadingChart(true);
    setErrorChart(null);

    try {
      const response = await fetch('/api/execute', {
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
    } catch (err) {
      setErrorChart(err.message);
      setChartDataResults(null);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleSave = async () => {
    const payload = {
      titulo: chartTitle,
      descripcion: chartDescription,
      tipo: chartType,
      sql: sqlQuery,
      config_extra: {
        main_color: designConfig.mainColor,
        title_position: designConfig.titlePosition,
        description_position: designConfig.descriptionPosition,
        show_legend: designConfig.showLegend,
        border_radius: designConfig.borderRadius
      }
    };
  
    await fetch('/api/save-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    alert("Gráfica guardada con estilo personalizado.");
  };

  // Procesador de datos para Chart.js (Adaptado para SQL dinámico)
  const generateChartJsData = () => {
    if (!chartDataResults || chartDataResults.length === 0) return null;

    const keys = Object.keys(chartDataResults[0]);
    const labels = chartDataResults.map(row => row[keys[0]] === null ? 'Nulo' : String(row[keys[0]]));
    const dataPoints = chartDataResults.map(row => Number(row[keys[1]]));

    const piePalette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
    return {
      labels,
      datasets: [
        {
          label: chartTitle || 'Resultado',
          data: dataPoints,
          // USAMOS EL COLOR DEL ESTADO designConfig
          backgroundColor: chartType === 'pie' ? piePalette : designConfig.mainColor,
          borderRadius: designConfig.borderRadius,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)'
        },
      ],
    };
  };



  return (
    <div className="page-wrapper">
        <div className="card-container">

          {/* PANEL DE CONFIGURACIÓN RE-DISEÑADO */}
          <div className="info-card elegant-gradient configuration-panel">
            <div className="input-group-vertical" style={{ gap: '15px' }}>

              {/* Título*/}
              <div className="input-row">
                <input
                  type="text"
                  className="elegant-input"
                  placeholder="Título del Gráfico"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                />
              {/* Tipo de Grafica*/}
                <select
                  className="elegant-select"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="bar">Gráfico de Barras</option>
                  <option value="pie">Gráfico de Pastel</option>
                  <option value="line">Gráfico de Líneas</option>
                  <option value="widget">Widget</option>
                </select>
              </div>

              {/* Descripcion */}
              <textarea
                className="elegant-area"
                placeholder="Descripción del gráfico..."
                value={chartDescription}
                onChange={(e) => setChartDescription(e.target.value)}
              />


              {/* SQL */}
              <div className="combobox-group">
                <label className="combobox-label">Consulta SQL</label>
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

          {/* DISEÑO EXTRA */}
          <div className="design-controls" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
  
            <div className="input-group-vertical">
              <label className="combobox-label">Color Principal</label>
              <input 
                type="color" 
                value={designConfig.mainColor}
                onChange={(e) => setDesignConfig({...designConfig, mainColor: e.target.value})}
                style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
            </div>

            <div className="input-group-vertical">
              <label className="combobox-label">Posición del Título</label>
              <select 
                className="elegant-select"
                value={designConfig.titlePosition}
                onChange={(e) => setDesignConfig({...designConfig, titlePosition: e.target.value})}
              >
                <option value="top">Arriba</option>
                <option value="bottom">Abajo</option>
                <option value="left">Izquierda</option>
                <option value="right">Derecha</option>
              </select>
            </div>

            <div className="input-group-vertical">
              <label className="combobox-label">Posición de Descripción</label>
              <select 
                className="elegant-select"
                value={designConfig.descriptionPosition}
                onChange={(e) => setDesignConfig({...designConfig, descriptionPosition: e.target.value})}
              >
                <option value="top">Arriba</option>
                <option value="bottom">Debajo</option>
              </select>
            </div>

            <div className="input-group-vertical">
              <label className="combobox-label">Bordes Redondeados</label>
              <input 
                type="range" min="0" max="20" 
                value={designConfig.borderRadius}
                onChange={(e) => setDesignConfig({...designConfig, borderRadius: parseInt(e.target.value)})}
              />
            </div>

          <div>
            <button className="btn-primary" onClick={handleSave}>Guardar en Dashboard</button>
          </div>
            <div className="input-group-vertical" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                checked={designConfig.showLegend} 
                onChange={(e) => setDesignConfig({...designConfig, showLegend: e.target.checked})}
              />
              <label className="combobox-label">Mostrar Leyenda</label>
            </div>
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
                  
                  <div style={{ height: '400px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {chartType === 'widget' ? (
                      /* --- VISTA PREVIA DE WIDGET (KPI) --- */
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ 
                          color: designConfig.mainColor, 
                          fontSize: '7rem', 
                          fontWeight: 'bold',
                          lineHeight: '1',
                          textShadow: `0 0 25px ${designConfig.mainColor}44` 
                        }}>
                          {/* Muestra el primer valor encontrado en el primer registro */}
                          {chartDataResults[0] ? Object.values(chartDataResults[0])[0] : '0'}
                        </div>
                        {/* Etiqueta del Widget opcional en la parte inferior */}
                        <p style={{ color: '#d3bf0f', fontSize: '1.4rem', marginTop: '10px' }}>
                          {chartTitle || 'Total'}
                        </p>
                      </div>
                    ) : (
                      /* --- VISTA PREVIA DE GRÁFICAS (Chart.js) --- */
                      <>
                        {chartType === 'bar' && <Bar options={dynamicOptions} data={generateChartJsData()} />}
                        {chartType === 'pie' && <Pie options={dynamicOptions} data={generateChartJsData()} />}
                        {chartType === 'line' && <Line options={dynamicOptions} data={generateChartJsData()} />}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
    </div>
  );
};

export default Charts;