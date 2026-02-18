import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

// ID hardcodeado hasta implementar auth
const USER_ID = '00000000-0000-0000-0000-000000000001';

// Helper: fecha de hoy en formato YYYY-MM-DD
const hoy = () => new Date().toISOString().split('T')[0];

export function AppProvider({ children }) {
  // ── Checklist ──────────────────────────────────
  const [checklist, setChecklist] = useState({
    actividad: false,
    agua: false,
    respiracion: false,
    desayuno: false,
    momento: false,
  });
  const [checklistLoaded, setChecklistLoaded] = useState(false);

  // ── Mood ───────────────────────────────────────
  const [mood, setMoodState] = useState(null); // 'happy' | 'neutral' | 'sad' | 'fire' | null
  const [moodLoaded, setMoodLoaded] = useState(false);

  // ── Registros de peso ──────────────────────────
  const [registrosPeso, setRegistrosPeso] = useState([]);
  const [pesoLoaded, setPesoLoaded] = useState(false);

  // ── Racha ──────────────────────────────────────
  const [racha, setRacha] = useState(0);

  // ══════════════════════════════════════════════
  // FETCH INICIAL — solo una vez al montar el Provider
  // ══════════════════════════════════════════════

  useEffect(() => {
    fetchChecklist();
    fetchMood();
    fetchRegistrosPeso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch Checklist ────────────────────────────
  const fetchChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('item, completado')
        .eq('usuario_id', USER_ID)
        .eq('fecha', hoy());

      if (error) throw error;

      if (data && data.length > 0) {
        const loaded = { actividad: false, agua: false, respiracion: false, desayuno: false, momento: false };
        data.forEach((row) => {
          if (row.item in loaded) {
            loaded[row.item] = row.completado;
          }
        });
        setChecklist(loaded);
      }
    } catch (err) {
      console.error('Error cargando checklist:', err);
    } finally {
      setChecklistLoaded(true);
    }
  };

  // ── Toggle Checklist (optimistic update) ───────
  const toggleChecklistItem = useCallback(async (item) => {
    // 1. Cambiar estado local INMEDIATAMENTE
    setChecklist((prev) => {
      const nuevoValor = !prev[item];

      // 2. Upsert a Supabase en background (no await)
      supabase
        .from('checklist_items')
        .upsert(
          {
            usuario_id: USER_ID,
            fecha: hoy(),
            item: item,
            completado: nuevoValor,
          },
          { onConflict: 'usuario_id,fecha,item' }
        )
        .then(({ error }) => {
          if (error) console.error('Error guardando checklist:', error);
        });

      return { ...prev, [item]: nuevoValor };
    });
  }, []);

  // ── Fetch Mood ─────────────────────────────────
  const fetchMood = async () => {
    try {
      const { data, error } = await supabase
        .from('estados_animo')
        .select('mood')
        .eq('usuario_id', USER_ID)
        .eq('fecha', hoy())
        .maybeSingle();

      if (error) throw error;
      if (data) setMoodState(data.mood);
    } catch (err) {
      console.error('Error cargando mood:', err);
    } finally {
      setMoodLoaded(true);
    }
  };

  // ── Set Mood (optimistic update) ───────────────
  const setMood = useCallback(async (nuevoMood) => {
    setMoodState(nuevoMood);

    try {
      const { error } = await supabase
        .from('estados_animo')
        .upsert(
          {
            usuario_id: USER_ID,
            fecha: hoy(),
            mood: nuevoMood,
          },
          { onConflict: 'usuario_id,fecha' }
        );

      if (error) console.error('Error guardando mood:', error);
    } catch (err) {
      console.error('Error guardando mood:', err);
    }
  }, []);

  // ── Fetch Registros de Peso ────────────────────
  const fetchRegistrosPeso = async () => {
    try {
      const { data, error } = await supabase
        .from('registros_peso')
        .select('*')
        .eq('usuario_id', USER_ID)
        .order('fecha', { ascending: true });

      if (error) throw error;
      if (data) setRegistrosPeso(data);
    } catch (err) {
      console.error('Error cargando registros de peso:', err);
    } finally {
      setPesoLoaded(true);
    }
  };

  // ── Registrar Peso Nuevo ───────────────────────
  const registrarPeso = useCallback(async (peso, semana) => {
    const nuevoPeso = {
      usuario_id: USER_ID,
      peso: parseFloat(peso),
      semana: semana || null,
      fecha: hoy(),
    };

    // Optimistic: agregar al estado local
    const tempId = 'temp-' + Date.now();
    setRegistrosPeso((prev) => [...prev, { ...nuevoPeso, id: tempId }]);

    try {
      const { data, error } = await supabase
        .from('registros_peso')
        .insert(nuevoPeso)
        .select()
        .single();

      if (error) throw error;

      // Reemplazar el registro temporal con el real
      setRegistrosPeso((prev) =>
        prev.map((r) => (r.id === tempId ? data : r))
      );

      return { success: true };
    } catch (err) {
      console.error('Error registrando peso:', err);
      // Rollback
      setRegistrosPeso((prev) => prev.filter((r) => r.id !== tempId));
      return { success: false, error: err };
    }
  }, []);

  // ── Calcular racha ─────────────────────────────
  useEffect(() => {
    const completados = Object.values(checklist).filter(Boolean).length;
    if (completados === 5) {
      setRacha((prev) => Math.max(prev, 1)); // placeholder, idealmente calcular desde Supabase
    }
  }, [checklist]);

  // ══════════════════════════════════════════════
  const value = {
    // Checklist
    checklist,
    checklistLoaded,
    toggleChecklistItem,

    // Mood
    mood,
    moodLoaded,
    setMood,

    // Peso
    registrosPeso,
    pesoLoaded,
    registrarPeso,

    // Utils
    racha,
    userId: USER_ID,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de <AppProvider>');
  }
  return context;
}
