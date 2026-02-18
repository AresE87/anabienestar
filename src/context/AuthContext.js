import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = useCallback(async (authUser) => {
    if (!authUser?.email) {
      setPerfil(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (!error && data) {
        setPerfil(data);
      } else {
        setPerfil(null);
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchPerfil(session.user);
      } else {
        setPerfil(null);
      }
      setLoading(false);
    });
  }, [fetchPerfil]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchPerfil(session.user);
      } else {
        setPerfil(null);
      }
      setLoading(false);
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
