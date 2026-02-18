import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Home from './screens/Home';
import Progreso from './screens/Progreso';
import Recetas from './screens/Recetas';
import Material from './screens/Material';
import Citas from './screens/Citas';
import Admin from './screens/Admin';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    if (isAdmin) {
      document.body.classList.add('admin-mode');
      document.getElementById('root').style.maxWidth = '100%';
      document.getElementById('root').style.boxShadow = 'none';
    } else {
      document.body.classList.remove('admin-mode');
      document.getElementById('root').style.maxWidth = '390px';
      document.getElementById('root').style.boxShadow = '0 0 40px rgba(0, 0, 0, 0.2)';
    }
  }, [isAdmin]);

  return (
    <div className={`app-container ${isAdmin ? 'admin-mode' : ''}`}>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/material" element={<Material />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      {!isAdmin && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
