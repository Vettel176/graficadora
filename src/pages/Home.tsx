import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="page-wrapper">
      <h1 className="page-title">Página de Inicio</h1>
      <div className="card-container">
        <div className="info-card elegant-gradient">
          <h2>Bienvenido al Sistema</h2>
          <p>Estás en el módulo de Inicio. Aquí puedes ver un resumen de tu actividad reciente.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
