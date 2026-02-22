import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfilError, setPerfilError] = useState(false);
  const [oauthError, setOauthError] = useState(null);
  const eventSeqRef = useRef(0);

  const clearOauthError = useCallback(() => setOauthError(null), []);

  const fetchPerfil = useCallback(async (authUser) => {
    if (!authUser?.id) return null;
    try {
      // Capa 1: Buscar por ID
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn('fetchPerfil (by ID) error:', error.code, error.message, error.details || '');
      }
      if (!error && data) return data;

      // Capa 2: Buscar por email
      if (authUser.email) {
        const { data: byEmail, error: errEmail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();

        if (errEmail) {
          console.warn('fetchPerfil (by email) error:', errEmail.code, errEmail.message);
        }

        if (byEmail) {
          if (byEmail.id !== authUser.id) {
            const { error: errUpdate } = await supabase
              .from('usuarios')
              .update({ id: authUser.id })
              .eq('email', authUser.email);
            if (errUpdate) {
              console.warn('fetchPerfil (update ID) error:', errUpdate.code, errUpdate.message);
            }
            byEmail.id = authUser.id;
          }
          return byEmail;
        }
      }

      // Capa 3: Crear perfil (usuarios nuevos, ej: OAuth)
      if (authUser.email) {
        const nombre = authUser.user_metadata?.full_name
          || authUser.user_metadata?.name
          || authUser.email.split('@')[0]
          || 'Usuario';
        const { data: created, error: errCreate } = await supabase
          .from('usuarios')
          .upsert({
            id: authUser.id,
            nombre,
            email: authUser.email,
            rol: 'clienta'
          }, { onConflict: 'id' })
          .select()
          .single();
        if (errCreate) {
          console.warn('fetchPerfil (create) error:', errCreate.code, errCreate.message);
        }
        if (created) return created;
      }

      console.warn('fetchPerfil: no se pudo obtener ni crear perfil para', authUser.id);
      return null;
    } catch (err) {
      console.error('Error cargando perfil:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Capturar y loggear errores OAuth de la URL antes de limpiarla
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const oauthErr = urlParams.get('error') || hashParams.get('error');
    const oauthDesc = urlParams.get('error_description') || hashParams.get('error_description');
    if (oauthErr) {
      console.error('OAuth error:', oauthErr, oauthDesc || '');
      // Mapear errores conocidos a mensajes amigables
      let msg = 'Error al iniciar sesión con Google. Intentá de nuevo.';
      if (oauthErr === 'access_denied') {
        msg = 'Cancelaste el inicio de sesión con Google.';
      } else if (oauthDesc && oauthDesc.includes('exchange')) {
        msg = 'Hubo un problema al conectar con Google. Intentá de nuevo en unos segundos.';
      } else if (oauthDesc) {
        msg = `Error de autenticación: ${decodeURIComponent(oauthDesc).replace(/\+/g, ' ')}`;
      }
      if (isMounted) setOauthError(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        eventSeqRef.current++;
        setUser(null);
        setPerfil(null);
        setPerfilError(false);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        const mySeq = ++eventSeqRef.current;
        setUser(session.user);

        const p = await fetchPerfil(session.user);
        if (!isMounted || mySeq !== eventSeqRef.current) return;

        if (p) {
          setPerfil(p);
          setPerfilError(false);
        } else {
          setPerfilError(true);
        }
        setLoading(false);
      }
    });

    // Timeout de seguridad
    const timeout = setTimeout(() => {
      if (isMounted) {
        setLoading(prev => {
          if (prev) setPerfilError(true);
          return prev ? false : prev;
        });
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
    setPerfilError(false);
    setLoading(false);
    try { localStorage.removeItem('anabienestar-auth'); } catch (e) {}
  }, []);

  const refetchPerfil = useCallback(async () => {
    if (!user) return;
    setPerfilError(false);
    const p = await fetchPerfil(user);
    if (p) {
      setPerfil(p);
    } else {
      setPerfilError(true);
    }
  }, [user, fetchPerfil]);

  const value = {
    user,
    perfil,
    loading,
    perfilError,
    oauthError,
    clearOauthError,
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
