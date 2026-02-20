import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// Config para raw fetch (bypass del Supabase JS client)
const SUPABASE_URL = 'https://rnbyxwcrtulxctplerqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnl4d2NydHVseGN0cGxlcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjQ3MjIsImV4cCI6MjA4NzAwMDcyMn0.gwWyvyqk8431wvejeswrnxND1g_EpMRNVx8JllU7o-g';

async function rawQuery(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || '',
      },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return { data: null, error: `HTTP ${resp.status}` };
    const data = await resp.json();
    return { data, error: null };
  } catch (e) {
    clearTimeout(timeoutId);
    return { data: null, error: e.message };
  }
}

// Buscar perfil: por ID, luego por email, luego crear
async function queryPerfil(authUser) {
  if (!authUser?.id || !authUser?.email) return null;
  try {
    // Capa 1: Buscar por ID
    const { data: byIdArr } = await rawQuery(
      `usuarios?id=eq.${authUser.id}&select=*&limit=1`
    );
    if (Array.isArray(byIdArr) && byIdArr.length > 0) return byIdArr[0];

    // Capa 2: Buscar por email
    const { data: byEmailArr } = await rawQuery(
      `usuarios?email=eq.${encodeURIComponent(authUser.email)}&select=*&limit=1`
    );
    if (Array.isArray(byEmailArr) && byEmailArr.length > 0) {
      const found = byEmailArr[0];
      if (found.id !== authUser.id) {
        await rawQuery(
          `usuarios?email=eq.${encodeURIComponent(authUser.email)}`,
          { method: 'PATCH', body: { id: authUser.id }, prefer: 'return=minimal' }
        );
        found.id = authUser.id;
      }
      return found;
    }

    // Capa 3: Crear perfil
    const nombre = authUser.user_metadata?.full_name
      || authUser.user_metadata?.name
      || authUser.email.split('@')[0]
      || 'Usuario';
    const { data: created } = await rawQuery('usuarios', {
      method: 'POST',
      body: { id: authUser.id, nombre, email: authUser.email, rol: 'clienta' },
      prefer: 'return=representation',
    });
    if (Array.isArray(created) && created.length > 0) return created[0];

    return null;
  } catch (err) {
    console.error('Error cargando perfil:', err);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const perfilLoadedForRef = useRef(null); // Tracks which user ID we loaded perfil for

  // === EFECTO 1: Listener de auth (SOLO maneja user + loading) ===
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setPerfil(null);
        perfilLoadedForRef.current = null;
        setLoading(false);
        return;
      }

      // Para SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED: solo actualizamos user
      // El perfil se carga en el Efecto 2 (separado)
      setUser(session.user);
      setLoading(false);
    });

    // Timeout de seguridad
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => prev ? false : prev);
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // === EFECTO 2: Cargar perfil UNA SOLA VEZ cuando cambia el user.id ===
  useEffect(() => {
    if (!user?.id) return;

    // Si ya cargamos el perfil para este user, no volver a cargar
    if (perfilLoadedForRef.current === user.id) return;

    let cancelled = false;
    perfilLoadedForRef.current = user.id; // Marcar que estamos cargando para este user

    queryPerfil(user).then(p => {
      if (cancelled) return;
      if (p) {
        setPerfil(p);
      } else {
        // Si fallo, permitir reintento
        perfilLoadedForRef.current = null;
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    setUser(null);
    setPerfil(null);
    perfilLoadedForRef.current = null;
    setLoading(false);
    try { localStorage.removeItem('anabienestar-auth'); } catch (e) {}
  }, []);

  const refetchPerfil = useCallback(async () => {
    if (!user) return null;
    perfilLoadedForRef.current = null; // Reset para permitir recarga
    const p = await queryPerfil(user);
    if (p) setPerfil(p);
    return p;
  }, [user]);

  const value = {
    user,
    perfil,
    loading,
    login,
    logout,
    refetchPerfil,
    isAdmin: perfil?.rol === 'admin',
    isClienta: perfil?.rol === 'clienta',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
