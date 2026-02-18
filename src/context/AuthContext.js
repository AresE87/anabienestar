import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

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

      console.log('Perfil:', data);
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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        console.log('Session:', session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            const p = await fetchPerfil(session.user);
            if (!p) setUser(null);
          } catch (e) {
            console.error('Error en carga inicial de perfil:', e);
            setPerfil(null);
            setUser(null);
          }
        } else {
          setPerfil(null);
        }
      } finally {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Error getSession:', err);
      setUser(null);
      setPerfil(null);
      setLoading(false);
    });
  }, [fetchPerfil]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('Session:', session);
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setPerfil(null);
          setLoading(false);
          return;
        }
        setUser(session.user);
        try {
          const p = await fetchPerfil(session.user);
          if (!p) setUser(null);
        } catch (e) {
          console.error('Error en onAuthStateChange perfil:', e);
          setPerfil(null);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchPerfil]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) await fetchPerfil(data.user);
    return data;
  }, [fetchPerfil]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
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
