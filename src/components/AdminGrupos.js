import React from 'react';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
};

export default function AdminGrupos() {
  return (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.title}>Programa Grupal</h1>
      </div>

      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <span style={{ fontSize: '3rem' }}>👥</span>
        </div>
        <h2 style={styles.cardTitle}>Proximamente</h2>
        <p style={styles.cardText}>
          Aqui podras crear grupos y challenges entre tus clientas.
          Cada grupo tendra metas compartidas, un chat grupal y un leaderboard
          para motivar a las participantes.
        </p>

        <div style={styles.featureList}>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>🎯</span>
            <div>
              <div style={styles.featureTitle}>Metas grupales</div>
              <div style={styles.featureDesc}>Define objetivos compartidos para el grupo</div>
            </div>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>💬</span>
            <div>
              <div style={styles.featureTitle}>Chat grupal</div>
              <div style={styles.featureDesc}>Las clientas se motivan entre si</div>
            </div>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>🏆</span>
            <div>
              <div style={styles.featureTitle}>Leaderboard</div>
              <div style={styles.featureDesc}>Ranking semanal de progreso</div>
            </div>
          </div>
          <div style={styles.featureItem}>
            <span style={styles.featureIcon}>📊</span>
            <div>
              <div style={styles.featureTitle}>Progreso del grupo</div>
              <div style={styles.featureDesc}>Estadisticas y metricas colectivas</div>
            </div>
          </div>
        </div>

        <div style={styles.schemaPreview}>
          <div style={styles.schemaLabel}>Tablas preparadas en la base de datos:</div>
          <div style={styles.schemaTags}>
            <span style={styles.schemaTag}>grupos</span>
            <span style={styles.schemaTag}>grupo_miembros</span>
            <span style={styles.schemaTag}>grupo_metas</span>
            <span style={styles.schemaTag}>grupo_progreso</span>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  topbar: {
    marginBottom: '2rem',
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.sageDark,
    margin: 0,
  },
  card: {
    background: 'white',
    borderRadius: 14,
    padding: '3rem 2rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center',
    maxWidth: 600,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
  },
  cardTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.sageDark,
    margin: '0 0 0.75rem',
  },
  cardText: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.95rem',
    color: colors.sageDark,
    opacity: 0.7,
    lineHeight: 1.6,
    margin: '0 0 2rem',
    maxWidth: 450,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  featureList: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: colors.cream,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  featureTitle: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.95rem',
    fontWeight: 600,
    color: colors.sageDark,
  },
  featureDesc: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.82rem',
    color: colors.sageDark,
    opacity: 0.6,
  },
  schemaPreview: {
    padding: '1rem',
    background: colors.cream,
    borderRadius: 12,
  },
  schemaLabel: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 600,
    color: colors.sageDark,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  },
  schemaTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  schemaTag: {
    padding: '0.3rem 0.75rem',
    background: 'white',
    borderRadius: 8,
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.8rem',
    color: colors.sage,
    fontWeight: 500,
  },
};
