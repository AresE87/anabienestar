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
      // Capa 1: Buscar por ID (caso normal)
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!error && data) {
        setPerfil(data);
        return data;
      }

      // Capa 2: Buscar por email (por si el ID de auth cambio)
      if (authUser.email) {
        const { data: byEmail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (byEmail) {
          // Encontrado por email — actualizar el ID para que coincida con auth
          if (byEmail.id !== authUser.id) {
            await supabase
              .from('usuarios')
              .update({ id: authUser.id })
              .eq('email', authUser.email);
            byEmail.id = authUser.id;
          }
          setPerfil(byEmail);
          return byEmail;
        }
      }

      // Capa 3: No existe — crear perfil automaticamente
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

        if (created) {
          setPerfil(created);
          return created;
        }
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
        let p = await fetchPerfil(session.user);
        if (!isMounted) return;

        // Si no encontro perfil en INITIAL_SESSION, refrescar token y reintentar
        if (!p && event === 'INITIAL_SESSION') {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (!isMounted) return;

          if (refreshData?.session) {
            setUser(refreshData.session.user);
            p = await fetchPerfil(refreshData.session.user);
            if (!isMounted) return;
          }

          // Si aun no hay perfil despues de refrescar, cerrar sesion limpia
          if (!p) {
            console.warn('No se pudo obtener perfil, cerrando sesion...');
            await supabase.auth.signOut();
            setUser(null);
            setPerfil(null);
          }
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
