import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const eventSeqRef = useRef(0);

  // Buscar perfil: por ID, luego por email, luego crear
  // NO modifica estado — retorna data o null
  const queryPerfil = useCallback(async (authUser) => {
    if (!authUser?.id) return null;
    try {
      // Capa 1: Buscar por ID
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data) return data;

      // Capa 2: Buscar por email
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

      // Capa 3: Crear perfil automaticamente
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
        // Guardar secuencia para detectar si llega otro evento mientras esperamos
        const mySeq = ++eventSeqRef.current;

        setUser(session.user);
        const p = await queryPerfil(session.user);
        if (!isMounted) return;

        // Si llego otro evento mientras esperabamos, este resultado es stale — ignorar
        if (mySeq !== eventSeqRef.current) return;

        if (p) {
          setPerfil(p);
        }
        // Solo ponemos perfil=null si no teniamos uno antes
        // Esto evita borrar un perfil valido por una race condition
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
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error en signOut:', e);
    }
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
