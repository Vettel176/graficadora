import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import InventoryIcon from '@mui/icons-material/Inventory';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

interface SidebarProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, toggleSidebar }) => {
  const menuItems = [
    { path: '/', name: 'Inicio', icon: <HomeIcon /> },
    { path: '/dashboard', name: 'Dashboard', icon: <InventoryIcon /> },
    { path: '/graficas', name: 'Gráficas', icon: <BarChartIcon /> },
    { path: '/configuracion', name: 'Configuración', icon: <SettingsIcon /> },
  ];

  return (
    <aside className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <AutoGraphIcon className="logo-icon" />
          {isExpanded && <span className="logo-text">Systema</span>}
        </div>
        <button onClick={toggleSidebar} className="toggle-btn" aria-label="Toggle Sidebar">
          {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {isExpanded && <span className="nav-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
