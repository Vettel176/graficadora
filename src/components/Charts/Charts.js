import  { useState, useEffect } from 'react';
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
import { blue, green, red, yellow } from '@mui/material/colors';

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



const Charts = ({ editData, onFinished }) => {

  useEffect(() => {
    if (editData) {
      // 1. Parseamos config_extra (si viene como string desde Postgres)
      const extra = typeof editData.config_extra === 'string' 
        ? JSON.parse(editData.config_extra) 
        : editData.config_extra;

      // 2. Rellenamos el formulario con lo que ya existía
      setChartTitle(editData.titulo || '');
      setChartType(editData.tipo_grafico || 'bar');
      setSqlQuery(editData.query_sql || '');

      // 3. Rellenamos los estilos y parámetros dinámicos
      setDesignConfig({
        colors: extra.colors || [green],
        titleColor: extra.title_color || '#001531',
        titlePosition: extra.title_position || 'top',
        showLegend: extra.show_legend ?? true,
        borderRadius: extra.border_radius || 6
      });

      const params = extra.dynamic_params || [];
      setDynamicParams(params);

    }
  }, [editData]);

  //--- Personalizacion Grafica
  const [designConfig, setDesignConfig] = useState({
    colors: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'], 
    titleColor: '#001531',
    titlePosition: 'top',
    showLegend: true,
    borderRadius: 6
  });

  const updateColor = (index, newColor) => {
  const newColors = [...designConfig.colors];
  newColors[index] = newColor;
  setDesignConfig({ ...designConfig, colors: newColors });
  };


  // --- Nuevos Estados para la Generación Manual ---
  const [sqlQuery, setSqlQuery] = useState('');
  const [chartTitle, setChartTitle] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [chartType, setChartType] = useState('bar');

  const [chartDataResults, setChartDataResults] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [errorChart, setErrorChart] = useState(null);

  //Logica Parametros Dinamicos
  const [dynamicParams, setDynamicParams] = useState([]);

  const addParam = () => {
    setDynamicParams([
      ...dynamicParams, 
      { id: Date.now(), key: '', label: '', type: 'text', value: '' }]);
  };

  const updateParam = (id, field, val) => {
    setDynamicParams(dynamicParams.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const removeParam = (id) => {
    setDynamicParams(dynamicParams.filter(p => p.id !== id));
  };

  const prepareSql = (rawSql, params) => {
  let finalSql = rawSql;
  params.forEach(param => {
    // Reemplaza todas las ocurrencias de {{key}} por el valor
    const regex = new RegExp(`{{${param.key}}}`, 'g');
    finalSql = finalSql.replace(regex, param.value);
  });
  return finalSql;
};

  //Personalizacion Grafica real-time Fase 2
const dynamicOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        // Forzar visualización si hay más de 1 serie de datos
        display: (chartDataResults && Object.keys(chartDataResults[0]).length > 2) 
                  ? true 
                  : designConfig.showLegend,
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: chartTitle || 'Vista Previa del Título',
        position: designConfig.titlePosition,
        color: designConfig.titleColor,
        font: { 
          size: 18,
          weight: 'bold' 
        }
      },
      // Tip: Tooltip
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#60a5fa',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1
      }
    },
    scales: chartType !== 'pie' && chartType !== 'widget' ? {
      y: { 
        beginAtZero: true, // Importante para no sesgar los datos
        ticks: { color: '#94a3b8' }, 
        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
      },
      x: { 
        ticks: { color: '#94a3b8' }, 
        grid: { color: 'rgba(255, 255, 255, 0.05)' } 
      }
    } : {}
  };



  // función para ejecutar el SQL Manual
  const handleExecuteManualQuery = async () => {
    if (!sqlQuery.trim()) {
      setErrorChart("Por favor, ingresa un query SQL.");
      return;
    }
    console.log("SQL Query......."+sqlQuery)
    const sqlFinal = injectParams(sqlQuery, dynamicParams);
    console.log("SQL que se enviará al servidor:", sqlFinal);
    setLoadingChart(true);
    setErrorChart(null);

    try {
      const response = await fetch('/api/graphics/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlFinal }),
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

const injectParams = (sql, params) => {
  // SEGURIDAD 1: Forzamos a que siempre sea un String. 
  // Si llega null o undefined, se convierte en ""
  let processedSql = String(sql || ""); 

  // SEGURIDAD 2: Si el SQL está vacío, no perdemos tiempo procesando
  if (!processedSql || processedSql === "[object Object]") {
    console.warn("Advertencia: El SQL llegó vacío o como un objeto inválido.");
    return "";
  }

  // SEGURIDAD 3: Validamos que params sea un array antes de iterar
  if (!params || !Array.isArray(params)) return processedSql;

  params.forEach(p => {
    // Solo procesamos si la key existe para evitar errores de RegExp
    if (p && p.key) {
      try {
        const regex = new RegExp(`{{${p.key}}}`, 'g');
        
        // SEGURIDAD 4: Forzamos que el valor a inyectar sea String
        const valToInject = String(p.value !== undefined && p.value !== null ? p.value : "");
        
        processedSql = processedSql.replace(regex, valToInject);
      } catch (e) {
        console.error("Error al inyectar parámetro:", p.key, e);
      }
    }
  });

  return processedSql;
};

  const handleSave = async () => {
    const isEditing = !!editData?.grafica_id;

    const payload = {
      grafica_id: editData?.grafica_id,
      titulo: chartTitle,
      tipo_grafico: chartType,
      query_sql: sqlQuery,
      config_extra: {
        colors: designConfig.colors,
        title_color: designConfig.titleColor,
        title_position: designConfig.titlePosition,
        show_legend: designConfig.showLegend,
        border_radius: designConfig.borderRadius,
        dynamic_params: dynamicParams
      }
    };
  
  try {
      const response = await fetch('/api/graphics/handler', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(isEditing ? "Gráfica actualizada" : "Gráfica guardada");
        if (onFinished) onFinished();
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    }
};

  // Procesador de datos para Chart.js (Adaptado para SQL dinámico)
    const generateChartJsData = () => {
      if (!chartDataResults || chartDataResults.length === 0) return null;
    
      const keys = Object.keys(chartDataResults[0]);

      //En caso de haber valores nullos

      const labels = chartDataResults.map(row => {
      const val = row[keys[0]];
      return val !== null && val !== undefined ? String(val) : "Nulo";
      });
      console.log("Generando Grafica......")
      const datasets = keys.slice(1).map((key, index) => ({
        label: String(key),
        data: chartDataResults.map(row => {
        const val = row[key];
        // Si el valor no es un número válido, ponemos 0 para no romper el gráfico
        const num = Number(val);
        return isNaN(num) ? 0 : num;
        }),
        // Usamos el color del array, o uno por defecto si no existe
        backgroundColor: chartType === 'pie' 
          ? ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'] // El pie suele ser multicolor
          : (designConfig.colors[index] || '#6366f1'),
        borderColor: '#ffffff',
        borderWidth: 1,
        borderRadius: chartType === 'bar' ? designConfig.borderRadius : 0,
      }));
    
      return { labels, datasets };
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
              <div className="dynamic-params-section">
                <label className="combobox-label">Parámetros Dinámicos Usa : {'{{parametro}}'} en SQL</label>
                <div></div>
                {dynamicParams.map((param) => (
                  <div key={param.id} className="input-row" style={{ marginBottom: '10px' }}>
                    <input 
                      placeholder="key (ej: fecha)" 
                      className="elegant-input" 
                      value={param.key}
                      onChange={(e) => updateParam(param.id, 'key', e.target.value)}
                    />
                    <select 
                      className="elegant-select"
                      value={param.type}
                      onChange={(e) => updateParam(param.id, 'type', e.target.value)}
                    >
                      <option value="text">Texto</option>
                      <option value="date">Fecha</option>
                      <option value="number">Número</option>
                    </select>
                    <input 
                      placeholder="Valor prueba" 
                      className="elegant-input"
                      value={param.value}
                      onChange={(e) => updateParam(param.id, 'value', e.target.value)}
                    />
                    {/* BOTÓN DE ELIMINAR (Icono de Menos) */}
                      <button 
                        type="button" 
                        onClick={() => removeParam(param.id)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold',
                          marginLeft: '10px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                        title="Quitar parámetro"
                      >
                        −
                      </button>
                  </div>
                ))}
                <button type="button" onClick={addParam} className="btn-primary">Agregar Parámetro +</button>
              </div>
                <hr></hr>
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
          <div className="design-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>

            {chartDataResults && chartDataResults.length > 0 && 
              Object.keys(chartDataResults[0]).slice(1).map((columnName, index) => (
                <div key={columnName} className="input-group-vertical">
                  <label className="combobox-label">Color: {columnName}</label>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={designConfig.colors[index] || '#6366f1'} 
                      onChange={(e) => updateColor(index, e.target.value)}
                      style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Serie {index + 1}</span>
                  </div>
                </div>
              ))
            }
            <div className="input-group-vertical">
              <label className="combobox-label">Color Título</label>
              <input 
                type="color" 
                value={designConfig.titleColor}
                onChange={(e) => setDesignConfig({...designConfig, titleColor: e.target.value})}
                style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
            </div>

            <div className="input-group-vertical">
              <label className="combobox-label">Posición Título </label>
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
              <label className="combobox-label">Bordes Redondeados</label>
              <input 
                type="range" min="0" max="20" 
                value={designConfig.borderRadius}
                onChange={(e) => setDesignConfig({...designConfig, borderRadius: parseInt(e.target.value)})}
              />
              <div></div>
              <input 
                type="checkbox" 
                checked={designConfig.showLegend} 
                onChange={(e) => setDesignConfig({...designConfig, showLegend: e.target.checked})}
              />
              <label className="combobox-label">Leyendas</label>
            </div>

          <div>
            <button className="btn-primary" 
              onClick={handleSave}
              disabled={!chartDataResults || chartDataResults.length === 0 || loadingChart}
              style={{
                opacity: (!chartDataResults || chartDataResults.length === 0 || loadingChart) ? 0.5 : 1,
                cursor: (!chartDataResults || chartDataResults.length === 0 || loadingChart) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loadingChart ? 'Esperando Preview...' : 'Guardar en Dashboard'}
            </button>
          </div>
            <div className="input-group-vertical" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>

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
                      <div style={{ textAlign: 'center', width: '300px' }}>
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