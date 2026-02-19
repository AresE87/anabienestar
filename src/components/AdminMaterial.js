import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminMaterial() {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    paginas: '',
    url_pdf: '',
    para_todas: true,
    visible: true,
  });

  useEffect(() => {
    fetchMateriales();
  }, []);

  const fetchMateriales = async () => {
    try {
      const { data, error } = await supabase
        .from('material')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMateriales(data || []);
    } catch (err) {
      console.error('Error cargando material:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisible = async (id, visibleActual) => {
    setMateriales((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visible: !visibleActual } : m))
    );
    const { error } = await supabase
      .from('material')
      .update({ visible: !visibleActual })
      .eq('id', id);
    if (error) {
      console.error('Error:', error);
      setMateriales((prev) =>
        prev.map((m) => (m.id === id ? { ...m, visible: visibleActual } : m))
      );
    }
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim()) return;
    setGuardando(true);
    const datos = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      paginas: form.paginas ? parseInt(form.paginas) : null,
      url_pdf: form.url_pdf.trim(),
      para_todas: form.para_todas,
      visible: form.visible,
    };
    try {
      let error;
      if (editando) {
        const res = await supabase.from('material').update(datos).eq('id', editando).select();
        error = res.error;
      } else {
        const res = await supabase.from('material').insert(datos).select();
        error = res.error;
      }
      if (error) {
        console.error('Error Supabase:', error);
        alert('Error: ' + error.message);
        return;
      }
      const { data: nuevos } = await supabase
        .from('material')
        .select('*')
        .order('created_at', { ascending: false });
      setMateriales(nuevos || []);
      setForm({ titulo: '', descripcion: '', paginas: '', url_pdf: '', para_todas: true, visible: true });
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
      const { error } = await supabase.from('material').delete().eq('id', id);
      if (error) throw error;
      setMateriales((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error eliminando:', err);
    }
  };

  const handleEditar = (mat) => {
    setForm({
      titulo: mat.titulo,
      descripcion: mat.descripcion || '',
      paginas: mat.paginas ? String(mat.paginas) : '',
      url_pdf: mat.url_pdf || '',
      para_todas: mat.para_todas,
      visible: mat.visible,
    });
    setEditando(mat.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ titulo: '', descripcion: '', paginas: '', url_pdf: '', para_todas: true, visible: true });
    setEditando(null);
    setShowForm(false);
  };

  if (loading) return <p style={s.loading}>Cargando material...</p>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>📚 Material</h2>
          <p style={s.subtitle}>{materiales.length} recurso{materiales.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} style={s.addBtn}>
          + Agregar material
        </button>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>{editando ? 'Editar material' : 'Nuevo material'}</h3>
          <label style={s.label}>Título *</label>
          <input style={s.input} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Guía de alimentación consciente" />
          <label style={s.label}>Descripción</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripción del contenido" />
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Páginas</label>
              <input style={s.input} type="number" value={form.paginas} onChange={(e) => setForm({ ...form, paginas: e.target.value })} placeholder="Ej: 24" />
            </div>
            <div style={{ flex: 2 }}>
              <label style={s.label}>URL del PDF</label>
              <input style={s.input} value={form.url_pdf} onChange={(e) => setForm({ ...form, url_pdf: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div style={s.checkboxRow}>
            <label style={s.checkboxLabel}>
              <input type="checkbox" checked={form.para_todas} onChange={(e) => setForm({ ...form, para_todas: e.target.checked })} />
              Para todas las clientas
            </label>
            <label style={s.checkboxLabel}>
              <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
              Visible
            </label>
          </div>
          <div style={s.formButtons}>
            <button onClick={resetForm} style={s.cancelBtn}>Cancelar</button>
            <button onClick={handleGuardar} disabled={guardando || !form.titulo.trim()} style={{ ...s.saveBtn, opacity: guardando || !form.titulo.trim() ? 0.5 : 1 }}>
              {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {materiales.length === 0 ? (
        <p style={s.empty}>No hay material todavía. ¡Agregá el primero!</p>
      ) : (
        <div style={s.list}>
          {materiales.map((mat) => (
            <div key={mat.id} style={{ ...s.card, opacity: mat.visible ? 1 : 0.5 }}>
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <p style={s.cardTitle}>📄 {mat.titulo}</p>
                  {mat.descripcion && <p style={s.cardDesc}>{mat.descripcion}</p>}
                  <p style={s.cardMeta}>
                    {mat.paginas ? mat.paginas + ' págs' : ''}
                    {mat.paginas && mat.para_todas ? ' · ' : ''}
                    {mat.para_todas ? 'Todas las clientas' : 'Asignación individual'}
                  </p>
                </div>
                <div style={s.cardActions}>
                  <button onClick={() => toggleVisible(mat.id, mat.visible)} style={s.toggleBtn} title={mat.visible ? 'Ocultar' : 'Mostrar'}>
                    {mat.visible ? '👁️' : '🚫'}
                  </button>
                  <button onClick={() => handleEditar(mat)} style={s.editBtn}>✏️</button>
                  <button onClick={() => handleEliminar(mat.id, mat.titulo)} style={s.deleteBtn}>🗑️</button>
                </div>
              </div>
              {mat.url_pdf && (
                <a href={mat.url_pdf} target="_blank" rel="noopener noreferrer" style={s.linkPdf}>
                  🔗 Ver PDF
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { margin: 0, fontSize: 22, color: '#3d5c41', fontFamily: 'Playfair Display, serif' },
  subtitle: { margin: '4px 0 0', fontSize: 14, color: '#7a9e7e', fontFamily: 'Jost, sans-serif' },
  addBtn: { padding: '10px 20px', backgroundColor: '#3d5c41', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' },
  formCard: { backgroundColor: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  formTitle: { margin: '0 0 16px', fontSize: 18, color: '#3d5c41', fontFamily: 'Playfair Display, serif' },
  label: { display: 'block', fontSize: 13, color: '#7a9e7e', fontWeight: 500, marginBottom: 6, fontFamily: 'Jost, sans-serif' },
  input: { width: '100%', padding: '10px 14px', border: '2px solid #eaf2eb', borderRadius: 10, fontSize: 14, fontFamily: 'Jost, sans-serif', marginBottom: 14, outline: 'none', boxSizing: 'border-box', color: '#3d5c41' },
  row: { display: 'flex', gap: 12 },
  checkboxRow: { display: 'flex', gap: 20, marginBottom: 16 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#3d5c41', fontFamily: 'Jost, sans-serif', cursor: 'pointer' },
  formButtons: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#7a9e7e', cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#3d5c41', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
  empty: { textAlign: 'center', color: '#7a9e7e', padding: 40, fontSize: 15, fontFamily: 'Jost, sans-serif' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#3d5c41', fontFamily: 'Jost, sans-serif' },
  cardDesc: { margin: '4px 0 0', fontSize: 13, color: '#666', lineHeight: 1.4, fontFamily: 'Jost, sans-serif' },
  cardMeta: { margin: '6px 0 0', fontSize: 12, color: '#7a9e7e', fontFamily: 'Jost, sans-serif' },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0 },
  toggleBtn: { padding: '6px 8px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  editBtn: { padding: '6px 8px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  deleteBtn: { padding: '6px 8px', backgroundColor: '#fff5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  linkPdf: { display: 'inline-block', marginTop: 8, fontSize: 13, color: '#b8956a', textDecoration: 'none', fontFamily: 'Jost, sans-serif' },
};
