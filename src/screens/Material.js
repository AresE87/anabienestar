import React from 'react';

function Material() {
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
      background: colors.cream
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
    section: {
      padding: '1.5rem 1.25rem'
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '1rem'
    },
    featuredCard: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-start',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    featuredIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '0.75rem',
      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.75rem',
      flexShrink: 0
    },
    featuredContent: {
      flex: 1,
      minWidth: 0
    },
    featuredTitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1.1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.5rem',
      lineHeight: 1.3
    },
    featuredMetadata: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6,
      marginBottom: '0.75rem'
    },
    featuredBadgeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: 'wrap'
    },
    badgeNew: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      background: '#fff4e6',
      color: colors.gold,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 500
    },
    badgeRead: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      background: '#e8f5e9',
      color: colors.sage,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 500
    },
    downloadIcon: {
      fontSize: '1.25rem',
      color: colors.sage,
      marginLeft: 'auto'
    },
    libraryCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      marginBottom: '0.75rem',
      background: 'white',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    libraryIcon: {
      width: '44px',
      height: '56px',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      flexShrink: 0
    },
    libraryContent: {
      flex: 1,
      minWidth: 0
    },
    libraryTitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem',
      lineHeight: 1.3
    },
    libraryMetadata: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6
    },
    libraryBadgeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginTop: '0.25rem',
      flexWrap: 'wrap'
    },
    libraryArrow: {
      fontSize: '1.25rem',
      color: colors.sage,
      fontWeight: 300,
      flexShrink: 0
    }
  };

  // Gradientes para los íconos de la biblioteca
  const gradients = {
    gold: `linear-gradient(135deg, #d4a574 0%, ${colors.gold} 100%)`,
    violet: 'linear-gradient(135deg, #9b7fb8 0%, #7b5a9d 100%)',
    teal: 'linear-gradient(135deg, #7a9e7e 0%, #5a8a5e 100%)',
    terracotta: 'linear-gradient(135deg, #d4a574 0%, #c97a5e 100%)'
  };

  // Datos de la biblioteca
  const libraryItems = [
    {
      id: 1,
      title: 'Plan Alimentario Semana 1-4',
      emoji: '📋',
      gradient: gradients.gold,
      pages: '12 págs',
      badge: 'Leído'
    },
    {
      id: 2,
      title: 'Manejo de ansiedad alimentaria',
      emoji: '🧠',
      gradient: gradients.violet,
      pages: '24 págs',
      badge: 'Leído'
    },
    {
      id: 3,
      title: 'Rutinas de movimiento suave',
      emoji: '💪',
      gradient: gradients.teal,
      pages: '18 págs',
      badge: null
    },
    {
      id: 4,
      title: 'Sueño y pérdida de peso',
      emoji: '😴',
      gradient: gradients.terracotta,
      pages: '16 págs',
      badge: null
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Tu Material 📚</h1>
        <p style={styles.headerSubtitle}>eBooks y recursos de tu programa</p>
      </div>

      {/* Sección "Nuevo para vos" */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Nuevo para vos</h2>
        <div
          style={styles.featuredCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
          }}
        >
          <div style={styles.featuredIcon}>📖</div>
          <div style={styles.featuredContent}>
            <div style={styles.featuredTitle}>Método Livianas — Guía Completa</div>
            <div style={styles.featuredMetadata}>48 páginas · PDF</div>
            <div style={styles.featuredBadgeContainer}>
              <span style={styles.badgeNew}>🆕 Nuevo</span>
            </div>
          </div>
          <div style={styles.downloadIcon}>⬇</div>
        </div>
      </div>

      {/* Sección "Tu biblioteca" */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Tu biblioteca</h2>
        {libraryItems.map((item) => (
          <div
            key={item.id}
            style={styles.libraryCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            }}
          >
            <div style={{
              ...styles.libraryIcon,
              background: item.gradient
            }}>
              {item.emoji}
            </div>
            <div style={styles.libraryContent}>
              <div style={styles.libraryTitle}>{item.title}</div>
              <div style={styles.libraryMetadata}>{item.pages}</div>
              {item.badge && (
                <div style={styles.libraryBadgeContainer}>
                  <span style={styles.badgeRead}>{item.badge}</span>
                </div>
              )}
            </div>
            <div style={styles.libraryArrow}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Material;
