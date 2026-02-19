import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const GUIAS_ANA = [
  { titulo: 'Guia de Bienestar Integral', descripcion: 'Tu programa de transformacion en 12 semanas. Mente, cuerpo y alma en equilibrio.', paginas: 8, url_pdf: '/pdfs/Guia_Bienestar_Integral_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: 'Guia de Salud Digestiva', descripcion: 'Tu intestino, tu segundo cerebro. Aprende a cuidarlo para transformar tu bienestar.', paginas: 8, url_pdf: '/pdfs/Guia_Salud_Digestiva_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: 'Guia de Equilibrio Emocional', descripcion: 'Aprende a habitar el presente. Tu guia para sentir, soltar y florecer.', paginas: 9, url_pdf: '/pdfs/Guia_Equilibrio_Emocional_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: 'Guia de Alimentacion Antiinflamatoria', descripcion: 'Descubri como reducir la inflamacion a traves de una alimentacion consciente.', paginas: null, url_pdf: '/pdfs/Guia_Alimentacion_Antiinflamatoria_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: '30 Tips Rapidos para tu Bienestar', descripcion: 'Un tip por dia durante un mes. Imprimilo, guardalo en el celu o pegalo en la heladera.', paginas: 3, url_pdf: '/pdfs/Tips_Rapidos_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: 'Esto x Esto: Sustituciones Saludables', descripcion: 'No se trata de eliminar lo que te gusta, sino de encontrar versiones que te hagan sentir mejor.', paginas: 2, url_pdf: '/pdfs/Esto_x_Esto_Sustituciones_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: 'Lista de Compras Consciente', descripcion: 'Todo lo que necesitas para una semana de alimentacion antiinflamatoria y consciente.', paginas: 2, url_pdf: '/pdfs/Lista_Compras_Consciente_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
  { titulo: 'SOS Emergencia: Para. Respira. Lee Esto.', descripcion: 'Guarda este PDF en tu celular. Leelo antes de decidir. Para momentos de tentacion.', paginas: 1, url_pdf: '/pdfs/SOS_Emergencia_AnaBienestarIntegral.pdf', para_todas: true, visible: true },
];

export default function AdminMaterial() {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargandoGuias, setCargandoGuias] = useState(false);

  // Asignacion
  const [asignandoMat, setAsignandoMat] = useState(null); // material seleccionado para asignar
  const [clientas, setClientas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]); // usuario_ids asignados al material actual
  const [loadingAsign, setLoadingAsign] = useState(false);

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

  // Cargar clientas (para el modal de asignacion)
  const fetchClientas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, avatar')
        .eq('rol', 'clienta')
        .order('nombre');
      if (!error) setClientas(data || []);
    } catch (err) {
      console.error('Error cargando clientas:', err);
    }
  }, []);

  // Cargar asignaciones de un material
  const fetchAsignaciones = useCallback(async (materialId) => {
    try {
      const { data, error } = await supabase
        .from('material_usuarios')
        .select('usuario_id')
        .eq('material_id', materialId);
      if (!error) setAsignaciones((data || []).map(d => d.usuario_id));
    } catch (err) {
      console.error('Error cargando asignaciones:', err);
      setAsignaciones([]);
    }
  }, []);

  // Abrir modal de asignacion
  const handleOpenAsignar = async (mat) => {
    setAsignandoMat(mat);
    setLoadingAsign(true);
    await Promise.all([fetchClientas(), fetchAsignaciones(mat.id)]);
    setLoadingAsign(false);
  };

  // Toggle asignacion de una clienta
  const handleToggleAsignacion = async (usuarioId) => {
    if (!asignandoMat) return;
    const yaAsignada = asignaciones.includes(usuarioId);

    if (yaAsignada) {
      // Quitar
      setAsignaciones(prev => prev.filter(id => id !== usuarioId));
      const { error } = await supabase
        .from('material_usuarios')
        .delete()
        .eq('material_id', asignandoMat.id)
        .eq('usuario_id', usuarioId);
      if (error) {
        console.error('Error quitando asignacion:', error);
        setAsignaciones(prev => [...prev, usuarioId]); // rollback
      }
    } else {
      // Agregar
      setAsignaciones(prev => [...prev, usuarioId]);
      const { error } = await supabase
        .from('material_usuarios')
        .insert({ material_id: asignandoMat.id, usuario_id: usuarioId });
      if (error) {
        console.error('Error asignando:', error);
        setAsignaciones(prev => prev.filter(id => id !== usuarioId)); // rollback
      }
    }
  };

  // Asignar a todas
  const handleAsignarTodas = async () => {
    if (!asignandoMat) return;
    const noAsignadas = clientas.filter(c => !asignaciones.includes(c.id));
    if (noAsignadas.length === 0) return;

    const nuevasIds = noAsignadas.map(c => c.id);
    setAsignaciones(prev => [...prev, ...nuevasIds]);

    const inserts = noAsignadas.map(c => ({ material_id: asignandoMat.id, usuario_id: c.id }));
    const { error } = await supabase.from('material_usuarios').insert(inserts);
    if (error) {
      console.error('Error asignando a todas:', error);
      await fetchAsignaciones(asignandoMat.id); // refetch on error
    }
  };

  // Quitar todas
  const handleQuitarTodas = async () => {
    if (!asignandoMat) return;
    setAsignaciones([]);
    const { error } = await supabase
      .from('material_usuarios')
      .delete()
      .eq('material_id', asignandoMat.id);
    if (error) {
      console.error('Error quitando todas:', error);
      await fetchAsignaciones(asignandoMat.id);
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
      await fetchMateriales();
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

  // Cargar las 8 guias de Ana Bienestar
  const handleCargarGuias = async () => {
    if (!window.confirm('¿Cargar las 8 guías de Ana Bienestar? Si ya existen, se duplicarán.')) return;
    setCargandoGuias(true);
    try {
      const { error } = await supabase.from('material').insert(GUIAS_ANA).select();
      if (error) {
        alert('Error: ' + error.message);
      } else {
        await fetchMateriales();
      }
    } catch (err) {
      alert('Error: ' + (err.message || err));
    } finally {
      setCargandoGuias(false);
    }
  };

  if (loading) return <p style={s.loading}>Cargando material...</p>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>📚 Material</h2>
          <p style={s.subtitle}>{materiales.length} recurso{materiales.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {materiales.length === 0 && (
            <button onClick={handleCargarGuias} disabled={cargandoGuias} style={{ ...s.addBtn, backgroundColor: '#b8956a' }}>
              {cargandoGuias ? 'Cargando...' : '📄 Cargar guías'}
            </button>
          )}
          <button onClick={() => { resetForm(); setShowForm(true); }} style={s.addBtn}>
            + Agregar material
          </button>
        </div>
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
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={s.empty}>No hay material todavía.</p>
          <button onClick={handleCargarGuias} disabled={cargandoGuias} style={{ ...s.addBtn, backgroundColor: '#b8956a', marginTop: 12 }}>
            {cargandoGuias ? 'Cargando...' : '📄 Cargar 8 guías de Ana Bienestar'}
          </button>
        </div>
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
                    {mat.paginas ? ' · ' : ''}
                    {mat.para_todas ? '👥 Todas las clientas' : '👤 Asignación individual'}
                  </p>
                </div>
                <div style={s.cardActions}>
                  {!mat.para_todas && (
                    <button onClick={() => handleOpenAsignar(mat)} style={s.assignBtn} title="Asignar clientas">
                      👥
                    </button>
                  )}
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

      {/* ── Modal de asignacion ───────────────────── */}
      {asignandoMat && (
        <div style={s.modalOverlay} onClick={() => setAsignandoMat(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Asignar: {asignandoMat.titulo}</h3>
            <p style={s.modalSubtitle}>
              {asignaciones.length} clienta{asignaciones.length !== 1 ? 's' : ''} asignada{asignaciones.length !== 1 ? 's' : ''}
            </p>

            {loadingAsign ? (
              <p style={s.loading}>Cargando...</p>
            ) : clientas.length === 0 ? (
              <p style={s.empty}>No hay clientas registradas.</p>
            ) : (
              <>
                <div style={s.modalActions}>
                  <button onClick={handleAsignarTodas} style={s.modalActionBtn}>Asignar todas</button>
                  <button onClick={handleQuitarTodas} style={{ ...s.modalActionBtn, backgroundColor: '#fff5f5', color: '#c44' }}>Quitar todas</button>
                </div>
                <div style={s.clientasList}>
                  {clientas.map((c) => {
                    const asignada = asignaciones.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleToggleAsignacion(c.id)}
                        style={{
                          ...s.clientaItem,
                          backgroundColor: asignada ? '#eaf2eb' : 'white',
                          borderColor: asignada ? '#7a9e7e' : '#eee',
                        }}
                      >
                        <span style={s.clientaAvatar}>{c.avatar || '👤'}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={s.clientaNombre}>{c.nombre || 'Sin nombre'}</p>
                          <p style={s.clientaEmail}>{c.email}</p>
                        </div>
                        <span style={{ fontSize: 18, color: asignada ? '#3d5c41' : '#ccc' }}>
                          {asignada ? '✓' : '○'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <button onClick={() => setAsignandoMat(null)} style={s.modalCloseBtn}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  container: { padding: 0 },
  loading: { textAlign: 'center', color: '#7a9e7e', padding: 40, fontFamily: 'Jost, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
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
  empty: { textAlign: 'center', color: '#7a9e7e', padding: 20, fontSize: 15, fontFamily: 'Jost, sans-serif', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', transition: 'opacity 0.2s' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 600, color: '#3d5c41', fontFamily: 'Jost, sans-serif' },
  cardDesc: { margin: '4px 0 0', fontSize: 13, color: '#666', lineHeight: 1.4, fontFamily: 'Jost, sans-serif' },
  cardMeta: { margin: '6px 0 0', fontSize: 12, color: '#7a9e7e', fontFamily: 'Jost, sans-serif' },
  cardActions: { display: 'flex', gap: 6, flexShrink: 0 },
  assignBtn: { padding: '6px 8px', backgroundColor: '#fff4e6', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  toggleBtn: { padding: '6px 8px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  editBtn: { padding: '6px 8px', backgroundColor: '#f8f4ee', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  deleteBtn: { padding: '6px 8px', backgroundColor: '#fff5f5', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 },
  linkPdf: { display: 'inline-block', marginTop: 8, fontSize: 13, color: '#b8956a', textDecoration: 'none', fontFamily: 'Jost, sans-serif' },
  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { backgroundColor: 'white', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', maxHeight: '80vh', overflow: 'auto' },
  modalTitle: { margin: 0, fontSize: 18, color: '#3d5c41', fontFamily: 'Playfair Display, serif' },
  modalSubtitle: { margin: '4px 0 16px', fontSize: 13, color: '#7a9e7e', fontFamily: 'Jost, sans-serif' },
  modalActions: { display: 'flex', gap: 8, marginBottom: 16 },
  modalActionBtn: { padding: '8px 16px', backgroundColor: '#eaf2eb', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#3d5c41', cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
  clientasList: { display: 'flex', flexDirection: 'column', gap: 8 },
  clientaItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '2px solid #eee', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s', width: '100%', fontFamily: 'Jost, sans-serif', background: 'white' },
  clientaAvatar: { fontSize: 24, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#f8f4ee', flexShrink: 0 },
  clientaNombre: { margin: 0, fontSize: 14, fontWeight: 600, color: '#3d5c41' },
  clientaEmail: { margin: '2px 0 0', fontSize: 12, color: '#7a9e7e' },
  modalCloseBtn: { marginTop: 20, width: '100%', padding: '12px', backgroundColor: '#3d5c41', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
};
