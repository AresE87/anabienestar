import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Inicio', icon: '🏠' },
  { path: '/progreso', label: 'Progreso', icon: '📊' },
  { path: '/recetas', label: 'Recetas', icon: '🍽️' },
  { path: '/material', label: 'Material', icon: '📚' },
  { path: '/citas', label: 'Citas', icon: '📅' },
];

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map(({ path, label, icon }) => {
        const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
        return (
          <NavLink
            key={path}
            to={path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            end={path === '/'}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{icon}</span>
            <span className="bottom-nav__label">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default BottomNav;
