import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a'
};

const CATEGORIAS = ['Desayuno', 'Almuerzo', 'Cena', 'Snack'];

const EMOJI_DEFAULTS = {
  'Desayuno': '🥣',
  'Almuerzo': '🥗',
  'Cena': '🍲',
  'Snack': '🍎'
};

const styles = {
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  topbarTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.75rem', fontWeight: 600, color: colors.sageDark, margin: 0 },
  section: { background: 'white', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, color: colors.sageDark, marginBottom: '1rem' },
  buttonPrimary: { padding: '0.75rem 1.5rem', borderRadius: '14px', border: 'none', background: colors.sage, color: 'white', fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(61, 92, 65, 0.3)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(61, 92, 65, 0.3)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box', background: 'white' },
  textarea: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(61, 92, 65, 0.3)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
  filtersRow: { display: 'flex', gap: '0.75rem', marginBottom: '1rem', overflowX: 'auto' },
  filterChip: { padding: '0.5rem 1rem', borderRadius: '2rem', border: `2px solid ${colors.sage}`, background: 'white', color: colors.sageDark, fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  filterChipActive: { background: colors.sage, color: 'white', borderColor: colors.sage },
  card: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '0.75rem', background: colors.cream, borderRadius: '8px' },
  cardEmoji: { fontSize: '1.75rem', width: '44px', textAlign: 'center', flexShrink: 0 },
  cardContent: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: colors.sageDark },
  cardMeta: { fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: colors.sageDark, opacity: 0.6 },
  cardActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  smallBtn: { padding: '0.4rem 0.7rem', borderRadius: '6px', border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', cursor: 'pointer' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: colors.sageDark },
};

export default function AdminRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todas');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '', categoria: 'Desayuno', emoji: '', tiempo: '', calorias: '',
    descripcion: '', url: '', visible: true
  });

  const loadRecetas = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('recetas').select('*').order('created_at', { ascending: false });
      if (filtro !== 'Todas') q = q.eq('categoria', filtro);
      const { data, error } = await q;
      if (error) {
        console.warn('Tabla recetas no disponible:', error.message);
      } else {
        setRecetas(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { loadRecetas(); }, [loadRecetas]);

  const resetForm = () => {
    setForm({ nombre: '', categoria: 'Desayuno', emoji: '', tiempo: '', calorias: '', descripcion: '', url: '', visible: true });
    setEditando(null);
    setShowForm(false);
  };

  const handleGuardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      const datos = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        emoji: form.emoji.trim() || EMOJI_DEFAULTS[form.categoria] || '🍽️',
        tiempo: form.tiempo.trim() || null,
        calorias: form.calorias.trim() || null,
        descripcion: form.descripcion.trim() || null,
        url: form.url.trim() || null,
        visible: form.visible
      };

      let error;
      if (editando) {
        const res = await supabase.from('recetas').update(datos).eq('id', editando).select();
        error = res.error;
      } else {
        const res = await supabase.from('recetas').insert(datos).select();
        error = res.error;
      }

      if (error) {
        alert('Error: ' + error.message);
      } else {
        resetForm();
        loadRecetas();
      }
    } catch (err) {
      alert('Error: ' + (err.message || err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (r) => {
    setForm({
      nombre: r.nombre || '',
      categoria: r.categoria || 'Desayuno',
      emoji: r.emoji || '',
      tiempo: r.tiempo || '',
      calorias: r.calorias || '',
      descripcion: r.descripcion || '',
      url: r.url || '',
      visible: r.visible !== false
    });
    setEditando(r.id);
    setShowForm(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('Eliminar receta?')) return;
    await supabase.from('recetas').delete().eq('id', id);
    loadRecetas();
  };

  const handleToggleVisible = async (id, visible) => {
    await supabase.from('recetas').update({ visible: !visible }).eq('id', id);
    setRecetas(prev => prev.map(r => r.id === id ? { ...r, visible: !visible } : r));
  };

  return (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Recetas</h1>
        <button style={styles.buttonPrimary} onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : '+ Agregar receta'}
        </button>
      </div>

      {showForm && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{editando ? 'Editar receta' : 'Nueva receta'}</h2>
          <input style={styles.input} placeholder="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select style={{ ...styles.select, flex: 1 }} value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Emoji (ej: 🥑)" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input style={{ ...styles.input, flex: 1 }} placeholder="Tiempo (ej: 20 min)" value={form.tiempo} onChange={e => setForm({ ...form, tiempo: e.target.value })} />
            <input style={{ ...styles.input, flex: 1 }} placeholder="Calorias (ej: 380 kcal)" value={form.calorias} onChange={e => setForm({ ...form, calorias: e.target.value })} />
          </div>
          <textarea style={styles.textarea} placeholder="Descripcion..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
          <input style={styles.input} placeholder="URL (link a la receta)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <label style={styles.checkbox}>
            <input type="checkbox" checked={form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })} />
            Visible para clientas
          </label>
          <button style={{ ...styles.buttonPrimary, opacity: guardando || !form.nombre.trim() ? 0.5 : 1 }} onClick={handleGuardar} disabled={guardando || !form.nombre.trim()}>
            {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear receta'}
          </button>
        </div>
      )}

      <div style={styles.filtersRow}>
        {['Todas', ...CATEGORIAS].map(c => (
          <button key={c} style={{ ...styles.filterChip, ...(filtro === c ? styles.filterChipActive : {}) }} onClick={() => setFiltro(c)}>
            {c}
          </button>
        ))}
      </div>

      <div style={styles.section}>
        {loading ? (
          <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>Cargando...</p>
        ) : recetas.length === 0 ? (
          <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark, opacity: 0.7 }}>No hay recetas.</p>
        ) : (
          recetas.map(r => (
            <div key={r.id} style={{ ...styles.card, opacity: r.visible ? 1 : 0.5 }}>
              <div style={styles.cardEmoji}>{r.emoji || EMOJI_DEFAULTS[r.categoria] || '🍽️'}</div>
              <div style={styles.cardContent}>
                <div style={styles.cardTitle}>{r.nombre}</div>
                <div style={styles.cardMeta}>
                  {r.categoria}{r.tiempo ? ` · ${r.tiempo}` : ''}{r.calorias ? ` · ${r.calorias}` : ''}
                </div>
              </div>
              <div style={styles.cardActions}>
                <button style={{ ...styles.smallBtn, background: r.visible ? colors.sage : '#999', color: 'white' }} onClick={() => handleToggleVisible(r.id, r.visible)}>
                  {r.visible ? '👁' : '🚫'}
                </button>
                <button style={{ ...styles.smallBtn, background: colors.gold, color: 'white' }} onClick={() => handleEditar(r)}>
                  Editar
                </button>
                <button style={{ ...styles.smallBtn, background: colors.orange, color: 'white' }} onClick={() => handleEliminar(r.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
