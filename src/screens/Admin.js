import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import AdminMaterial from '../components/AdminMaterial';
import AdminVideos from '../components/AdminVideos';
import AdminClientas from '../components/AdminClientas';
import AdminFichas from '../components/AdminFichas';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a'
};

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const d = new Date(fechaStr);
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function getFechaHoy() {
  const d = new Date();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function semanasDesdeInicio(fechaInicio) {
  if (!fechaInicio) return 1;
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  return Math.max(1, Math.floor((hoy - inicio) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function Admin() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('resumen');

  // ── Resumen state ──
  const [clientas, setClientas] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(true);

  // ── Notificaciones state ──
  const [notifClientas, setNotifClientas] = useState([]);
  const [notifDestinatario, setNotifDestinatario] = useState('todas');
  const [notifTipo, setNotifTipo] = useState('Mensaje en app');
  const [notifMensaje, setNotifMensaje] = useState('');
  const [notifHistorial, setNotifHistorial] = useState([]);
  const [enviandoNotif, setEnviandoNotif] = useState(false);

  // ── Agenda state ──
  const [citasSemana, setCitasSemana] = useState([]);
  const [agendaClientas, setAgendaClientas] = useState([]);
  const [showAgendaForm, setShowAgendaForm] = useState(false);
  const [agendaForm, setAgendaForm] = useState({ usuario_id: '', fecha: '', hora: '', tipo: 'Seguimiento', modalidad: 'Videollamada', notas: '' });
  const [guardandoCita, setGuardandoCita] = useState(false);

  // ── Configuracion state ──
  const [frases, setFrases] = useState([]);
  const [nuevaFrase, setNuevaFrase] = useState('');
  const [loadingFrases, setLoadingFrases] = useState(true);

  const menuItems = [
    { id: 'resumen', label: 'Resumen', icon: '📊' },
    { id: 'clientas', label: 'Clientas', icon: '👥' },
    { id: 'fichas', label: 'Fichas', icon: '📋' },
    { id: 'material', label: 'Material', icon: '📚' },
    { id: 'videos', label: 'Videos', icon: '🎥' },
    { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
    { id: 'agenda', label: 'Agenda', icon: '📅' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' }
  ];

  // ══════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════

  const loadResumen = useCallback(async () => {
    setLoadingResumen(true);
    try {
      // Fetch clientas with fichas
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre, email, avatar')
        .eq('rol', 'clienta')
        .order('nombre');

      const list = usuarios || [];
      const conFichas = await Promise.all(
        list.map(async (u) => {
          const { data: ficha } = await supabase
            .from('fichas')
            .select('*')
            .eq('usuario_id', u.id)
            .maybeSingle();
          return { ...u, ficha: ficha || null };
        })
      );
      setClientas(conFichas);

      // Fetch citas de hoy
      const hoy = getTodayKey();
      const startOfDay = hoy + 'T00:00:00';
      const endOfDay = hoy + 'T23:59:59';
      const { data: citas } = await supabase
        .from('citas')
        .select('*, usuarios(nombre)')
        .gte('fecha', startOfDay)
        .lte('fecha', endOfDay)
        .order('fecha', { ascending: true });
      setCitasHoy(citas || []);
    } catch (err) {
      console.error('Error cargando resumen:', err);
    } finally {
      setLoadingResumen(false);
    }
  }, []);

  const loadNotificaciones = useCallback(async () => {
    try {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .eq('rol', 'clienta')
        .order('nombre');
      setNotifClientas(usuarios || []);

      const { data: historial } = await supabase
        .from('notificaciones')
        .select('*, usuarios:destinatario_id(nombre)')
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifHistorial(historial || []);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  }, []);

  const loadAgenda = useCallback(async () => {
    try {
      const { monday, sunday } = getWeekRange();
      const { data: citas } = await supabase
        .from('citas')
        .select('*, usuarios(nombre)')
        .gte('fecha', monday.toISOString())
        .lte('fecha', sunday.toISOString())
        .order('fecha', { ascending: true });
      setCitasSemana(citas || []);

      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .eq('rol', 'clienta')
        .order('nombre');
      setAgendaClientas(usuarios || []);
    } catch (err) {
      console.error('Error cargando agenda:', err);
    }
  }, []);

  const loadFrases = useCallback(async () => {
    setLoadingFrases(true);
    try {
      const { data } = await supabase
        .from('frases')
        .select('*')
        .order('created_at', { ascending: false });
      setFrases(data || []);
    } catch (err) {
      console.error('Error cargando frases:', err);
    } finally {
      setLoadingFrases(false);
    }
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'resumen') loadResumen();
    if (activeTab === 'notificaciones') loadNotificaciones();
    if (activeTab === 'agenda') loadAgenda();
    if (activeTab === 'configuracion') loadFrases();
  }, [activeTab, loadResumen, loadNotificaciones, loadAgenda, loadFrases]);

  // ══════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════

  const handleEnviarNotificacion = async () => {
    if (!notifMensaje.trim()) return;
    setEnviandoNotif(true);
    try {
      const datos = {
        mensaje: notifMensaje.trim(),
        tipo: notifTipo,
        para_todas: notifDestinatario === 'todas',
        destinatario_id: notifDestinatario === 'todas' ? null : notifDestinatario,
        enviada: true,
      };
      const { error } = await supabase.from('notificaciones').insert(datos).select();
      if (error) {
        alert('Error: ' + error.message);
        return;
      }
      setNotifMensaje('');
      setNotifDestinatario('todas');
      loadNotificaciones();
    } catch (err) {
      alert('Error al enviar: ' + (err.message || err));
    } finally {
      setEnviandoNotif(false);
    }
  };

  const handleCrearCita = async () => {
    if (!agendaForm.usuario_id || !agendaForm.fecha || !agendaForm.hora) return;
    setGuardandoCita(true);
    try {
      const fechaHora = `${agendaForm.fecha}T${agendaForm.hora}:00`;
      const { error } = await supabase.from('citas').insert({
        usuario_id: agendaForm.usuario_id,
        fecha: fechaHora,
        tipo: agendaForm.tipo,
        modalidad: agendaForm.modalidad,
        notas: agendaForm.notas || null,
      }).select();
      if (error) {
        alert('Error: ' + error.message);
        return;
      }
      setAgendaForm({ usuario_id: '', fecha: '', hora: '', tipo: 'Seguimiento', modalidad: 'Videollamada', notas: '' });
      setShowAgendaForm(false);
      loadAgenda();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    } finally {
      setGuardandoCita(false);
    }
  };

  const handleAgregarFrase = async () => {
    if (!nuevaFrase.trim()) return;
    try {
      const { error } = await supabase.from('frases').insert({ texto: nuevaFrase.trim(), activa: true }).select();
      if (error) {
        alert('Error: ' + error.message);
        return;
      }
      setNuevaFrase('');
      loadFrases();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  const handleEliminarFrase = async (id) => {
    if (!window.confirm('¿Eliminar esta frase?')) return;
    try {
      await supabase.from('frases').delete().eq('id', id);
      loadFrases();
    } catch (err) {
      console.error('Error eliminando frase:', err);
    }
  };

  const handleToggleFrase = async (id, activaActual) => {
    try {
      await supabase.from('frases').update({ activa: !activaActual }).eq('id', id);
      setFrases(prev => prev.map(f => f.id === id ? { ...f, activa: !activaActual } : f));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // ══════════════════════════════════════════════
  // COMPUTED VALUES
  // ══════════════════════════════════════════════

  const clientasConFicha = clientas.filter(c => c.ficha);
  const totalClientas = clientas.length;
  const sesionesHoy = citasHoy.length;

  // Calcular adherencia: % promedio de checklist completado hoy
  const calcularAdherencia = () => {
    if (clientasConFicha.length === 0) return 0;
    // Simple: just show number of clientas with fichas as a proxy
    return clientasConFicha.length > 0 ? Math.round((clientasConFicha.length / Math.max(totalClientas, 1)) * 100) : 0;
  };

  // ══════════════════════════════════════════════
  // STYLES
  // ══════════════════════════════════════════════

  const styles = {
    adminContainer: { display: 'flex', minHeight: '100vh', background: colors.cream, width: '100%', maxWidth: '100%' },
    sidebar: { width: '210px', background: colors.sageDark, color: 'white', padding: '1.5rem 1rem', position: 'fixed', height: '100vh', overflowY: 'auto', zIndex: 100, display: 'flex', flexDirection: 'column' },
    logo: { fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 400, marginBottom: '2rem', textAlign: 'center', color: 'white' },
    avatarSection: { textAlign: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)' },
    avatar: { width: '60px', height: '60px', borderRadius: '50%', background: colors.sage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 0.75rem' },
    avatarName: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' },
    avatarRole: { fontSize: '0.75rem', opacity: 0.8, fontFamily: "'Jost', sans-serif" },
    menuItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.5rem', transition: 'all 0.2s', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' },
    menuItemActive: { background: colors.sage, fontWeight: 600 },
    logoutButton: { marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)' },
    logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.9)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', cursor: 'pointer' },
    contentArea: { marginLeft: '210px', flex: 1, padding: '2rem', minHeight: '100vh' },
    topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
    topbarTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 600, color: colors.sageDark, margin: 0 },
    topbarDate: { fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: colors.sageDark, opacity: 0.7, marginTop: '0.25rem' },
    buttonPrimary: { padding: '0.75rem 1.5rem', borderRadius: '14px', border: 'none', background: colors.sage, color: 'white', fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' },
    statCard: { background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    statValue: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', fontWeight: 600, color: colors.sageDark, marginBottom: '0.5rem' },
    statLabel: { fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: colors.sageDark, opacity: 0.7 },
    statCardOrange: { background: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${colors.orange}` },
    statValueOrange: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '2rem', fontWeight: 600, color: colors.orange, marginBottom: '0.5rem' },
    section: { background: 'white', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    sectionTitle: { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.25rem', fontWeight: 600, color: colors.sageDark, marginBottom: '1rem' },
    pillsContainer: { display: 'flex', gap: '1rem', flexWrap: 'wrap' },
    pill: { padding: '0.75rem 1.25rem', borderRadius: '20px', background: colors.cream, border: `1px solid ${colors.sage}`, fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' },
    pillGreen: { background: '#e8f5e9', borderColor: colors.sage, color: colors.sageDark },
    pillGold: { background: '#fff4e6', borderColor: colors.gold, color: colors.gold },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: { textAlign: 'left', padding: '1rem', borderBottom: `2px solid ${colors.cream}`, fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 600, color: colors.sageDark, textTransform: 'uppercase', letterSpacing: '0.05em' },
    tableRow: { cursor: 'pointer', transition: 'all 0.2s', borderBottom: `1px solid ${colors.cream}` },
    tableCell: { padding: '1rem', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: colors.sageDark },
    progressBar: { width: '100%', height: '8px', background: colors.cream, borderRadius: '4px', overflow: 'hidden', marginTop: '0.5rem' },
    progressFill: { height: '100%', background: colors.sage, borderRadius: '4px', transition: 'width 0.3s' },
    badge: { display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 500, fontFamily: "'Jost', sans-serif" },
    badgeGreen: { background: '#e8f5e9', color: colors.sage },
    badgeOrange: { background: '#ffe8d6', color: colors.orange },
    badgeDefault: { background: colors.cream, color: colors.sageDark },
    input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(61, 92, 65, 0.3)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(61, 92, 65, 0.3)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' },
    select: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(61, 92, 65, 0.3)', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '1rem', boxSizing: 'border-box', background: 'white' },
    twoColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
    profileLabel: { fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: colors.sageDark, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  };

  // ══════════════════════════════════════════════
  // RENDER FUNCTIONS
  // ══════════════════════════════════════════════

  const renderResumen = () => {
    const sinActividad = clientasConFicha.filter(c => {
      // Clientas without recent checklist activity could be flagged
      // Simple heuristic: no ficha = needs attention
      return !c.ficha;
    }).length;

    return (
      <>
        <div style={styles.topbar}>
          <div>
            <h1 style={styles.topbarTitle}>Buenos días, Karina 👋</h1>
            <div style={styles.topbarDate}>{getFechaHoy()}</div>
          </div>
          <button style={styles.buttonPrimary} onClick={() => setActiveTab('fichas')}>+ Nueva clienta</button>
        </div>

        {loadingResumen ? (
          <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>Cargando...</p>
        ) : (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{totalClientas}</div>
                <div style={styles.statLabel}>Clientas activas</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{sesionesHoy}</div>
                <div style={styles.statLabel}>Sesiones hoy</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{calcularAdherencia()}%</div>
                <div style={styles.statLabel}>Con ficha activa</div>
              </div>
              <div style={sinActividad > 0 ? styles.statCardOrange : styles.statCard}>
                <div style={sinActividad > 0 ? styles.statValueOrange : styles.statValue}>{sinActividad}</div>
                <div style={styles.statLabel}>Sin ficha</div>
              </div>
            </div>

            {citasHoy.length > 0 && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Sesiones de hoy</h2>
                <div style={styles.pillsContainer}>
                  {citasHoy.map((cita) => {
                    const hora = new Date(cita.fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
                    const nombre = Array.isArray(cita.usuarios) ? cita.usuarios[0]?.nombre : cita.usuarios?.nombre;
                    return (
                      <div key={cita.id} style={{ ...styles.pill, ...styles.pillGreen }}>
                        <strong>{hora}</strong> · {nombre || 'Clienta'} · {cita.tipo || 'Sesión'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Clientas</h2>
              {clientas.length === 0 ? (
                <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark, opacity: 0.7 }}>
                  No hay clientas todavía.
                </p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Clienta</th>
                      <th style={styles.tableHeader}>Inicio</th>
                      <th style={styles.tableHeader}>Progreso</th>
                      <th style={styles.tableHeader}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientas.map((c) => {
                      const ficha = c.ficha;
                      const semana = ficha ? semanasDesdeInicio(ficha.fecha_inicio) : 0;
                      const perdido = ficha ? (ficha.peso_inicial || 0) - (ficha.peso_actual || ficha.peso_inicial || 0) : 0;
                      const progreso = ficha && ficha.objetivo_kg ? Math.min(100, Math.round((perdido / Math.abs(ficha.objetivo_kg)) * 100)) : 0;
                      const estado = ficha ? 'En progreso' : 'Sin ficha';
                      const isOrange = !ficha;
                      return (
                        <tr
                          key={c.id}
                          style={styles.tableRow}
                          onMouseEnter={(e) => (e.currentTarget.style.background = colors.cream)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => setActiveTab('clientas')}
                        >
                          <td style={styles.tableCell}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>{c.avatar || '👩'}</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>{c.nombre || c.email || 'Sin nombre'}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                  {ficha ? `Semana ${semana}/12` : 'Sin ficha'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={styles.tableCell}>{ficha ? formatFecha(ficha.fecha_inicio) : '—'}</td>
                          <td style={styles.tableCell}>
                            {ficha ? (
                              <>
                                <div>{progreso}% · {perdido.toFixed(1)} kg</div>
                                <div style={styles.progressBar}>
                                  <div style={{ ...styles.progressFill, width: `${progreso}%` }} />
                                </div>
                              </>
                            ) : '—'}
                          </td>
                          <td style={styles.tableCell}>
                            <span style={{ ...styles.badge, ...(isOrange ? styles.badgeOrange : styles.badgeDefault) }}>
                              {estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </>
    );
  };

  const renderNotificaciones = () => (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Notificaciones</h1>
      </div>
      <div style={styles.twoColumns}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Nueva notificación</h2>
          <select
            style={styles.select}
            value={notifDestinatario}
            onChange={(e) => setNotifDestinatario(e.target.value)}
          >
            <option value="todas">Todas las clientas</option>
            {notifClientas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre || c.email}</option>
            ))}
          </select>
          <select style={styles.select} value={notifTipo} onChange={(e) => setNotifTipo(e.target.value)}>
            <option>Mensaje en app</option>
            <option>Recordatorio</option>
          </select>
          <textarea
            placeholder="Mensaje..."
            style={styles.textarea}
            value={notifMensaje}
            onChange={(e) => setNotifMensaje(e.target.value)}
          />
          <button
            style={{ ...styles.buttonPrimary, opacity: enviandoNotif || !notifMensaje.trim() ? 0.5 : 1 }}
            onClick={handleEnviarNotificacion}
            disabled={enviandoNotif || !notifMensaje.trim()}
          >
            {enviandoNotif ? 'Enviando...' : 'Enviar'}
          </button>
          <div style={{ marginTop: '1.5rem' }}>
            <div style={styles.profileLabel}>Plantillas rápidas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'Hoy toca pesar 🌿',
                '¡Arrancá el día con energía! ☀️',
                'Recordatorio de agua 💧'
              ].map((t, i) => (
                <button
                  key={i}
                  style={{ ...styles.buttonPrimary, background: 'transparent', color: colors.sageDark, border: `1px solid ${colors.sage}`, textAlign: 'left' }}
                  onClick={() => setNotifMensaje(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Historial</h2>
          {notifHistorial.length === 0 ? (
            <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark, opacity: 0.7 }}>No hay notificaciones todavía.</p>
          ) : (
            notifHistorial.map((n) => {
              const nombre = n.para_todas ? 'Todas' : (Array.isArray(n.usuarios) ? n.usuarios[0]?.nombre : n.usuarios?.nombre) || 'Clienta';
              return (
                <div key={n.id} style={{ padding: '1rem', marginBottom: '0.75rem', background: colors.cream, borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}>
                    {new Date(n.created_at).toLocaleString('es-UY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem', fontFamily: "'Jost', sans-serif" }}>
                    Para: {nombre}
                  </div>
                  <div style={{ marginBottom: '0.5rem', fontFamily: "'Jost', sans-serif" }}>{n.mensaje}</div>
                  <span style={{ ...styles.badge, ...styles.badgeGreen }}>{n.enviada ? 'Enviada' : 'Pendiente'}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  const renderAgenda = () => {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hoyIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    // Group citas by day of week
    const { monday } = getWeekRange();
    const citasPorDia = Array.from({ length: 7 }, () => []);
    citasSemana.forEach(cita => {
      const citaDate = new Date(cita.fecha);
      const dayDiff = Math.floor((citaDate - monday) / (24 * 60 * 60 * 1000));
      if (dayDiff >= 0 && dayDiff < 7) {
        citasPorDia[dayDiff].push(cita);
      }
    });

    return (
      <>
        <div style={styles.topbar}>
          <h1 style={styles.topbarTitle}>Agenda</h1>
          <button style={styles.buttonPrimary} onClick={() => setShowAgendaForm(!showAgendaForm)}>
            {showAgendaForm ? 'Cancelar' : '＋ Agendar sesión'}
          </button>
        </div>

        {showAgendaForm && (
          <div style={{ ...styles.section, marginBottom: '2rem' }}>
            <h2 style={styles.sectionTitle}>Nueva cita</h2>
            <select style={styles.select} value={agendaForm.usuario_id} onChange={(e) => setAgendaForm({ ...agendaForm, usuario_id: e.target.value })}>
              <option value="">Seleccionar clienta...</option>
              {agendaClientas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre || c.email}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="date" style={{ ...styles.input, flex: 1 }} value={agendaForm.fecha} onChange={(e) => setAgendaForm({ ...agendaForm, fecha: e.target.value })} />
              <input type="time" style={{ ...styles.input, flex: 1 }} value={agendaForm.hora} onChange={(e) => setAgendaForm({ ...agendaForm, hora: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <select style={{ ...styles.select, flex: 1 }} value={agendaForm.tipo} onChange={(e) => setAgendaForm({ ...agendaForm, tipo: e.target.value })}>
                <option>Seguimiento</option>
                <option>Check-in de peso</option>
                <option>Sesión inicial</option>
                <option>Cierre de programa</option>
              </select>
              <select style={{ ...styles.select, flex: 1 }} value={agendaForm.modalidad} onChange={(e) => setAgendaForm({ ...agendaForm, modalidad: e.target.value })}>
                <option>Videollamada</option>
                <option>Presencial</option>
                <option>Telefónica</option>
              </select>
            </div>
            <input type="text" placeholder="Notas (opcional)" style={styles.input} value={agendaForm.notas} onChange={(e) => setAgendaForm({ ...agendaForm, notas: e.target.value })} />
            <button
              style={{ ...styles.buttonPrimary, opacity: guardandoCita || !agendaForm.usuario_id || !agendaForm.fecha || !agendaForm.hora ? 0.5 : 1 }}
              onClick={handleCrearCita}
              disabled={guardandoCita || !agendaForm.usuario_id || !agendaForm.fecha || !agendaForm.hora}
            >
              {guardandoCita ? 'Guardando...' : 'Agendar'}
            </button>
          </div>
        )}

        <div style={styles.section}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {diasSemana.map((dia, i) => (
              <div key={i} style={{ padding: '1rem', background: i === hoyIdx ? colors.sage : colors.cream, color: i === hoyIdx ? 'white' : colors.sageDark, borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontFamily: "'Jost', sans-serif" }}>
                {dia}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1rem' }}>
            {diasSemana.map((_, i) => (
              <div key={i} style={{ minHeight: '200px', padding: '0.75rem', background: 'white', border: `1px solid ${colors.cream}`, borderRadius: '8px' }}>
                {citasPorDia[i].map(cita => {
                  const hora = new Date(cita.fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
                  const nombre = Array.isArray(cita.usuarios) ? cita.usuarios[0]?.nombre : cita.usuarios?.nombre;
                  return (
                    <div key={cita.id} style={{ background: colors.sage, color: 'white', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.5rem', fontSize: '0.85rem', fontFamily: "'Jost', sans-serif" }}>
                      <strong>{hora}</strong><br />
                      {nombre || 'Clienta'}<br />
                      {cita.tipo || 'Sesión'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderConfiguracion = () => (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Configuración</h1>
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Frases del día</h2>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: colors.sageDark, opacity: 0.7, marginBottom: '1rem' }}>
          Las clientas ven una frase activa aleatoria cada día en su pantalla de inicio.
        </p>
        {loadingFrases ? (
          <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>Cargando...</p>
        ) : (
          <>
            {frases.map((f) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', marginBottom: '0.5rem', background: f.activa ? colors.cream : '#f0f0f0', borderRadius: '8px', opacity: f.activa ? 1 : 0.6 }}>
                <div style={{ fontStyle: 'italic', flex: 1, marginRight: '1rem', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}>
                  {f.texto}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    style={{ ...styles.buttonPrimary, padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: f.activa ? colors.sage : '#999' }}
                    onClick={() => handleToggleFrase(f.id, f.activa)}
                  >
                    {f.activa ? 'Activa' : 'Inactiva'}
                  </button>
                  <button
                    style={{ ...styles.buttonPrimary, padding: '0.5rem 0.75rem', fontSize: '0.8rem', background: colors.orange }}
                    onClick={() => handleEliminarFrase(f.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <input
                type="text"
                placeholder="Nueva frase motivacional..."
                style={{ ...styles.input, flex: 1, margin: 0 }}
                value={nuevaFrase}
                onChange={(e) => setNuevaFrase(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAgregarFrase(); }}
              />
              <button style={{ ...styles.buttonPrimary, whiteSpace: 'nowrap' }} onClick={handleAgregarFrase}>
                Agregar
              </button>
            </div>
          </>
        )}
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Checklist por defecto</h2>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: colors.sageDark, opacity: 0.7, marginBottom: '1rem' }}>
          Estos son los 5 ítems que las clientas ven cada día.
        </p>
        {['🏃‍♀️ 30 min de actividad física', '💧 2 litros de agua', '🧘‍♀️ 5 min de respiración', '🥣 Desayuno saludable', '💚 Un momento para mí'].map((item, i) => (
          <div key={i} style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem', background: colors.cream, borderRadius: '8px', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem' }}>
            {item}
          </div>
        ))}
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen': return renderResumen();
      case 'clientas': return <AdminClientas />;
      case 'fichas': return <AdminFichas />;
      case 'material': return <AdminMaterial />;
      case 'videos': return <AdminVideos />;
      case 'notificaciones': return renderNotificaciones();
      case 'agenda': return renderAgenda();
      case 'configuracion': return renderConfiguracion();
      default: return renderResumen();
    }
  };

  return (
    <div style={styles.adminContainer}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>AnabienestarIntegral</div>
        <div style={styles.avatarSection}>
          <div style={styles.avatar}>👩‍⚕️</div>
          <div style={styles.avatarName}>Ana Karina</div>
          <div style={styles.avatarRole}>Nutricionista · Coach</div>
        </div>
        <nav>
          {menuItems.map((item) => (
            <div
              key={item.id}
              style={{ ...styles.menuItem, ...(activeTab === item.id ? styles.menuItemActive : {}) }}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div style={{ ...styles.logoutButton, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <button type="button" style={styles.logoutBtn} onClick={() => logout()}>
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
      <div style={styles.contentArea}>{renderContent()}</div>
    </div>
  );
}

export default Admin;
