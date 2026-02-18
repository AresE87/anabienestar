import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useApp } from '../context/AppContext';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Citas() {
  const { userId } = useApp();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNewNote, setShowNewNote] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar notas al montar (solo si hay userId)
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const loadNotas = async () => {
      setLoading(true);
      const fecha = getTodayKey();
      try {
        const { data, error } = await supabase
          .from('notas_sesion')
          .select('texto')
          .eq('usuario_id', userId)
          .eq('fecha', fecha)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setNotes(data.map((row) => row.texto));
        }
      } catch (error) {
        console.error('Error cargando notas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNotas();
  }, [userId]);

  const handleAddNote = async () => {
    const text = newNote.trim();
    if (!text) {
      setShowNewNote(true);
      return;
    }
    if (!userId) return;

    const fecha = getTodayKey();
    try {
      const { error } = await supabase
        .from('notas_sesion')
        .insert({
          usuario_id: userId,
          texto: text
        });

      if (error) {
        console.error('Error guardando nota:', error);
        return;
      }

      // Agregar nota al estado local
      setNotes([...notes, text]);
      setNewNote('');
      setShowNewNote(false);
    } catch (error) {
      console.error('Error guardando nota:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  // Colores (iguales a Home.js)
  const colors = {
    sage: '#7a9e7e',
    sageDark: '#3d5c41',
    cream: '#f8f4ee',
    gold: '#b8956a'
  };

  // Estilos
  const styles = {
    container: {
      padding: '0',
      minHeight: 'calc(100vh - 80px)',
      background: colors.cream,
      paddingBottom: '100px'
    },
    loadingText: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      textAlign: 'center',
      padding: '2rem'
    },
    header: {
      background: colors.cream,
      padding: '2rem 1.25rem 1.5rem',
      borderBottom: `1px solid rgba(61, 92, 65, 0.1)`
    },
    headerTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.75rem',
      fontWeight: 600,
      color: colors.sageDark,
      margin: 0,
      marginBottom: '0.25rem'
    },
    headerSubtitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      color: colors.sageDark,
      opacity: 0.7,
      margin: 0
    },
    calendarContainer: {
      padding: '1.5rem 1.25rem',
      background: colors.cream
    },
    calendar: {
      display: 'flex',
      gap: '0.5rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem'
    },
    calendarDay: {
      minWidth: '60px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0.75rem 0.5rem',
      borderRadius: '0.75rem',
      background: 'white',
      border: `2px solid transparent`,
      cursor: 'pointer',
      transition: 'all 0.2s',
      flexShrink: 0
    },
    calendarDayToday: {
      background: colors.sageDark,
      color: 'white',
      borderColor: colors.sageDark
    },
    calendarDayWithAppointment: {
      borderColor: colors.sage,
      background: 'white'
    },
    calendarDayLabel: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 500,
      marginBottom: '0.25rem',
      opacity: 0.7
    },
    calendarDayLabelToday: {
      opacity: 1
    },
    calendarDayNumber: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1.25rem',
      fontWeight: 600,
      marginBottom: '0.25rem'
    },
    calendarDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: colors.sage,
      marginTop: '0.25rem'
    },
    section: {
      padding: '0 1.25rem 1.5rem'
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '1rem'
    },
    appointmentCard: {
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      marginBottom: '0.75rem',
      borderLeft: `4px solid ${colors.sage}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    appointmentCardInactive: {
      borderLeftColor: '#e0e0e0'
    },
    appointmentTime: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      fontWeight: 600,
      color: colors.sage,
      marginBottom: '0.5rem'
    },
    appointmentTimeInactive: {
      color: '#999'
    },
    appointmentTitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    appointmentSubtitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6
    },
    notesContainer: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    notesTitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 600,
      color: colors.sageDark,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '1rem',
      opacity: 0.7
    },
    notesPlaceholder: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.4,
      marginBottom: '1rem',
      minHeight: '24px'
    },
    notesList: {
      marginTop: '1rem'
    },
    noteItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      marginBottom: '0.75rem',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      lineHeight: 1.5
    },
    noteDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: colors.sage,
      marginTop: '0.5rem',
      flexShrink: 0
    },
    noteInput: {
      flex: 1,
      border: 'none',
      outline: 'none',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      background: 'transparent',
      padding: '0.25rem 0',
      resize: 'none'
    },
    noteInputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flex: 1,
      minWidth: 0
    },
    guardarButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      background: colors.sage,
      color: 'white',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 500,
      cursor: 'pointer',
      flexShrink: 0
    },
    floatingButton: {
      position: 'fixed',
      bottom: '100px',
      right: 'calc(50% - 167px)',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: colors.sage,
      border: 'none',
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 300,
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(61, 92, 65, 0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      zIndex: 10
    }
  };

  // Datos del calendario semanal
  const weekDays = [
    { day: 'Lun', date: 16, hasAppointment: false },
    { day: 'Mar', date: 17, hasAppointment: false },
    { day: 'Mié', date: 18, hasAppointment: false, isToday: true },
    { day: 'Jue', date: 19, hasAppointment: true },
    { day: 'Vie', date: 20, hasAppointment: false },
    { day: 'Sáb', date: 21, hasAppointment: true },
    { day: 'Dom', date: 22, hasAppointment: false }
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
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Mis Citas 📅</h1>
        <p style={styles.headerSubtitle}>Febrero 2026</p>
      </div>

      {/* Calendario semanal */}
      <div style={styles.calendarContainer}>
        <div style={styles.calendar}>
          {weekDays.map((day, index) => (
            <div
              key={index}
              style={{
                ...styles.calendarDay,
                ...(day.isToday ? styles.calendarDayToday : {}),
                ...(day.hasAppointment && !day.isToday ? styles.calendarDayWithAppointment : {})
              }}
            >
              <div style={{
                ...styles.calendarDayLabel,
                ...(day.isToday ? styles.calendarDayLabelToday : {})
              }}>
                {day.day}
              </div>
              <div style={styles.calendarDayNumber}>{day.date}</div>
              {day.hasAppointment && !day.isToday && (
                <div style={styles.calendarDot} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Próximas citas */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Próximas citas</h2>
        
        {/* Cita de hoy */}
        <div style={styles.appointmentCard}>
          <div style={styles.appointmentTime}>Hoy · 18:00 hs</div>
          <div style={styles.appointmentTitle}>Sesión semanal de seguimiento</div>
          <div style={styles.appointmentSubtitle}>Con Ana Karina · Videollamada</div>
        </div>

        {/* Cita futura */}
        <div style={{
          ...styles.appointmentCard,
          ...styles.appointmentCardInactive
        }}>
          <div style={{
            ...styles.appointmentTime,
            ...styles.appointmentTimeInactive
          }}>
            Jue 19 · 10:00 hs
          </div>
          <div style={styles.appointmentTitle}>Check-in de peso y medidas</div>
          <div style={styles.appointmentSubtitle}>Con Ana Karina · Videollamada</div>
        </div>
      </div>

      {/* Sección de notas */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📝 Para hablar hoy con Ana</h2>
        <div style={styles.notesContainer}>
          <div style={styles.notesTitle}>Anotá lo que querés contarle</div>
          
          {showNewNote ? (
            <div style={styles.noteItem}>
              <div style={styles.noteDot} />
              <div style={styles.noteInputRow}>
                <input
                  type="text"
                  style={styles.noteInput}
                  placeholder="Escribí tu nota aquí..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button type="button" style={styles.guardarButton} onClick={handleAddNote}>
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.notesPlaceholder}>
              Escribí aquí lo que querés recordar...
            </div>
          )}

          <div style={styles.notesList}>
            {notes.map((note, index) => (
              <div key={index} style={styles.noteItem}>
                <div style={styles.noteDot} />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botón flotante */}
      <button
        style={styles.floatingButton}
        onClick={() => {
          if (showNewNote && newNote.trim()) {
            handleAddNote();
          } else {
            setShowNewNote(true);
          }
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(61, 92, 65, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(61, 92, 65, 0.3)';
        }}
        aria-label="Agregar nueva nota"
      >
        +
      </button>
    </div>
  );
}

export default Citas;
