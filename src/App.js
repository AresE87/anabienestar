import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './supabaseClient';
import Home from './screens/Home';
import Progreso from './screens/Progreso';
import Recetas from './screens/Recetas';
import Material from './screens/Material';
import Citas from './screens/Citas';
import Chat from './screens/Chat';
import Admin from './screens/Admin';
import Login from './screens/Login';
import BottomNav from './components/BottomNav';

function DebugNoPerfil({ user, logout }) {
  const [debug, setDebug] = useState({ status: 'Probando...', results: [] });

  useEffect(() => {
    const runTests = async () => {
      const results = [];

      // Test 1: Info del usuario auth
      results.push(`Auth user ID: ${user?.id || 'NULL'}`);
      results.push(`Auth email: ${user?.email || 'NULL'}`);

      // Test 2: Query directa a usuarios (sin filtro)
      try {
        const { data: allUsers, error: allErr } = await supabase
          .from('usuarios')
          .select('id, email, rol')
          .limit(10);
        if (allErr) {
          results.push(`Query ALL usuarios ERROR: ${allErr.message} (code: ${allErr.code})`);
        } else {
          results.push(`Query ALL usuarios: ${allUsers?.length || 0} filas`);
          allUsers?.forEach(u => results.push(`  → ${u.email} | ${u.rol} | ${u.id}`));
        }
      } catch (e) {
        results.push(`Query ALL usuarios CATCH: ${e.message}`);
      }

      // Test 3: Query por ID
      try {
        const { data: byId, error: idErr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle();
        if (idErr) {
          results.push(`Query por ID ERROR: ${idErr.message} (code: ${idErr.code})`);
        } else {
          results.push(`Query por ID: ${byId ? `ENCONTRADO (${byId.email})` : 'NULL - NO ENCONTRADO'}`);
        }
      } catch (e) {
        results.push(`Query por ID CATCH: ${e.message}`);
      }

      // Test 4: Query por email
      try {
        const { data: byEmail, error: emailErr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', user?.email)
          .maybeSingle();
        if (emailErr) {
          results.push(`Query por email ERROR: ${emailErr.message} (code: ${emailErr.code})`);
        } else {
          results.push(`Query por email: ${byEmail ? `ENCONTRADO (id: ${byEmail.id})` : 'NULL - NO ENCONTRADO'}`);
          if (byEmail && byEmail.id !== user?.id) {
            results.push(`⚠️ IDs NO COINCIDEN: auth=${user?.id} vs tabla=${byEmail.id}`);
          }
        }
      } catch (e) {
        results.push(`Query por email CATCH: ${e.message}`);
      }

      // Test 5: Session actual
      try {
        const { data: { session } } = await supabase.auth.getSession();
        results.push(`Session: ${session ? 'ACTIVA' : 'NULL'}`);
        if (session) {
          results.push(`Token expira: ${new Date(session.expires_at * 1000).toLocaleString()}`);
        }
      } catch (e) {
        results.push(`Session CATCH: ${e.message}`);
      }

      setDebug({ status: 'Tests completados', results });
    };
    if (user) runTests();
  }, [user]);

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
      <p style={{ fontWeight: 'bold' }}>⚠️ Debug: No se encontró perfil</p>
      <div style={{
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 16,
        textAlign: 'left',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        maxWidth: 500,
        width: '100%',
        maxHeight: 400,
        overflow: 'auto',
      }}>
        <div><b>{debug.status}</b></div>
        {debug.results.map((line, i) => (
          <div key={i} style={{ marginTop: 4, color: line.includes('ERROR') || line.includes('NULL - NO') || line.includes('⚠️') ? '#c4762a' : '#3d5c41' }}>
            {line}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '10px 20px', background: '#7a9e7e', color: 'white', border: 'none', borderRadius: 8, fontFamily: "'Jost', sans-serif", cursor: 'pointer' }}
        >
          🔄 Reintentar
        </button>
        <button
          onClick={async () => { localStorage.clear(); await logout(); window.location.reload(); }}
          style={{ padding: '10px 20px', background: '#c4762a', color: 'white', border: 'none', borderRadius: 8, fontFamily: "'Jost', sans-serif", cursor: 'pointer' }}
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </div>
  );
}

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
    return <DebugNoPerfil user={user} logout={logout} />;
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
