import React from 'react';

const Products: React.FC = () => {
  return (
    <div className="page-wrapper">
      <h1 className="page-title">Productos</h1>
      <div className="card-container">
        <div className="info-card">
          <h2>Catálogo de Productos</h2>
          <p>Estás en el módulo de Productos. Administra y revisa tu inventario aquí.</p>
        </div>
      </div>
    </div>
  );
};

export default Products;
