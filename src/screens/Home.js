import React, { useState } from 'react';

function Home() {
  const [checkedItems, setCheckedItems] = useState({
    actividad: false,
    agua: false,
    respiracion: false,
    desayuno: false,
    momento: false
  });

  const [selectedEmotion, setSelectedEmotion] = useState(null);

  const toggleCheck = (item) => {
    setCheckedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

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
      background: colors.sage,
      borderColor: colors.sage,
      transform: 'scale(1.1)'
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
        <div style={styles.streakNumber}>
          12 🔥
        </div>
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
        {checklistItems.map((item, index) => (
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
        ))}
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
              onClick={() => setSelectedEmotion(emotion.id)}
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
      >
        Hoy es un día difícil 🌿
      </button>
    </div>
  );
}

export default Home;
