import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// Config para raw fetch (bypass del Supabase JS client que se cuelga en queries)
const SUPABASE_URL = 'https://rnbyxwcrtulxctplerqs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnl4d2NydHVseGN0cGxlcnFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MjQ3MjIsImV4cCI6MjA4NzAwMDcyMn0.gwWyvyqk8431wvejeswrnxND1g_EpMRNVx8JllU7o-g';

// Helper: raw fetch a Supabase REST API con timeout de 5s
async function rawQuery(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || '',
        ...options.headers,
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const eventSeqRef = useRef(0);

  // Buscar perfil usando RAW FETCH (no Supabase JS client)
  const queryPerfil = useCallback(async (authUser) => {
    if (!authUser?.id || !authUser?.email) return null;
    try {
      // Capa 1: Buscar por ID
      const { data: byIdArr } = await rawQuery(
        `usuarios?id=eq.${authUser.id}&select=*&limit=1`
      );
      if (Array.isArray(byIdArr) && byIdArr.length > 0) {
        return byIdArr[0];
      }

      // Capa 2: Buscar por email
      const { data: byEmailArr } = await rawQuery(
        `usuarios?email=eq.${encodeURIComponent(authUser.email)}&select=*&limit=1`
      );
      if (Array.isArray(byEmailArr) && byEmailArr.length > 0) {
        const found = byEmailArr[0];
        // Actualizar ID si no coincide
        if (found.id !== authUser.id) {
          await rawQuery(
            `usuarios?email=eq.${encodeURIComponent(authUser.email)}`,
            { method: 'PATCH', body: { id: authUser.id }, prefer: 'return=minimal' }
          );
          found.id = authUser.id;
        }
        return found;
      }

      // Capa 3: Crear perfil automaticamente
      const nombre = authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || authUser.email.split('@')[0]
        || 'Usuario';
      const { data: created } = await rawQuery('usuarios', {
        method: 'POST',
        body: { id: authUser.id, nombre, email: authUser.email, rol: 'clienta' },
        prefer: 'return=representation',
      });
      if (Array.isArray(created) && created.length > 0) {
        return created[0];
      }

      return null;
    } catch (err) {
      console.error('Error cargando perfil:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        eventSeqRef.current++;
        setUser(null);
        setPerfil(null);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        const mySeq = ++eventSeqRef.current;

        setUser(session.user);
        const p = await queryPerfil(session.user);
        if (!isMounted || mySeq !== eventSeqRef.current) return;

        if (p) setPerfil(p);
        setLoading(false);
      }
    });

    // Disparar carga inicial
    supabase.auth.getSession().then(({ error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('Error restaurando sesion:', error.message);
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setPerfil(null);
        setLoading(false);
      }
    });

    // Timeout de seguridad
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => {
          if (prev) {
            console.warn('Auth timeout: forzando fin de carga');
            return false;
          }
          return prev;
        });
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [queryPerfil]);

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
    setLoading(false);
    try { localStorage.removeItem('anabienestar-auth'); } catch (e) {}
  }, []);

  const refetchPerfil = useCallback(async () => {
    if (!user) return null;
    const p = await queryPerfil(user);
    if (p) setPerfil(p);
    return p;
  }, [user, queryPerfil]);

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
