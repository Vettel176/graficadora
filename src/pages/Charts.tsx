import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Charts: React.FC = () => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e2e8f0',
        }
      },
      title: {
        display: true,
        text: 'Ventas Semanales',
        color: '#e2e8f0',
        font: { size: 18 }
      },
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: [1200, 1900, 1500, 2200, 1800, 2800, 2400],
        backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo
        borderRadius: 6,
      },
      {
        label: 'Gastos',
        data: [800, 1200, 1100, 1500, 1000, 1600, 1300],
        backgroundColor: 'rgba(236, 72, 153, 0.8)', // Pink
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Gráficas</h1>
      <div className="card-container">
        <div className="chart-card">
          <Bar options={options} data={data} height={100} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
