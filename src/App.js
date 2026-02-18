import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Home from './screens/Home';
import Progreso from './screens/Progreso';
import Recetas from './screens/Recetas';
import Material from './screens/Material';
import Citas from './screens/Citas';
import Admin from './screens/Admin';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <Router>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/material" element={<Material />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <BottomNav />
      </AppProvider>
    </Router>
  );
}

export default App;
