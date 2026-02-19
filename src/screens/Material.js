import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const colors = {
  sage: '#7a9e7e',
  sageDark: '#3d5c41',
  cream: '#f8f4ee',
  gold: '#b8956a'
};

const CATEGORIAS_VIDEOS = [
  { id: 'Todas', label: 'Todas' },
  { id: 'Respiración', label: 'Respiración' },
  { id: 'Motivación', label: 'Motivación' },
  { id: 'Recetas', label: 'Recetas' },
  { id: 'Mindset', label: 'Mindset' }
];

const EMOJI_CATEGORIA = {
  'Respiración': '🧘‍♀️',
  'Motivación': '💪',
  'Recetas': '🍳',
  'Mindset': '🧠'
};

function isNew(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

function Material() {
  const [materiales, setMateriales] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  useEffect(() => {
    const load = async () => {
      setLoadingMaterial(true);
      try {
        const { data, error } = await supabase
          .from('material')
          .select('*')
          .eq('visible', true)
          .order('created_at', { ascending: false });
        if (!error) setMateriales(data || []);
      } catch (err) {
        console.error('Error cargando material:', err);
      } finally {
        setLoadingMaterial(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingVideos(true);
      try {
        let q = supabase
          .from('videos')
          .select('*')
          .eq('visible', true)
          .order('created_at', { ascending: false });
        if (filtroCategoria !== 'Todas') {
          q = q.eq('categoria', filtroCategoria);
        }
        const { data, error } = await q;
        if (!error) setVideos(data || []);
      } catch (err) {
        console.error('Error cargando videos:', err);
      } finally {
        setLoadingVideos(false);
      }
    };
    load();
  }, [filtroCategoria]);

  const styles = {
    container: {
      padding: 0,
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
    loadingText: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      textAlign: 'center',
      padding: '1.5rem'
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
    featuredContent: { flex: 1, minWidth: 0 },
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
    featuredBadgeContainer: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
    badgeNew: {
      display: 'inline-flex',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      background: '#fff4e6',
      color: colors.gold,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 500
    },
    downloadIcon: { fontSize: '1.25rem', color: colors.sage, marginLeft: 'auto' },
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
      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      flexShrink: 0
    },
    libraryContent: { flex: 1, minWidth: 0 },
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
    libraryBadgeContainer: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' },
    libraryArrow: { fontSize: '1.25rem', color: colors.sage, fontWeight: 300, flexShrink: 0 },
    filtersRow: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '1rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem'
    },
    filterChip: {
      padding: '0.5rem 1rem',
      borderRadius: '2rem',
      border: `2px solid ${colors.sage}`,
      background: 'white',
      color: colors.sageDark,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0
    },
    filterChipActive: {
      background: colors.sage,
      color: 'white',
      borderColor: colors.sage
    },
    videoCard: {
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
    videoEmoji: {
      width: '44px',
      height: '44px',
      borderRadius: '0.5rem',
      background: colors.cream,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      flexShrink: 0
    },
    videoContent: { flex: 1, minWidth: 0 },
    videoTitle: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    videoMeta: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6
    },
    videoArrow: { fontSize: '1.25rem', color: colors.sage, flexShrink: 0 }
  };

  const handleOpenPdf = (url) => {
    if (url && url.trim()) window.open(url.trim(), '_blank', 'noopener,noreferrer');
  };

  const handleOpenVideo = (url) => {
    if (url && url.trim()) window.open(url.trim(), '_blank', 'noopener,noreferrer');
  };

  // eslint-disable-next-line no-unused-vars
  const loading = loadingMaterial && loadingVideos;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Tu Material 📚</h1>
        <p style={styles.headerSubtitle}>eBooks y recursos de tu programa</p>
      </div>

      {/* Material / eBooks */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Tu biblioteca</h2>
        {loadingMaterial ? (
          <div style={styles.loadingText}>Cargando...</div>
        ) : materiales.length === 0 ? (
          <div style={styles.loadingText}>No hay material disponible.</div>
        ) : (
          <>
            {materiales.map((mat) => {
              const nuevo = isNew(mat.created_at);
              const tieneUrl = mat.url_pdf && mat.url_pdf.trim();
              return (
                <div
                  key={mat.id}
                  style={styles.libraryCard}
                  onClick={() => tieneUrl && handleOpenPdf(mat.url_pdf)}
                  onMouseEnter={(e) => {
                    if (tieneUrl) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                  }}
                >
                  <div style={styles.libraryIcon}>📖</div>
                  <div style={styles.libraryContent}>
                    <div style={styles.libraryTitle}>{mat.titulo}</div>
                    <div style={styles.libraryMetadata}>
                      {mat.descripcion && `${mat.descripcion} · `}
                      {mat.paginas != null ? `${mat.paginas} págs` : 'PDF'}
                    </div>
                    {nuevo && (
                      <div style={styles.libraryBadgeContainer}>
                        <span style={styles.badgeNew}>🆕 Nuevo</span>
                      </div>
                    )}
                  </div>
                  {tieneUrl && <div style={styles.libraryArrow}>›</div>}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Videos y audios */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Videos y audios</h2>
        <div style={styles.filtersRow}>
          {CATEGORIAS_VIDEOS.map((c) => (
            <button
              key={c.id}
              style={{
                ...styles.filterChip,
                ...(filtroCategoria === c.id ? styles.filterChipActive : {})
              }}
              onClick={() => setFiltroCategoria(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {loadingVideos ? (
          <div style={styles.loadingText}>Cargando...</div>
        ) : videos.length === 0 ? (
          <div style={styles.loadingText}>No hay videos en esta categoría.</div>
        ) : (
          videos.map((v) => {
            const emoji = EMOJI_CATEGORIA[v.categoria] || '🎬';
            const tipoLabel = (v.tipo === 'audio' ? '🎧 Audio' : '🎬 Video');
            const tieneUrl = v.url && v.url.trim();
            return (
              <div
                key={v.id}
                style={styles.videoCard}
                onClick={() => tieneUrl && handleOpenVideo(v.url)}
                onMouseEnter={(e) => {
                  if (tieneUrl) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
              >
                <div style={styles.videoEmoji}>{emoji}</div>
                <div style={styles.videoContent}>
                  <div style={styles.videoTitle}>{v.titulo}</div>
                  <div style={styles.videoMeta}>
                    {v.categoria} · {v.duracion || '—'} · {tipoLabel}
                  </div>
                </div>
                {tieneUrl && <div style={styles.videoArrow}>›</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Material;
