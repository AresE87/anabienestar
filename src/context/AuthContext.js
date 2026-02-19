import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const fetchPerfil = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setPerfil(null);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) console.error('Error query perfil (puede ser RLS):', error);
      if (!error && data) {
        setPerfil(data);
        return data;
      }
      setPerfil(null);
      return null;
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setPerfil(null);
      return null;
    }
  }, []);

  // Unico listener: onAuthStateChange maneja TODO (login, logout, refresh, sesion inicial)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setPerfil(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      // Cargar perfil solo en estos eventos relevantes
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        const p = await fetchPerfil(session.user);
        if (!p) {
          // Tiene sesion auth pero no perfil en tabla usuarios
          setUser(session.user); // mantener user para mostrar mensaje "sin perfil"
          setPerfil(null);
        }
      }

      setLoading(false);
    });

    // Disparar la carga inicial — getSession emite INITIAL_SESSION via onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Si no hay sesion, onAuthStateChange no dispara, asi que resolvemos aqui
      if (!session && !initializedRef.current) {
        initializedRef.current = true;
        setUser(null);
        setPerfil(null);
        setLoading(false);
      }
    });

    // Timeout de seguridad: si loading sigue en true despues de 8s, forzar resolucion
    const timeout = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('Auth timeout: forzando fin de carga');
          return false;
        }
        return prev;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchPerfil]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
    // onAuthStateChange se encarga del resto (perfil, loading=false)
    return data;
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setLoading(false);
  }, []);

  const value = {
    user,
    perfil,
    loading,
    login,
    logout,
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
