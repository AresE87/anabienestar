import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CATEGORIAS = ['Respiración', 'Motivación', 'Recetas', 'Mindset'];

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');

  const [form, setForm] = useState({
    titulo: '',
    categoria: 'Respiración',
    duracion: '',
    url: '',
    descripcion: '',
    tipo: 'video',
    visible: true,
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error('Error cargando videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisible = async (id, visibleActual) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, visible: !visibleActual } : v))
    );
    const { error } = await supabase.from('videos').update({ visible: !visibleActual }).eq('id', id);
    if (error) {
      console.error('Error:', error);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, visible: visibleActual } : v))
      );
    }
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim() || !form.url.trim()) return;
    setGuardando(true);
    const datos = {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      duracion: form.duracion.trim(),
      url: form.url.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      visible: form.visible,
    };
    try {
      let error;
      if (editando) {
        const res = await supabase.from('videos').update(datos).eq('id', editando).select();
        error = res.error;
      } else {
        const res = await supabase.from('videos').insert(datos).select();
        error = res.error;
      }
      if (error) {
        console.error('Error Supabase:', error);
        alert('Error: ' + error.message);
        return;
      }
      const { data: nuevos } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      setVideos(nuevos || []);
      setForm({ titulo: '', categoria: 'Respiración', duracion: '', url: '', descripcion: '', tipo: 'video', visible: true });
      setEditando(null);
      setShowForm(false);
    } catch (err) {
      console.error('Error guardando:', err);
      alert('Error al guardar: ' + (err.message || err));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, titulo) => {
    if (!window.confirm('¿Eliminar "' + titulo + '"?')) return;
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Error eliminando:', err);
    }
  };

  const handleEditar = (vid) => {
    setForm({
      titulo: vid.titulo,
      categoria: vid.categoria || 'Respiración',
      duracion: vid.duracion || '',
      url: vid.url || '',
      descripcion: vid.descripcion || '',
      tipo: vid.tipo || 'video',
      visible: vid.visible,
    });
    setEditando(vid.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ titulo: '', categoria: 'Respiración', duracion: '', url: '', descripcion: '', tipo: 'video', visible: true });
    setEditando(null);
    setShowForm(false);
  };

  const videosFiltrados = filtroCategoria === 'Todas' ? videos : videos.filter((v) => v.categoria === filtroCategoria);

  const emojiCategoria = (cat) => {
    const map = { 'Respiración': '🧘‍♀️', 'Motivación': '💪', 'Recetas': '🍳', 'Mindset': '🧠' };
    return map[cat] || '🎬';
  };

  if (loading) return <p style={s.loading}>Cargando videos...</p>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>🎬 Videos y Audios</h2>
          <p style={s.subtitle}>{videos.length} recurso{videos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={s.addBtn}>
          + Agregar video
        </button>
      </div>

      <div style={s.filtros}>
        {['Todas', ...CATEGORIAS].map((cat) => (
          <button key={cat} onClick={() => setFiltroCategoria(cat)} style={{ ...s.filtroBtn, ...(filtroCategoria === cat ? s.filtroBtnActive : {}) }}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>{editando ? 'Editar video' : 'Nuevo video/audio'}</h3>
          <label style={s.label}>Título *</label>
          <input style={s.input} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Respiración para calmar la ansiedad" />
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Categoría</label>
              <select style={s.input} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Tipo</label>
              <select style={s.input} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="video">🎬 Video</option>
                <option value="audio">🎧 Audio</option>
              </select>
            </div>
          </div>
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Duración</label>
              <input style={s.input} value={form.duracion} onChange={(e) => setForm({ ...form, duracion: e.target.value })} placeholder="Ej: 5:30" />
            </div>
            <div style={{ flex: 2 }}>
              <label style={s.label}>URL *</label>
              <input style={s.input} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://youtube.com/... o link de Drive" />
            </div>
          </div>
          <label style={s.label}>Descripción</label>
          <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="De qué trata este contenido" />
          <label style={s.checkboxLabel}>
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
            Visible para las clientas
          </label>
          <div style={s.formButtons}>
            <button onClick={resetForm} style={s.cancelBtn}>Cancelar</button>
            <button onClick={handleGuardar} disabled={guardando || !form.titulo.trim() || !form.url.trim()} style={{ ...s.saveBtn, opacity: guardando || !form.titulo.trim() || !form.url.trim() ? 0.5 : 1 }}>
              {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {videosFiltrados.length === 0 ? (
        <p style={s.empty}>{filtroCategoria === 'Todas' ? 'No hay videos todavía. ¡Agregá el primero!' : 'No hay videos en "' + filtroCategoria + '"'}</p>
      ) : (
        <div style={s.list}>
          {videosFiltrados.map((vid) => (
            <div key={vid.id} style={{ ...s.card, opacity: vid.visible ? 1 : 0.5 }}>
              <div style={s.cardHeader}>
                <span style={s.cardEmoji}>{emojiCategoria(vid.categoria)}</span>
                <div style={{ flex: 1 }}>
                  <p style={s.cardTitle}>{vid.titulo}</p>
                  <p style={s.cardMeta}>{vid.tipo === 'audio' ? '🎧' : '🎬'} {vid.categoria}{vid.duracion ? ' · ' + vid.duracion : ''}</p>
                  {vid.descripcion && <p style={s.cardDesc}>{vid.descripcion}</p>}
                </div>
                <div style={s.cardActions}>
                  <button onClick={() => toggleVisible(vid.id, vid.visible)} style={s.toggleBtn} title={vid.visible ? 'Ocultar' : 'Mostrar'}>
                    {vid.visible ? '👁️' : '🚫'}
                  </button>
                  <button onClick={() => handleEditar(vid)} style={s.editBtn}>✏️</button>
                  <button onClick={() => handleEliminar(vid.id, vid.titulo)} style={s.deleteBtn}>🗑️</button>
                </div>
              </div>
              {vid.url && (
                <a href={vid.url} target="_blank" rel="noopener noreferrer" style={s.linkVideo}>
                  🔗 Abrir {vid.tipo === 'audio' ? 'audio' : 'video'}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: 0 },
  loading: { textAlign: 'center', color: '#7a9e7e', padding: 40, fontFamily: 'Jost, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { margin: 0, fontSize: 22, color: '#3d5c41', fontFamily: 'Playfair Display, serif' },
  subtitle: { margin: '4px 0 0', fontSize: 14, color: '#7a9e7e', fontFamily: 'Jost, sans-serif' },
  addBtn: { padding: '10px 20px', backgroundColor: '#3d5c41', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' },
  filtros: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filtroBtn: { padding: '7px 14px', backgroundColor: 'white', border: '1.5px solid #eaf2eb', borderRadius: 20, fontSize: 13, color: '#7a9e7e', cursor: 'pointer', fontFamily: 'Jost, sans-serif', fontWeight: 500 },
  filtroBtnActive: { backgroundColor: '#3d5c41', borderColor: '#3d5c41', color: 'white' },
  formCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle: { margin: '0 0 16px', fontSize: 18, color: '#3d5c41', fontFamily: 'Playfair Display, serif' },
  label: { display: 'block', fontSize: 13, color: '#7a9e7e', fontWeight: 500, marginBottom: 6, fontFamily: 'Jost, sans-serif' },
  input: { width: '100%', padding: '10px 14px', border: '2px solid #eaf2eb', borderRadius: 10, fontSize: 14, fontFamily: 'Jost, sans-serif', marginBottom: 14, outline: 'none', boxSizing: 'border-box', color: '#3d5c41' },
  row: { display: 'flex', gap: 12 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#3d5c41', fontFamily: 'Jost, sans-serif', cursor: 'pointer', marginBottom: 16 },
  formButtons: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#7a9e7e', cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#3d5c41', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
  empty: { textAlign: 'center', color: '#7a9e7e', padding: 40, fontSize: 15, fontFamily: 'Jost, sans-serif' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  cardEmoji: { fontSize: 28, flexShrink: 0, marginTop: 2 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#3d5c41', fontFamily: 'Jost, sans-serif' },
  cardMeta: { margin: '4px 0 0', fontSize: 12, color: '#7a9e7e', fontFamily: 'Jost, sans-serif' },
  cardDesc: { margin: '6px 0 0', fontSize: 13, color: '#666', lineHeight: 1.4, fontFamily: 'Jost, sans-serif' },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0 },
  toggleBtn: { padding: '6px 8px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  editBtn: { padding: '6px 8px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  deleteBtn: { padding: '6px 8px', backgroundColor: '#fff5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  linkVideo: { display: 'inline-block', marginTop: 8, fontSize: 13, color: '#b8956a', textDecoration: 'none', fontFamily: 'Jost, sans-serif' },
};
