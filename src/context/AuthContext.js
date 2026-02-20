import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const eventSeqRef = useRef(0);

  const fetchPerfil = useCallback(async (authUser) => {
    if (!authUser?.id) return null;
    try {
      // Buscar por ID
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && data) return data;

      // Fallback: buscar por email
      if (authUser.email) {
        const { data: byEmail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (byEmail) {
          if (byEmail.id !== authUser.id) {
            await supabase
              .from('usuarios')
              .update({ id: authUser.id })
              .eq('email', authUser.email);
            byEmail.id = authUser.id;
          }
          return byEmail;
        }
      }

      // Ultimo recurso: crear perfil
      if (authUser.email) {
        const nombre = authUser.user_metadata?.full_name
          || authUser.user_metadata?.name
          || authUser.email.split('@')[0]
          || 'Usuario';
        const { data: created } = await supabase
          .from('usuarios')
          .upsert({
            id: authUser.id,
            nombre,
            email: authUser.email,
            rol: 'clienta'
          }, { onConflict: 'id' })
          .select()
          .single();
        if (created) return created;
      }

      return null;
    } catch (err) {
      console.error('Error cargando perfil:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Limpiar URL de errores OAuth
    if (window.location.search.includes('error=') || window.location.hash.includes('error=')) {
      window.history.replaceState({}, '', window.location.pathname);
    }

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

        const p = await fetchPerfil(session.user);
        if (!isMounted || mySeq !== eventSeqRef.current) return;

        if (p) setPerfil(p);
        setLoading(false);
      }
    });

    // Timeout de seguridad
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => prev ? false : prev);
      }
    }, 12000);

    return () => {
      isMounted = false;
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
    return data;
  }, []);

  const logout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    setUser(null);
    setPerfil(null);
    setLoading(false);
    try { localStorage.removeItem('anabienestar-auth'); } catch (e) {}
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
