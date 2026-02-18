import React, { useState } from 'react';

function Recetas() {
  const [selectedFilter, setSelectedFilter] = useState('Todas');

  // Colores (iguales a Home.js)
  const colors = {
    sage: '#7a9e7e',
    sageDark: '#3d5c41',
    cream: '#f8f4ee',
    gold: '#b8956a'
  };

  // Datos de recetas
  const allRecipes = [
    {
      id: 1,
      name: 'Tostada de palta con huevo',
      emoji: '🥑',
      category: 'Desayuno',
      time: '10 min',
      calories: '280 kcal'
    },
    {
      id: 2,
      name: 'Bowl de quinoa con verduras',
      emoji: '🥗',
      category: 'Almuerzo',
      time: '20 min',
      calories: '420 kcal'
    },
    {
      id: 3,
      name: 'Huevos revueltos con espinaca',
      emoji: '🍳',
      category: 'Desayuno',
      time: '8 min',
      calories: '220 kcal'
    },
    {
      id: 4,
      name: 'Sopa de lentejas express',
      emoji: '🍲',
      category: 'Cena',
      time: '25 min',
      calories: '310 kcal'
    },
    {
      id: 5,
      name: 'Snack de manzana y almendras',
      emoji: '🍎',
      category: 'Snack',
      time: '2 min',
      calories: '150 kcal'
    },
    {
      id: 6,
      name: 'Salmón al horno',
      emoji: '🐟',
      category: 'Cena',
      time: '30 min',
      calories: '380 kcal'
    },
    {
      id: 7,
      name: 'Smoothie verde',
      emoji: '🥤',
      category: 'Desayuno',
      time: '5 min',
      calories: '190 kcal'
    }
  ];

  // Filtrar recetas según el filtro seleccionado
  const filteredRecipes = selectedFilter === 'Todas'
    ? allRecipes
    : allRecipes.filter(recipe => {
        // Mapear "Snacks" a "Snack" para coincidir con los datos
        const filterCategory = selectedFilter === 'Snacks' ? 'Snack' : selectedFilter;
        return recipe.category === filterCategory;
      });

  const filters = ['Todas', 'Desayuno', 'Almuerzo', 'Cena', 'Snacks'];

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
    filtersContainer: {
      display: 'flex',
      gap: '0.75rem',
      padding: '1rem 1.25rem',
      overflowX: 'auto',
      background: colors.cream,
      borderBottom: `1px solid rgba(61, 92, 65, 0.1)`,
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    },
    filtersContainerScrollbar: {
      WebkitScrollbar: { display: 'none' }
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
    recipeItemHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Tus Recetas 🥗</h1>
        <p style={styles.headerSubtitle}>Plan personalizado por Ana Karina</p>
      </div>

      {/* Filtros horizontales */}
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

      {/* Lista de recetas */}
      <div style={styles.recipesList}>
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            style={styles.recipeItem}
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
              {recipe.emoji}
            </div>
            <div style={styles.recipeContent}>
              <div style={styles.recipeName}>{recipe.name}</div>
              <div style={styles.recipeMetadata}>
                {recipe.category} · {recipe.time} · {recipe.calories}
              </div>
            </div>
            <div style={styles.recipeArrow}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Recetas;
