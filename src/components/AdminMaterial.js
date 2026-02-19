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

// Titulos de las guias para detectar duplicados
const TITULOS_GUIAS = GUIAS_ANA.map(g => g.titulo);

export default function AdminMaterial() {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargandoGuias, setCargandoGuias] = useState(false);

  // Asignacion
  const [asignandoMat, setAsignandoMat] = useState(null);
  const [clientas, setClientas] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
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
    setFetchError(null);
    try {
      const { data, error } = await supabase
        .from('material')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error cargando material:', error);
        setFetchError(error.message);
        setMateriales([]);
      } else {
        setMateriales(data || []);
      }
    } catch (err) {
      console.error('Error cargando material:', err);
      setFetchError(err.message || 'Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  // Detectar si las guias de Ana ya estan cargadas
  const guiasYaCargadas = materiales.some(m => TITULOS_GUIAS.includes(m.titulo));

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
      setAsignaciones(prev => prev.filter(id => id !== usuarioId));
      const { error } = await supabase
        .from('material_usuarios')
        .delete()
        .eq('material_id', asignandoMat.id)
        .eq('usuario_id', usuarioId);
      if (error) {
        console.error('Error quitando asignacion:', error);
        setAsignaciones(prev => [...prev, usuarioId]);
      }
    } else {
      setAsignaciones(prev => [...prev, usuarioId]);
      const { error } = await supabase
        .from('material_usuarios')
        .insert({ material_id: asignandoMat.id, usuario_id: usuarioId });
      if (error) {
        console.error('Error asignando:', error);
        setAsignaciones(prev => prev.filter(id => id !== usuarioId));
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
      await fetchAsignaciones(asignandoMat.id);
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
      let res;
      if (editando) {
        res = await supabase.from('material').update(datos).eq('id', editando).select();
      } else {
        res = await supabase.from('material').insert(datos).select();
      }
      if (res.error) {
        // Fallback: intentar sin para_todas si la columna no existe
        if (res.error.message && res.error.message.includes('para_todas')) {
          const { para_todas, ...datosSimple } = datos;
          const res2 = editando
            ? await supabase.from('material').update(datosSimple).eq('id', editando).select()
            : await supabase.from('material').insert(datosSimple).select();
          if (res2.error) {
            alert('Error: ' + res2.error.message);
            return;
          }
        } else {
          alert('Error: ' + res.error.message);
          return;
        }
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
      para_todas: mat.para_todas !== undefined ? mat.para_todas : true,
      visible: mat.visible !== undefined ? mat.visible : true,
    });
    setEditando(mat.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ titulo: '', descripcion: '', paginas: '', url_pdf: '', para_todas: true, visible: true });
    setEditando(null);
    setShowForm(false);
  };

  // Cargar las 8 guias de Ana Bienestar con fallback
  const handleCargarGuias = async () => {
    if (guiasYaCargadas) {
      alert('Las guias de Ana Bienestar ya estan cargadas.');
      return;
    }
    if (!window.confirm('¿Cargar las 8 guias de Ana Bienestar?')) return;
    setCargandoGuias(true);
    try {
      // Intentar con todas las columnas
      const { error } = await supabase.from('material').insert(GUIAS_ANA).select();
      if (error) {
        // Fallback: si falla por columna para_todas, intentar sin ella
        if (error.message && (error.message.includes('para_todas') || error.message.includes('column'))) {
          const guiasSinParaTodas = GUIAS_ANA.map(({ para_todas, ...rest }) => rest);
          const { error: error2 } = await supabase.from('material').insert(guiasSinParaTodas).select();
          if (error2) {
            alert('Error cargando guias: ' + error2.message + '\n\nAsegurate de haber ejecutado supabase_material_alter.sql en el SQL Editor de Supabase.');
          } else {
            await fetchMateriales();
          }
        } else {
          alert('Error cargando guias: ' + error.message + '\n\nAsegurate de haber ejecutado supabase_material_alter.sql en el SQL Editor de Supabase.');
        }
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
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Material</h2>
          <p style={s.subtitle}>{materiales.length} recurso{materiales.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!guiasYaCargadas && (
            <button onClick={handleCargarGuias} disabled={cargandoGuias} style={s.guiasBtn}>
              {cargandoGuias ? 'Cargando...' : '📄 Cargar guias de Ana'}
            </button>
          )}
          {guiasYaCargadas && (
            <span style={s.guiasBadge}>✅ Guias cargadas</span>
          )}
          <button onClick={() => { resetForm(); setShowForm(true); }} style={s.addBtn}>
            + Agregar material
          </button>
        </div>
      </div>

      {/* Error de conexion */}
      {fetchError && (
        <div style={s.errorBox}>
          <p style={s.errorText}>Error al cargar materiales: {fetchError}</p>
          <button onClick={fetchMateriales} style={s.retryBtn}>Reintentar</button>
        </div>
      )}

      {/* Formulario (oculto por defecto, se muestra al hacer click en + Agregar material) */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>{editando ? 'Editar material' : 'Nuevo material'}</h3>
          <label style={s.label}>Titulo *</label>
          <input style={s.input} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Guia de alimentacion consciente" />
          <label style={s.label}>Descripcion</label>
          <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripcion del contenido" />
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Paginas</label>
              <input style={s.input} type="number" value={form.paginas} onChange={(e) => setForm({ ...form, paginas: e.target.value })} placeholder="Ej: 24" />
            </div>
            <div style={{ flex: 2 }}>
              <label style={s.label}>URL del PDF</label>
              <input style={s.input} value={form.url_pdf} onChange={(e) => setForm({ ...form, url_pdf: e.target.value })} placeholder="/pdfs/mi-archivo.pdf o https://..." />
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

      {/* Lista de materiales */}
      {!fetchError && materiales.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>📚</div>
          <p style={s.emptyTitle}>No hay material todavia</p>
          <p style={s.emptyDesc}>Carga las guias de Ana o agrega material nuevo con el boton de arriba.</p>
          <button onClick={handleCargarGuias} disabled={cargandoGuias} style={{ ...s.guiasBtn, marginTop: 16 }}>
            {cargandoGuias ? 'Cargando...' : '📄 Cargar 8 guias de Ana Bienestar'}
          </button>
        </div>
      ) : (
        <div style={s.list}>
          {materiales.map((mat) => (
            <div key={mat.id} style={{ ...s.card, opacity: mat.visible === false ? 0.5 : 1 }}>
              <div style={s.cardHeader}>
                <div style={{ flex: 1 }}>
                  <p style={s.cardTitle}>📄 {mat.titulo}</p>
                  {mat.descripcion && <p style={s.cardDesc}>{mat.descripcion}</p>}
                  <p style={s.cardMeta}>
                    {mat.paginas ? mat.paginas + ' pags' : ''}
                    {mat.paginas ? ' · ' : ''}
                    {mat.para_todas === false ? '👤 Asignacion individual' : '👥 Todas las clientas'}
                  </p>
                </div>
                <div style={s.cardActions}>
                  {mat.para_todas === false && (
                    <button onClick={() => handleOpenAsignar(mat)} style={s.assignBtn} title="Asignar clientas">
                      👥
                    </button>
                  )}
                  <button onClick={() => toggleVisible(mat.id, mat.visible)} style={s.toggleBtn} title={mat.visible ? 'Ocultar' : 'Mostrar'}>
                    {mat.visible === false ? '🚫' : '👁️'}
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
  guiasBtn: { padding: '10px 20px', backgroundColor: '#b8956a', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif', whiteSpace: 'nowrap' },
  guiasBadge: { padding: '10px 16px', backgroundColor: '#eaf2eb', color: '#3d5c41', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'Jost, sans-serif', display: 'flex', alignItems: 'center' },
  // Error box
  errorBox: { backgroundColor: '#fff5f5', border: '2px solid #ffcccc', borderRadius: 12, padding: 20, marginBottom: 20, textAlign: 'center' },
  errorText: { margin: '0 0 12px', fontSize: 14, color: '#c44', fontFamily: 'Jost, sans-serif' },
  retryBtn: { padding: '8px 20px', backgroundColor: '#c44', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Jost, sans-serif' },
  // Empty state
  emptyState: { textAlign: 'center', padding: '40px 20px', backgroundColor: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: '#3d5c41', fontFamily: 'Playfair Display, serif' },
  emptyDesc: { margin: '8px 0 0', fontSize: 14, color: '#7a9e7e', fontFamily: 'Jost, sans-serif', lineHeight: 1.5 },
  // Form
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
  // List and cards
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
