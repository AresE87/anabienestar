import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CHECKLIST_IDS = ['actividad', 'agua', 'respiracion', 'desayuno', 'momento'];
const USER_ID = '00000000-0000-0000-0000-000000000001';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const defaultChecked = Object.fromEntries(CHECKLIST_IDS.map((id) => [id, false]));

function Home() {
  const [checkedItems, setCheckedItems] = useState(defaultChecked);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [showDifficultModal, setShowDifficultModal] = useState(false);
  const [difficultDayActive, setDifficultDayActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar día difícil desde localStorage
  function loadDifficultDayHoy() {
    try {
      const raw = localStorage.getItem('difficult_day_hoy');
      if (!raw) return false;
      const { date } = JSON.parse(raw);
      return date === getTodayKey();
    } catch {
      return false;
    }
  }

  function setDifficultDayHoy() {
    try {
      localStorage.setItem('difficult_day_hoy', JSON.stringify({ date: getTodayKey() }));
    } catch (_) {}
  }

  // Un solo fetch al montar: checklist + estado de ánimo. Dependencias [] = solo una vez.
  useEffect(() => {
    let cancelled = false;
    const fecha = getTodayKey();

    async function loadData() {
      setLoading(true);
      try {
        const { data: checklistData, error: checklistError } = await supabase
          .from('checklist_items')
          .select('item, completado')
          .eq('usuario_id', USER_ID)
          .eq('fecha', fecha);

        if (cancelled) return;
        if (!checklistError && Array.isArray(checklistData)) {
          const items = { ...defaultChecked };
          checklistData.forEach((row) => {
            if (row && CHECKLIST_IDS.includes(row.item)) {
              items[row.item] = Boolean(row.completado);
            }
          });
          setCheckedItems(items);
        }

        const { data: moodRow, error: moodError } = await supabase
          .from('estados_animo')
          .select('mood')
          .eq('usuario_id', USER_ID)
          .eq('fecha', fecha)
          .maybeSingle();

        if (cancelled) return;
        if (!moodError && moodRow && moodRow.mood != null) {
          setSelectedEmotion(moodRow.mood);
        }

        setDifficultDayActive(loadDifficultDayHoy());
      } catch (error) {
        if (!cancelled) console.error('Error cargando datos:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  const toggleCheck = useCallback(async (item) => {
    const newValue = !checkedItems[item];
    setCheckedItems((prev) => ({ ...prev, [item]: newValue }));
    const fecha = getTodayKey();
    const { error } = await supabase
      .from('checklist_items')
      .upsert(
        { usuario_id: USER_ID, fecha, item, completado: newValue },
        { onConflict: 'usuario_id,fecha,item' }
      );
    if (error) {
      console.error('Error guardando checklist:', error);
      setCheckedItems((prev) => ({ ...prev, [item]: !newValue }));
    }
  }, [checkedItems]);

  const handleMoodSelect = useCallback(async (id) => {
    setSelectedEmotion(id);
    const fecha = getTodayKey();
    const { error } = await supabase
      .from('estados_animo')
      .upsert(
        { usuario_id: USER_ID, fecha, mood: id },
        { onConflict: 'usuario_id,fecha' }
      );
    if (error) {
      console.error('Error guardando estado de ánimo:', error);
      setSelectedEmotion(null);
    }
  }, []);

  const openDifficultModal = useCallback(() => {
    setShowDifficultModal(true);
  }, []);

  const closeDifficultModal = useCallback(() => {
    setShowDifficultModal(false);
    setDifficultDayActive(true);
    setDifficultDayHoy();
  }, []);

  // Colores
  const colors = {
    sage: '#7a9e7e',
    sageDark: '#3d5c41',
    cream: '#f8f4ee',
    gold: '#b8956a'
  };

  // Estilos
  const styles = {
    container: {
      padding: '1.25rem 1.25rem 1rem',
      minHeight: 'calc(100vh - 80px)',
      background: colors.cream
    },
    header: {
      background: `linear-gradient(135deg, ${colors.sageDark} 0%, ${colors.sage} 100%)`,
      borderRadius: '0 0 1.5rem 1.5rem',
      padding: '2rem 1.25rem 1.5rem',
      margin: '-1.25rem -1.25rem 1.5rem -1.25rem',
      color: 'white'
    },
    headerText: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1.75rem',
      fontWeight: 400,
      margin: 0,
      lineHeight: 1.3
    },
    loadingText: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      textAlign: 'center',
      padding: '2rem'
    },
    streakCard: {
      background: colors.sageDark,
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'white'
    },
    streakNumber: {
      fontSize: '3.5rem',
      fontWeight: 700,
      fontFamily: "'Jost', sans-serif",
      margin: '0.5rem 0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    streakText: {
      fontSize: '0.95rem',
      opacity: 0.9,
      marginBottom: '0.75rem'
    },
    dots: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    dot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: 'white',
      opacity: 0.7
    },
    quoteCard: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      marginBottom: '1.25rem',
      borderLeft: `4px solid ${colors.gold}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    quoteText: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1rem',
      color: colors.sageDark,
      lineHeight: 1.6,
      marginBottom: '0.75rem'
    },
    quoteAuthor: {
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.7,
      textAlign: 'right',
      fontStyle: 'italic'
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.75rem',
      marginTop: '1.5rem'
    },
    recipeCard: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    recipeEmoji: {
      fontSize: '2rem',
      lineHeight: 1
    },
    recipeContent: {
      flex: 1
    },
    recipeName: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    recipeTime: {
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6
    },
    checklist: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginBottom: '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    checklistItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 0',
      cursor: 'pointer',
      borderBottom: '1px solid rgba(61, 92, 65, 0.1)'
    },
    checklistItemLast: {
      borderBottom: 'none'
    },
    checkbox: {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      border: `2px solid ${colors.sage}`,
      marginRight: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.2s'
    },
    checkboxChecked: {
      background: colors.sage,
      borderColor: colors.sage
    },
    checkmark: {
      color: 'white',
      fontSize: '0.75rem',
      fontWeight: 'bold'
    },
    checklistLabel: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      flex: 1,
      textDecoration: 'none',
      transition: 'all 0.2s'
    },
    checklistLabelChecked: {
      textDecoration: 'line-through',
      opacity: 0.5
    },
    checklistPausedMessage: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      fontStyle: 'italic',
      padding: '0.75rem 0'
    },
    emotionSelector: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1rem',
      marginBottom: '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    emotionButtons: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center',
      marginTop: '0.75rem'
    },
    emotionButton: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      border: `2px solid ${colors.sage}`,
      background: 'white',
      fontSize: '1.75rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      padding: 0
    },
    emotionButtonSelected: {
      background: '#e8f5e9',
      borderColor: colors.sage,
      borderWidth: '3px',
      transform: 'scale(1.05)'
    },
    difficultDayButton: {
      width: '100%',
      padding: '1rem',
      borderRadius: '0.75rem',
      border: 'none',
      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
      color: 'white',
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer',
      marginTop: '1rem',
      marginBottom: '1rem',
      transition: 'all 0.2s',
      boxShadow: '0 4px 12px rgba(61, 92, 65, 0.2)'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    },
    modalBox: {
      background: colors.cream,
      borderRadius: '1rem',
      padding: '1.5rem',
      maxWidth: '340px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    },
    modalMessage: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1.1rem',
      color: colors.sageDark,
      lineHeight: 1.6,
      marginBottom: '1.5rem'
    },
    modalButton: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.75rem',
      border: 'none',
      background: colors.sage,
      color: 'white',
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer'
    }
  };

  const checklistItems = [
    { id: 'actividad', label: 'Actividad física' },
    { id: 'agua', label: 'Agua' },
    { id: 'respiracion', label: 'Respiración' },
    { id: 'desayuno', label: 'Desayuno' },
    { id: 'momento', label: 'Momento para mí' }
  ];

  const emotions = [
    { emoji: '😊', id: 'happy' },
    { emoji: '😐', id: 'neutral' },
    { emoji: '😔', id: 'sad' },
    { emoji: '🔥', id: 'fire' }
  ];

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header con gradiente */}
      <div style={styles.header}>
        <h1 style={styles.headerText}>
          Buenos días,<br />
          María
        </h1>
      </div>

      {/* Tarjeta de racha de días */}
      <div style={styles.streakCard}>
        <div style={styles.streakNumber}>12 🔥</div>
        <div style={styles.streakText}>días seguidos</div>
        <div style={styles.dots}>
          {[...Array(7)].map((_, i) => (
            <div key={i} style={styles.dot} />
          ))}
        </div>
      </div>

      {/* Tarjeta de frase del día */}
      <div style={styles.quoteCard}>
        <p style={styles.quoteText}>
          "Cada día es una oportunidad para cuidar tu cuerpo y tu mente con amor y paciencia."
        </p>
        <div style={styles.quoteAuthor}>— Ana Karina</div>
      </div>

      {/* Sección Receta de hoy */}
      <h2 style={styles.sectionTitle}>Receta de hoy</h2>
      <div style={styles.recipeCard}>
        <div style={styles.recipeEmoji}>🥗</div>
        <div style={styles.recipeContent}>
          <div style={styles.recipeName}>Ensalada de quinoa y aguacate</div>
          <div style={styles.recipeTime}>15 min</div>
        </div>
      </div>

      {/* Checklist */}
      <div style={styles.checklist}>
        {difficultDayActive ? (
          <div style={styles.checklistPausedMessage}>
            Hoy te tomás un descanso. No hay checklist. 💚
          </div>
        ) : (
          checklistItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                ...styles.checklistItem,
                ...(index === checklistItems.length - 1 ? styles.checklistItemLast : {})
              }}
              onClick={() => toggleCheck(item.id)}
            >
              <div style={{
                ...styles.checkbox,
                ...(checkedItems[item.id] ? styles.checkboxChecked : {})
              }}>
                {checkedItems[item.id] && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </div>
              <span style={{
                ...styles.checklistLabel,
                ...(checkedItems[item.id] ? styles.checklistLabelChecked : {})
              }}>
                {item.label}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Selector de estado emocional */}
      <div style={styles.emotionSelector}>
        <h3 style={{ ...styles.sectionTitle, marginTop: 0, marginBottom: '0.5rem' }}>
          ¿Cómo te sientes hoy?
        </h3>
        <div style={styles.emotionButtons}>
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              style={{
                ...styles.emotionButton,
                ...(selectedEmotion === emotion.id ? styles.emotionButtonSelected : {})
              }}
              onClick={() => handleMoodSelect(emotion.id)}
              aria-label={`Estado emocional: ${emotion.emoji}`}
            >
              {emotion.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Botón "Hoy es un día difícil" */}
      <button
        style={styles.difficultDayButton}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 16px rgba(61, 92, 65, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(61, 92, 65, 0.2)';
        }}
        onClick={openDifficultModal}
      >
        Hoy es un día difícil 🌿
      </button>

      {/* Modal día difícil */}
      {showDifficultModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => e.target === e.currentTarget && closeDifficultModal()}
        >
          <div style={styles.modalBox}>
            <p style={styles.modalMessage}>
              Está bien tomarse un descanso. Lo más importante es que estás acá, intentándolo. Eso ya es un logro enorme. 💚
            </p>
            <button style={styles.modalButton} onClick={closeDifficultModal}>
              Gracias, Ana ♡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
