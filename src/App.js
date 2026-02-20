import React, { useState, useEffect, useRef } from 'react';
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

// URL y key hardcoded para raw fetch (bypass Supabase client)
const SUPABASE_URL = 'https://rnbyxwcrtulxctplerqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnl4d2NydHVseGN0cGxlcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjQ3MjIsImV4cCI6MjA4NzAwMDcyMn0.gwWyvyqk8431wvejeswrnxND1g_EpMRNVx8JllU7o-g';

function DebugNoPerfil({ user, logout, refetchPerfil }) {
  const [debug, setDebug] = useState({ status: 'Probando...', results: [] });
  const [autoFixing, setAutoFixing] = useState(false);
  const triedAutoFix = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const addResult = (line) => {
      setDebug(prev => ({
        ...prev,
        results: [...prev.results, line]
      }));
    };

    const runTests = async () => {
      addResult(`Auth ID: ${user.id}`);
      addResult(`Auth email: ${user.email}`);

      // Test con RAW FETCH (bypass completo del cliente Supabase)
      try {
        addResult('--- Raw fetch test ---');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/usuarios?select=id,email,rol&limit=10`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        const rawData = await resp.json();
        addResult(`Raw fetch status: ${resp.status}`);
        addResult(`Raw fetch rows: ${rawData?.length || 0}`);

        if (Array.isArray(rawData)) {
          rawData.forEach(u => addResult(`  → ${u.email} | ${u.rol} | ${u.id?.substring(0,8)}...`));

          // Buscar match por email
          const match = rawData.find(u => u.email === user.email);
          if (match) {
            addResult(`✅ MATCH por email encontrado`);
            if (match.id !== user.id) {
              addResult(`⚠️ IDs DIFERENTES: auth=${user.id.substring(0,8)}... vs tabla=${match.id.substring(0,8)}...`);
            } else {
              addResult(`✅ IDs coinciden`);
            }
          } else {
            addResult(`❌ No hay match por email en la tabla`);
          }
        }

        // Auto-fix: si encontramos match por email pero IDs difieren, corregir
        if (!triedAutoFix.current && Array.isArray(rawData)) {
          const match = rawData.find(u => u.email === user.email);
          if (match && match.id !== user.id) {
            triedAutoFix.current = true;
            setAutoFixing(true);
            addResult('🔧 Auto-fix: actualizando ID en tabla...');
            try {
              const fixResp = await fetch(
                `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(user.email)}`,
                {
                  method: 'PATCH',
                  headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                  },
                  body: JSON.stringify({ id: user.id }),
                }
              );
              if (fixResp.ok) {
                addResult('✅ ID actualizado! Recargando...');
                setTimeout(() => window.location.reload(), 1500);
                return;
              } else {
                addResult(`❌ Fix failed: ${fixResp.status}`);
              }
            } catch (e) {
              addResult(`❌ Fix error: ${e.message}`);
            }
            setAutoFixing(false);
          } else if (match && match.id === user.id) {
            // IDs coinciden pero el Supabase client no encontro el perfil
            // Intentar refetch
            triedAutoFix.current = true;
            addResult('🔧 IDs coinciden, reintentando fetch perfil...');
            const p = await refetchPerfil();
            if (p) {
              addResult('✅ Perfil cargado! Recargando...');
              setTimeout(() => window.location.reload(), 1000);
              return;
            } else {
              addResult('❌ Refetch tambien fallo');
            }
          }
        }

      } catch (e) {
        if (e.name === 'AbortError') {
          addResult('❌ Raw fetch TIMEOUT (5s) - Supabase no responde');
        } else {
          addResult(`❌ Raw fetch ERROR: ${e.message}`);
        }
      }

      if (!cancelled) {
        setDebug(prev => ({ ...prev, status: 'Tests completados' }));
      }
    };

    runTests();
    return () => { cancelled = true; };
  }, [user, refetchPerfil]);

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
      <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>⚠️ Diagnóstico de perfil</p>
      {autoFixing && <p style={{ color: '#b8956a' }}>🔧 Corrigiendo automáticamente...</p>}
      <div style={{
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: 16,
        textAlign: 'left',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        maxWidth: 500,
        width: '100%',
        maxHeight: 350,
        overflow: 'auto',
        lineHeight: 1.6,
      }}>
        <div><b>{debug.status}</b></div>
        {debug.results.map((line, i) => (
          <div key={i} style={{
            color: line.includes('❌') || line.includes('⚠️') ? '#c4762a'
              : line.includes('✅') ? '#3d5c41'
              : line.includes('🔧') ? '#b8956a'
              : '#555'
          }}>
            {line}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
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

function AuthGate({ children }) {
  const { user, perfil, loading, logout, refetchPerfil } = useAuth();

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
    return <DebugNoPerfil user={user} logout={logout} refetchPerfil={refetchPerfil} />;
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
