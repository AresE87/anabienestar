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
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setPerfil(null);
        setLoading(false);
        initializedRef.current = true;
        return;
      }

      // Cargar perfil en eventos relevantes
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        setUser(session.user);
        const p = await fetchPerfil(session.user);
        if (!isMounted) return;

        if (!p && event === 'INITIAL_SESSION') {
          // Sesion restaurada pero sin perfil — puede ser token corrupto/expirado
          // Intentar verificar que la sesion es valida haciendo getUser()
          const { data: { user: verifiedUser }, error: verifyErr } = await supabase.auth.getUser();
          if (!isMounted) return;

          if (verifyErr || !verifiedUser) {
            // Sesion invalida: limpiar tokens corruptos
            console.warn('Sesion invalida al restaurar, cerrando sesion...');
            await supabase.auth.signOut();
            setUser(null);
            setPerfil(null);
          } else {
            // Sesion valida pero realmente no tiene perfil
            setUser(session.user);
            setPerfil(null);
          }
        } else if (!p) {
          // Login fresco sin perfil
          setUser(session.user);
          setPerfil(null);
        }
      }

      if (isMounted) {
        setLoading(false);
        initializedRef.current = true;
      }
    });

    // Disparar la carga inicial — getSession emite INITIAL_SESSION via onAuthStateChange
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        // Error al restaurar sesion (token expirado, 400, etc.)
        console.warn('Error restaurando sesion:', error.message);
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setPerfil(null);
        setLoading(false);
        initializedRef.current = true;
        return;
      }
      // Si no hay sesion, onAuthStateChange podria no disparar, asi que resolvemos aqui
      if (!session && !initializedRef.current) {
        initializedRef.current = true;
        setUser(null);
        setPerfil(null);
        setLoading(false);
      }
    });

    // Timeout de seguridad: si loading sigue en true despues de 8s, limpiar y mostrar login
    const timeout = setTimeout(() => {
      if (!isMounted) return;
      setLoading((prev) => {
        if (prev) {
          console.warn('Auth timeout: forzando fin de carga, limpiando sesion...');
          // Si llego al timeout es que algo fallo — limpiar para no quedar en estado roto
          supabase.auth.signOut().catch(() => {});
          setUser(null);
          setPerfil(null);
          return false;
        }
        return prev;
      });
    }, 8000);

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
