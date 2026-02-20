import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './screens/Home';
import Progreso from './screens/Progreso';
import Recetas from './screens/Recetas';
import Material from './screens/Material';
import Citas from './screens/Citas';
import Chat from './screens/Chat';
import Admin from './screens/Admin';
import Login from './screens/Login';
import BottomNav from './components/BottomNav';

function AuthGate({ children }) {
  const { user, perfil, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f4ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Jost', sans-serif",
        color: '#3d5c41',
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!perfil) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8f4ee',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: "'Jost', sans-serif",
        color: '#3d5c41',
        textAlign: 'center',
        gap: 16,
      }}>
        <p>Cargando perfil...</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#7a9e7e', color: 'white', border: 'none', borderRadius: 8, fontFamily: "'Jost', sans-serif", cursor: 'pointer' }}
          >
            🔄 Reintentar
          </button>
          <button
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
            style={{ padding: '10px 20px', background: '#c4762a', color: 'white', border: 'none', borderRadius: 8, fontFamily: "'Jost', sans-serif", cursor: 'pointer' }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
}

function ProtectedApp() {
  const { perfil } = useAuth();

  if (perfil?.rol === 'admin') {
    return (
      <div className="admin-wrapper">
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    );
  }

  if (perfil?.rol === 'clienta') {
    return (
      <div className="mobile-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/material" element={<Material />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/admin/*" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <AppProvider>
              <ProtectedApp />
            </AppProvider>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
