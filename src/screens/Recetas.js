import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Datos fallback si la tabla no existe todavia
const RECETAS_FALLBACK = [
  { id: 'f1', nombre: 'Tostada de palta con huevo', categoria: 'Desayuno', emoji: '🥑', tiempo: '10 min', calorias: '280 kcal' },
  { id: 'f2', nombre: 'Bowl de quinoa con verduras', categoria: 'Almuerzo', emoji: '🥗', tiempo: '20 min', calorias: '420 kcal' },
  { id: 'f3', nombre: 'Huevos revueltos con espinaca', categoria: 'Desayuno', emoji: '🍳', tiempo: '8 min', calorias: '220 kcal' },
  { id: 'f4', nombre: 'Sopa de lentejas express', categoria: 'Cena', emoji: '🍲', tiempo: '25 min', calorias: '310 kcal' },
  { id: 'f5', nombre: 'Snack de manzana y almendras', categoria: 'Snack', emoji: '🍎', tiempo: '2 min', calorias: '150 kcal' },
  { id: 'f6', nombre: 'Salmon al horno con limon', categoria: 'Cena', emoji: '🐟', tiempo: '30 min', calorias: '380 kcal' },
  { id: 'f7', nombre: 'Smoothie verde detox', categoria: 'Desayuno', emoji: '🥤', tiempo: '5 min', calorias: '190 kcal' },
  { id: 'f8', nombre: 'Wrap de pollo y vegetales', categoria: 'Almuerzo', emoji: '🌯', tiempo: '15 min', calorias: '350 kcal' },
  { id: 'f9', nombre: 'Yogur con granola y frutas', categoria: 'Desayuno', emoji: '🫐', tiempo: '3 min', calorias: '210 kcal' },
  { id: 'f10', nombre: 'Pollo grillado con batata', categoria: 'Cena', emoji: '🍗', tiempo: '35 min', calorias: '450 kcal' },
];

function Recetas() {
  const [selectedFilter, setSelectedFilter] = useState('Todas');
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    sage: '#7a9e7e',
    sageDark: '#3d5c41',
    cream: '#f8f4ee',
    gold: '#b8956a'
  };

  // Cargar recetas de Supabase (con fallback si la tabla no existe)
  useEffect(() => {
    const loadRecetas = async () => {
      setLoading(true);
      try {
        let q = supabase
          .from('recetas')
          .select('*')
          .eq('visible', true)
          .order('created_at', { ascending: false });

        if (selectedFilter !== 'Todas') {
          const filterCategory = selectedFilter === 'Snacks' ? 'Snack' : selectedFilter;
          q = q.eq('categoria', filterCategory);
        }

        const { data, error } = await q;
        if (error) {
          // Table doesn't exist — use fallback data
          console.warn('Tabla recetas no disponible, usando datos locales:', error.message);
          // fallback activo
          const filtered = selectedFilter === 'Todas'
            ? RECETAS_FALLBACK
            : RECETAS_FALLBACK.filter(r => r.categoria === (selectedFilter === 'Snacks' ? 'Snack' : selectedFilter));
          setRecetas(filtered);
        } else {
          setRecetas(data || []);
        }
      } catch (err) {
        console.error('Error cargando recetas:', err);
        // fallback activo
        setRecetas(RECETAS_FALLBACK);
      } finally {
        setLoading(false);
      }
    };
    loadRecetas();
  }, [selectedFilter]);

  const filters = ['Todas', 'Desayuno', 'Almuerzo', 'Cena', 'Snacks'];

  const EMOJI_CATEGORIA = {
    'Desayuno': '🥣',
    'Almuerzo': '🥗',
    'Cena': '🍲',
    'Snack': '🍎',
    'Snacks': '🍎'
  };

  const styles = {
    container: {
      padding: '0',
      minHeight: 'calc(100vh - 80px)',
      background: colors.cream,
      paddingBottom: '100px'
    },
    header: {
      background: colors.cream,
      padding: '2rem 1.25rem 1.5rem',
      borderBottom: '1px solid rgba(61, 92, 65, 0.1)'
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
    filtersContainer: {
      display: 'flex',
      gap: '0.75rem',
      padding: '1rem 1.25rem',
      overflowX: 'auto',
      background: colors.cream,
      borderBottom: '1px solid rgba(61, 92, 65, 0.1)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    },
    filterChip: {
      padding: '0.5rem 1.25rem',
      borderRadius: '2rem',
      border: `2px solid ${colors.sage}`,
      background: 'white',
      color: colors.sageDark,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.2s',
      flexShrink: 0
    },
    filterChipActive: {
      background: colors.sage,
      color: 'white',
      borderColor: colors.sage
    },
    recipesList: {
      padding: '1rem 1.25rem',
      background: colors.cream
    },
    loadingText: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      textAlign: 'center',
      padding: '2rem'
    },
    recipeItem: {
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
    recipeEmoji: {
      width: '52px',
      height: '52px',
      borderRadius: '0.75rem',
      background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageDark} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.75rem',
      flexShrink: 0
    },
    recipeContent: {
      flex: 1,
      minWidth: 0
    },
    recipeName: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    recipeMetadata: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6
    },
    recipeArrow: {
      fontSize: '1.25rem',
      color: colors.sage,
      fontWeight: 300,
      flexShrink: 0
    },
    badgeNew: {
      display: 'inline-flex',
      padding: '0.2rem 0.5rem',
      borderRadius: '1rem',
      background: '#fff4e6',
      color: colors.gold,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.7rem',
      fontWeight: 500,
      marginLeft: '0.5rem'
    }
  };

  const isNew = (createdAt) => {
    if (!createdAt) return false;
    const diff = (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Tus Recetas</h1>
        <p style={styles.headerSubtitle}>Plan personalizado por Ana Karina</p>
      </div>

      <div style={styles.filtersContainer}>
        {filters.map((filter) => (
          <button
            key={filter}
            style={{
              ...styles.filterChip,
              ...(selectedFilter === filter ? styles.filterChipActive : {})
            }}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div style={styles.recipesList}>
        {loading ? (
          <div style={styles.loadingText}>Cargando recetas...</div>
        ) : recetas.length === 0 ? (
          <div style={styles.loadingText}>
            {selectedFilter === 'Todas'
              ? 'No hay recetas disponibles todavia.'
              : `No hay recetas de ${selectedFilter}.`}
          </div>
        ) : (
          recetas.map((recipe) => (
            <div
              key={recipe.id}
              style={styles.recipeItem}
              onClick={() => {
                if (recipe.url && recipe.url.trim()) {
                  window.open(recipe.url.trim(), '_blank', 'noopener,noreferrer');
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div style={styles.recipeEmoji}>
                {recipe.emoji || EMOJI_CATEGORIA[recipe.categoria] || '🍽️'}
              </div>
              <div style={styles.recipeContent}>
                <div style={styles.recipeName}>
                  {recipe.nombre}
                  {isNew(recipe.created_at) && (
                    <span style={styles.badgeNew}>Nuevo</span>
                  )}
                </div>
                <div style={styles.recipeMetadata}>
                  {recipe.categoria}
                  {recipe.tiempo ? ` · ${recipe.tiempo}` : ''}
                  {recipe.calorias ? ` · ${recipe.calorias}` : ''}
                </div>
                {recipe.descripcion && (
                  <div style={{ ...styles.recipeMetadata, marginTop: '0.25rem', opacity: 0.5, fontSize: '0.8rem' }}>
                    {recipe.descripcion}
                  </div>
                )}
              </div>
              {recipe.url && <div style={styles.recipeArrow}>›</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Recetas;
