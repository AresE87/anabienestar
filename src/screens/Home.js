import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { isPushSupported, getPermissionState, subscribeToPush } from '../utils/pushNotifications';

// ── Datos estáticos ───────────────────────────────
const CHECKLIST_ITEMS = [
  { id: 'actividad', label: '30 min de actividad física', emoji: '🏃‍♀️' },
  { id: 'agua', label: '2 litros de agua', emoji: '💧' },
  { id: 'respiracion', label: '5 min de respiración', emoji: '🧘‍♀️' },
  { id: 'desayuno', label: 'Desayuno saludable', emoji: '🥣' },
  { id: 'momento', label: 'Un momento para mí', emoji: '💚' },
];

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Bien' },
  { id: 'neutral', emoji: '😐', label: 'Normal' },
  { id: 'sad', emoji: '😔', label: 'Bajón' },
  { id: 'fire', emoji: '🔥', label: 'Imparable' },
];

const FRASE_FALLBACK = 'Cada pequeño paso cuenta. No necesitas ser perfecta, necesitas ser constante.';

const RECETA_FALLBACK = {
  emoji: '🥗',
  nombre: 'Bowl mediterraneo',
  tiempo: '20 min',
  calorias: '380 kcal',
};

export default function Home() {
  const { logout } = useAuth();
  const {
    checklist,
    checklistLoaded,
    toggleChecklistItem,
    mood,
    moodLoaded,
    setMood,
    racha,
    userId,
  } = useApp();

  const [showDiaDificil, setShowDiaDificil] = useState(false);
  const [fraseDelDia, setFraseDelDia] = useState(FRASE_FALLBACK);
  const [recetaHoy, setRecetaHoy] = useState(RECETA_FALLBACK);
  const [showPushBanner, setShowPushBanner] = useState(false);

  // Fetch frase del dia + receta random from Supabase (resiliente a tablas faltantes)
  useEffect(() => {
    const fetchData = async () => {
      // Frases
      try {
        const { data, error } = await supabase.from('frases').select('texto').eq('activa', true);
        if (!error && data && data.length > 0) {
          const idx = Math.floor(Math.random() * data.length);
          setFraseDelDia(data[idx].texto);
        }
      } catch (err) {
        console.warn('Frases no disponibles:', err.message);
      }

      // Receta del dia
      try {
        const { data, error } = await supabase.from('recetas').select('emoji, nombre, tiempo, calorias').eq('visible', true);
        if (!error && data && data.length > 0) {
          const idx = Math.floor(Math.random() * data.length);
          setRecetaHoy(data[idx]);
        }
        // Si error, simplemente se mantiene RECETA_FALLBACK
      } catch (err) {
        console.warn('Recetas no disponibles, usando fallback');
      }
    };
    fetchData();
  }, []);

  // Show push notification banner if supported and not yet granted
  useEffect(() => {
    if (isPushSupported() && getPermissionState() === 'default') {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowPushBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnablePush = async () => {
    if (userId) {
      await subscribeToPush(userId);
    }
    setShowPushBanner(false);
  };

  const completados = Object.values(checklist).filter(Boolean).length;

  return (
    <div style={styles.container}>
      {/* ── Header ──────────────────────────────── */}
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={styles.greeting}>Hola, hermosa 🌿</p>
            <h1 style={styles.title}>Tu día empieza bien</h1>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.8rem',
              color: 'var(--color-dark-green)',
              opacity: 0.7,
              cursor: 'pointer',
              padding: '0.25rem 0',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── Racha ───────────────────────────────── */}
      <div style={styles.rachaCard}>
        <span style={styles.rachaEmoji}>🔥</span>
        <div>
          <p style={styles.rachaNum}>{racha} días seguidos</p>
          <p style={styles.rachaSub}>¡Seguí así!</p>
        </div>
      </div>

      {/* ── Frase del día ───────────────────────── */}
      <div style={styles.fraseCard}>
        <p style={styles.fraseText}>{fraseDelDia}</p>
        <p style={styles.fraseAuthor}>— Ana Karina</p>
      </div>

      {/* ── Push Notification Banner ──────────────── */}
      {showPushBanner && (
        <div style={{
          margin: '12px 16px 0',
          padding: '14px 18px',
          backgroundColor: '#fff4e6',
          borderRadius: 16,
          border: '1px solid #b8956a',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#3d5c41' }}>Activa las notificaciones</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7a9e7e' }}>Recibiras recordatorios de Ana Karina</p>
          </div>
          <button
            onClick={handleEnablePush}
            style={{ padding: '8px 16px', backgroundColor: '#3d5c41', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' }}
          >
            Activar
          </button>
          <button
            onClick={() => setShowPushBanner(false)}
            style={{ background: 'none', border: 'none', color: '#999', fontSize: 18, cursor: 'pointer', padding: 4 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Receta de hoy ───────────────────────── */}
      <div style={styles.recetaCard}>
        <span style={styles.recetaEmoji}>{recetaHoy.emoji || '🥗'}</span>
        <div style={{ flex: 1 }}>
          <p style={styles.recetaNombre}>{recetaHoy.nombre}</p>
          <p style={styles.recetaInfo}>
            {recetaHoy.tiempo || ''}{recetaHoy.tiempo && recetaHoy.calorias ? ' · ' : ''}{recetaHoy.calorias || ''}
          </p>
        </div>
        <span style={styles.recetaArrow}>→</span>
      </div>

      {/* ── Checklist diario ────────────────────── */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Tu checklist de hoy</h2>
        <p style={styles.sectionSub}>
          {completados}/5 completados
        </p>

        {!checklistLoaded ? (
          <p style={styles.loading}>Cargando...</p>
        ) : (
          <div style={styles.checklistContainer}>
            {CHECKLIST_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                style={{
                  ...styles.checklistItem,
                  ...(checklist[item.id] ? styles.checklistDone : {}),
                }}
              >
                <span style={styles.checklistEmoji}>{item.emoji}</span>
                <span
                  style={{
                    ...styles.checklistLabel,
                    ...(checklist[item.id] ? styles.checklistLabelDone : {}),
                  }}
                >
                  {item.label}
                </span>
                <span style={styles.checklistToggle}>
                  {checklist[item.id] ? '✓' : '○'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Estado de ánimo ─────────────────────── */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>¿Cómo te sentís hoy?</h2>

        {!moodLoaded ? (
          <p style={styles.loading}>Cargando...</p>
        ) : (
          <div style={styles.moodContainer}>
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                style={{
                  ...styles.moodButton,
                  ...(mood === m.id ? styles.moodSelected : {}),
                }}
              >
                <span style={styles.moodEmoji}>{m.emoji}</span>
                <span style={styles.moodLabel}>{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Botón Día Difícil ───────────────────── */}
      <button
        onClick={() => setShowDiaDificil(true)}
        style={styles.diaDificilBtn}
      >
        💛 ¿Día difícil? Tocá acá
      </button>

      {/* ── Modal Día Difícil ───────────────────── */}
      {showDiaDificil && (
        <div style={styles.modalOverlay} onClick={() => setShowDiaDificil(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalEmoji}>💚</p>
            <h3 style={styles.modalTitle}>Está bien tener días difíciles</h3>
            <p style={styles.modalText}>
              No te juzgues. Un día difícil no borra todo tu progreso. 
              Respirá profundo, tomá agua, y recordá por qué empezaste. 
              Estoy orgullosa de vos.
            </p>
            <p style={styles.modalAuthor}>— Ana Karina 💚</p>
            <button
              onClick={() => setShowDiaDificil(false)}
              style={styles.modalClose}
            >
              Gracias, lo necesitaba
            </button>
          </div>
        </div>
      )}

      {/* Spacer para BottomNav */}
      <div style={{ height: 90 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════
const styles = {
  container: {
    maxWidth: 390,
    margin: '0 auto',
    backgroundColor: '#f8f4ee',
    minHeight: '100vh',
    fontFamily: 'Jost, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #3d5c41, #7a9e7e)',
    padding: '40px 24px 30px',
    borderRadius: '0 0 24px 24px',
    color: 'white',
  },
  greeting: {
    fontSize: 14,
    margin: 0,
    opacity: 0.9,
    fontFamily: 'Jost, sans-serif',
  },
  title: {
    fontSize: 24,
    margin: '4px 0 0',
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700,
  },
  rachaCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '16px 16px 0',
    padding: '14px 18px',
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  rachaEmoji: { fontSize: 28 },
  rachaNum: { margin: 0, fontWeight: 600, fontSize: 16, color: '#3d5c41' },
  rachaSub: { margin: 0, fontSize: 13, color: '#7a9e7e' },
  fraseCard: {
    margin: '12px 16px 0',
    padding: '16px 18px',
    backgroundColor: 'white',
    borderRadius: 16,
    borderLeft: '4px solid #b8956a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  fraseText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: '#3d5c41',
    fontStyle: 'italic',
    fontFamily: 'Playfair Display, serif',
  },
  fraseAuthor: {
    margin: '8px 0 0',
    fontSize: 12,
    color: '#b8956a',
    fontWeight: 600,
  },
  recetaCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '12px 16px 0',
    padding: '14px 18px',
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cursor: 'pointer',
  },
  recetaEmoji: { fontSize: 32 },
  recetaNombre: { margin: 0, fontWeight: 600, fontSize: 15, color: '#3d5c41' },
  recetaInfo: { margin: '2px 0 0', fontSize: 12, color: '#7a9e7e' },
  recetaArrow: { fontSize: 18, color: '#b8956a' },
  section: {
    margin: '20px 16px 0',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Playfair Display, serif',
    color: '#3d5c41',
    margin: '0 0 4px',
  },
  sectionSub: {
    fontSize: 13,
    color: '#7a9e7e',
    margin: '0 0 12px',
  },
  loading: {
    fontSize: 14,
    color: '#7a9e7e',
    textAlign: 'center',
    padding: 20,
  },
  checklistContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    backgroundColor: 'white',
    borderRadius: 14,
    border: '2px solid transparent',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'Jost, sans-serif',
  },
  checklistDone: {
    backgroundColor: '#eaf2eb',
    borderColor: '#7a9e7e',
  },
  checklistEmoji: { fontSize: 20, flexShrink: 0 },
  checklistLabel: {
    flex: 1,
    fontSize: 14,
    color: '#3d5c41',
    fontWeight: 500,
  },
  checklistLabelDone: {
    textDecoration: 'line-through',
    opacity: 0.7,
  },
  checklistToggle: {
    fontSize: 18,
    color: '#7a9e7e',
    fontWeight: 700,
    flexShrink: 0,
  },
  moodContainer: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  moodButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '12px 16px',
    backgroundColor: 'white',
    borderRadius: 16,
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Jost, sans-serif',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  moodSelected: {
    borderColor: '#b8956a',
    backgroundColor: '#faf6f0',
    transform: 'scale(1.08)',
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 12, color: '#3d5c41', fontWeight: 500 },
  diaDificilBtn: {
    display: 'block',
    width: 'calc(100% - 32px)',
    margin: '20px 16px 0',
    padding: '14px',
    backgroundColor: 'transparent',
    border: '2px dashed #b8956a',
    borderRadius: 14,
    color: '#b8956a',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Jost, sans-serif',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: '32px 24px',
    maxWidth: 340,
    width: '100%',
    textAlign: 'center',
  },
  modalEmoji: { fontSize: 40, margin: '0 0 12px' },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Playfair Display, serif',
    color: '#3d5c41',
    margin: '0 0 12px',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#555',
    margin: '0 0 16px',
  },
  modalAuthor: {
    fontSize: 13,
    color: '#b8956a',
    fontWeight: 600,
    margin: '0 0 20px',
  },
  modalClose: {
    padding: '12px 28px',
    backgroundColor: '#3d5c41',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Jost, sans-serif',
  },
};
