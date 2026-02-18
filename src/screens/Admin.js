import React, { useState } from 'react';
import AdminMaterial from '../components/AdminMaterial';
import AdminVideos from '../components/AdminVideos';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a'
};

// Datos mock
const mockClientas = [
  {
    id: 1,
    nombre: 'María González',
    avatar: '👩',
    fechaInicio: '2026-01-15',
    semana: 6,
    semanasTotal: 12,
    pesoInicial: 78,
    pesoActual: 72.5,
    objetivo: -10,
    progreso: 55,
    estado: 'En progreso',
    restricciones: ['Sin gluten'],
    nivelActividad: 'Moderado',
    horarioComidas: '8:00, 13:00, 20:00',
    porQue: 'Quiero sentirme mejor conmigo misma',
    notasKarina: 'Muy comprometida con el proceso',
    notasClienta: ['Dudas sobre el plan de esta semana', 'Quiero ajustar los horarios']
  },
  {
    id: 2,
    nombre: 'Laura Martínez',
    avatar: '👱‍♀️',
    fechaInicio: '2026-01-08',
    semana: 7,
    semanasTotal: 12,
    pesoInicial: 85,
    pesoActual: 79.2,
    objetivo: -12,
    progreso: 48,
    estado: 'En progreso',
    restricciones: ['Vegetariana'],
    nivelActividad: 'Alto',
    horarioComidas: '7:30, 12:30, 19:30',
    porQue: 'Mejorar mi salud y energía',
    notasKarina: 'Excelente adherencia',
    notasClienta: []
  },
  {
    id: 3,
    nombre: 'Sofía Rodríguez',
    avatar: '👩‍🦰',
    fechaInicio: '2025-12-20',
    semana: 9,
    semanasTotal: 12,
    pesoInicial: 92,
    pesoActual: 84.5,
    objetivo: -15,
    progreso: 50,
    estado: 'Sin actividad 3d',
    restricciones: ['Sin lactosa'],
    nivelActividad: 'Bajo',
    horarioComidas: '9:00, 14:00, 21:00',
    porQue: 'Prepararme para mi boda',
    notasKarina: 'Necesita más seguimiento',
    notasClienta: []
  }
];

const mockSesionesHoy = [
  { hora: '10:00', nombre: 'Laura Martínez', semana: 7, notasListas: true },
  { hora: '14:00', nombre: 'María González', semana: 6, notasListas: true },
  { hora: '18:00', nombre: 'Sofía Rodríguez', semana: 9, notasListas: false }
];

function formatFecha(fechaStr) {
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

function Admin() {
  const [activeTab, setActiveTab] = useState('resumen');
  const [selectedClienta, setSelectedClienta] = useState(null);
  const [editingFicha, setEditingFicha] = useState(false);
  const [searchClientas, setSearchClientas] = useState('');

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

  const filteredClientas = mockClientas.filter(c =>
    c.nombre.toLowerCase().includes(searchClientas.toLowerCase())
  );

  const styles = {
    adminContainer: {
      display: 'flex',
      minHeight: '100vh',
      background: colors.cream,
      width: '100%',
      maxWidth: '100%'
    },
    sidebar: {
      width: '210px',
      background: colors.sageDark,
      color: 'white',
      padding: '1.5rem 1rem',
      position: 'fixed',
      height: '100vh',
      overflowY: 'auto',
      zIndex: 100
    },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1.1rem',
      fontWeight: 400,
      marginBottom: '2rem',
      textAlign: 'center',
      color: 'white'
    },
    avatarSection: {
      textAlign: 'center',
      marginBottom: '2rem',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid rgba(255,255,255,0.2)'
    },
    avatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      background: colors.sage,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      margin: '0 auto 0.75rem'
    },
    avatarName: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1rem',
      fontWeight: 600,
      marginBottom: '0.25rem'
    },
    avatarRole: {
      fontSize: '0.75rem',
      opacity: 0.8,
      fontFamily: "'Jost', sans-serif"
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '0.5rem',
      transition: 'all 0.2s',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem'
    },
    menuItemActive: {
      background: colors.sage,
      fontWeight: 600
    },
    contentArea: {
      marginLeft: '210px',
      flex: 1,
      padding: '2rem',
      minHeight: '100vh'
    },
    topbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    topbarTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.sageDark,
      margin: 0
    },
    topbarDate: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      color: colors.sageDark,
      opacity: 0.7,
      marginTop: '0.25rem'
    },
    buttonPrimary: {
      padding: '0.75rem 1.5rem',
      borderRadius: '14px',
      border: 'none',
      background: colors.sage,
      color: 'white',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    statCard: {
      background: 'white',
      borderRadius: '14px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    statValue: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '2rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.5rem'
    },
    statLabel: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      color: colors.sageDark,
      opacity: 0.7
    },
    statCardOrange: {
      background: 'white',
      borderRadius: '14px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      borderLeft: `4px solid ${colors.orange}`
    },
    statValueOrange: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '2rem',
      fontWeight: 600,
      color: colors.orange,
      marginBottom: '0.5rem'
    },
    section: {
      background: 'white',
      borderRadius: '14px',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.25rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '1rem'
    },
    pillsContainer: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    },
    pill: {
      padding: '0.75rem 1.25rem',
      borderRadius: '20px',
      background: colors.cream,
      border: `1px solid ${colors.sage}`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem'
    },
    pillGreen: {
      background: '#e8f5e9',
      borderColor: colors.sage,
      color: colors.sageDark
    },
    pillGold: {
      background: '#fff4e6',
      borderColor: colors.gold,
      color: colors.gold
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      textAlign: 'left',
      padding: '1rem',
      borderBottom: `2px solid ${colors.cream}`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      fontWeight: 600,
      color: colors.sageDark,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    tableRow: {
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderBottom: `1px solid ${colors.cream}`
    },
    tableCell: {
      padding: '1rem',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      color: colors.sageDark
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: colors.cream,
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '0.5rem'
    },
    progressFill: {
      height: '100%',
      background: colors.sage,
      borderRadius: '4px',
      transition: 'width 0.3s'
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 500,
      fontFamily: "'Jost', sans-serif"
    },
    badgeGreen: {
      background: '#e8f5e9',
      color: colors.sage
    },
    badgeOrange: {
      background: '#ffe8d6',
      color: colors.orange
    },
    badgeDefault: {
      background: colors.cream,
      color: colors.sageDark
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: `1px solid rgba(61, 92, 65, 0.3)`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      marginBottom: '1rem',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: `1px solid rgba(61, 92, 65, 0.3)`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      marginBottom: '1rem',
      boxSizing: 'border-box',
      minHeight: '100px',
      resize: 'vertical'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: `1px solid rgba(61, 92, 65, 0.3)`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      marginBottom: '1rem',
      boxSizing: 'border-box',
      background: 'white'
    },
    checkboxGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      cursor: 'pointer'
    },
    twoColumns: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem'
    },
    profileCard: {
      background: 'white',
      borderRadius: '14px',
      padding: '2rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      position: 'sticky',
      top: '2rem'
    },
    profileAvatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: colors.sage,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      margin: '0 auto 1rem'
    },
    profileName: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.sageDark,
      textAlign: 'center',
      marginBottom: '0.5rem'
    },
    profileField: {
      marginBottom: '1rem'
    },
    profileLabel: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      fontWeight: 600,
      color: colors.sageDark,
      opacity: 0.7,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.25rem'
    },
    profileValue: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: `1px solid rgba(61, 92, 65, 0.3)`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.9rem',
      marginBottom: '1.5rem',
      boxSizing: 'border-box'
    }
  };

  const renderResumen = () => (
    <>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.topbarTitle}>Buenos días, Karina 👋</h1>
          <div style={styles.topbarDate}>{getFechaHoy()}</div>
        </div>
        <button style={styles.buttonPrimary}>+ Nueva clienta</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>12</div>
          <div style={styles.statLabel}>Clientas activas</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>3</div>
          <div style={styles.statLabel}>Sesiones hoy</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>94%</div>
          <div style={styles.statLabel}>Adherencia promedio</div>
        </div>
        <div style={styles.statCardOrange}>
          <div style={styles.statValueOrange}>1</div>
          <div style={styles.statLabel}>Requieren atención</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sesiones de hoy</h2>
        <div style={styles.pillsContainer}>
          {mockSesionesHoy.map((sesion, i) => (
            <div
              key={i}
              style={{
                ...styles.pill,
                ...(sesion.notasListas ? styles.pillGreen : styles.pillGold)
              }}
            >
              <strong>{sesion.hora}</strong> · {sesion.nombre} · Semana {sesion.semana} ·{' '}
              {sesion.notasListas ? '✓ Listas' : 'Notas pendientes'}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Clientas</h2>
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
            {mockClientas.map((c) => {
              const perdido = c.pesoInicial - c.pesoActual;
              const isOrange = c.estado.includes('Sin actividad');
              const isGreen = c.estado.includes('Completando');
              return (
                <tr
                  key={c.id}
                  style={styles.tableRow}
                  onMouseEnter={(e) => (e.currentTarget.style.background = colors.cream)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    setActiveTab('clientas');
                    setSelectedClienta(c);
                  }}
                >
                  <td style={styles.tableCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{c.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          Semana {c.semana}/{c.semanasTotal}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.tableCell}>{formatFecha(c.fechaInicio)}</td>
                  <td style={styles.tableCell}>
                    <div>
                      {c.progreso}% · {perdido.toFixed(1)} kg
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${c.progreso}%` }} />
                    </div>
                  </td>
                  <td style={styles.tableCell}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(isOrange
                          ? styles.badgeOrange
                          : isGreen
                          ? styles.badgeGreen
                          : styles.badgeDefault)
                      }}
                    >
                      {c.estado}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Enviar notificación rápida</h2>
        <select style={styles.select}>
          <option>Todas las clientas</option>
          {mockClientas.map((c) => (
            <option key={c.id}>{c.nombre}</option>
          ))}
        </select>
        <input type="text" placeholder="Escribí el mensaje..." style={styles.input} />
        <button style={styles.buttonPrimary}>Enviar</button>
      </div>
    </>
  );

  const renderClientas = () => (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Clientas</h1>
      </div>

      <div style={styles.twoColumns}>
        <div>
          <input
            type="text"
            placeholder="Buscar clienta..."
            style={styles.searchInput}
            value={searchClientas}
            onChange={(e) => setSearchClientas(e.target.value)}
          />
          <div style={styles.section}>
            {filteredClientas.map((c) => (
              <div
                key={c.id}
                style={{
                  ...styles.tableRow,
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: selectedClienta?.id === c.id ? colors.cream : 'white'
                }}
                onClick={() => setSelectedClienta(c)}
                onMouseEnter={(e) => {
                  if (selectedClienta?.id !== c.id) {
                    e.currentTarget.style.background = colors.cream;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedClienta?.id !== c.id) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{c.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontFamily: "'Jost', sans-serif" }}>
                      {c.nombre}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      Semana {c.semana}/{c.semanasTotal}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedClienta && (
          <div style={styles.profileCard}>
            <div style={styles.profileAvatar}>{selectedClienta.avatar}</div>
            <div style={styles.profileName}>{selectedClienta.nombre}</div>
            <button
              style={{ ...styles.buttonPrimary, width: '100%', marginBottom: '1.5rem' }}
              onClick={() => setEditingFicha(!editingFicha)}
            >
              {editingFicha ? 'Guardar cambios' : 'Editar ficha'}
            </button>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Fecha de inicio</div>
              <div style={styles.profileValue}>{formatFecha(selectedClienta.fechaInicio)}</div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Objetivo</div>
              <div style={styles.profileValue}>
                {editingFicha ? (
                  <input
                    type="number"
                    defaultValue={selectedClienta.objetivo}
                    style={styles.input}
                  />
                ) : (
                  `${selectedClienta.objetivo} kg`
                )}
              </div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Peso inicial / Actual</div>
              <div style={styles.profileValue}>
                {editingFicha ? (
                  <>
                    <input
                      type="number"
                      defaultValue={selectedClienta.pesoInicial}
                      style={styles.input}
                      placeholder="Peso inicial"
                    />
                    <input
                      type="number"
                      defaultValue={selectedClienta.pesoActual}
                      style={styles.input}
                      placeholder="Peso actual"
                    />
                  </>
                ) : (
                  `${selectedClienta.pesoInicial} kg / ${selectedClienta.pesoActual} kg`
                )}
              </div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Progreso</div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${selectedClienta.progreso}%`
                  }}
                />
              </div>
              <div style={{ ...styles.profileValue, marginTop: '0.5rem' }}>
                {selectedClienta.progreso}% ·{' '}
                {(selectedClienta.pesoInicial - selectedClienta.pesoActual).toFixed(1)} kg
              </div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Restricciones alimentarias</div>
              <div style={styles.profileValue}>{selectedClienta.restricciones.join(', ')}</div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Nivel de actividad</div>
              <div style={styles.profileValue}>{selectedClienta.nivelActividad}</div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Horario de comidas</div>
              <div style={styles.profileValue}>{selectedClienta.horarioComidas}</div>
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Notas de Karina</div>
              {editingFicha ? (
                <textarea
                  defaultValue={selectedClienta.notasKarina}
                  style={styles.textarea}
                />
              ) : (
                <div style={styles.profileValue}>{selectedClienta.notasKarina}</div>
              )}
            </div>

            <div style={styles.profileField}>
              <div style={styles.profileLabel}>Notas de la clienta para próxima sesión</div>
              <div style={styles.profileValue}>
                {selectedClienta.notasClienta.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    {selectedClienta.notasClienta.map((n, i) => (
                      <li key={i} style={{ marginBottom: '0.5rem' }}>
                        {n}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Sin notas'
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderFichas = () => (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Fichas de clientas</h1>
      </div>
      <div style={styles.twoColumns}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Fichas existentes</h2>
          {mockClientas.map((c) => (
            <div
              key={c.id}
              style={{
                padding: '1rem',
                marginBottom: '0.5rem',
                background: colors.cream,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 600 }}>{c.nombre}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                Inicio: {formatFecha(c.fechaInicio)}
              </div>
            </div>
          ))}
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Nueva ficha</h2>
          <input type="text" placeholder="Nombre completo" style={styles.input} />
          <input type="email" placeholder="Email" style={styles.input} />
          <input type="date" placeholder="Fecha de inicio" style={styles.input} />
          <input type="number" placeholder="Objetivo de peso (kg a bajar)" style={styles.input} />
          <input type="number" placeholder="Peso inicial" style={styles.input} />
          <div style={styles.profileLabel}>Restricciones alimentarias</div>
          <div style={styles.checkboxGroup}>
            {['Gluten', 'Lactosa', 'Vegetariana', 'Vegana', 'Otras'].map((r) => (
              <label key={r} style={styles.checkboxLabel}>
                <input type="checkbox" />
                {r}
              </label>
            ))}
          </div>
          <select style={styles.select}>
            <option>Nivel de actividad</option>
            <option>Bajo</option>
            <option>Moderado</option>
            <option>Alto</option>
          </select>
          <input type="text" placeholder="Horario de comidas preferido" style={styles.input} />
          <textarea placeholder="Tu por qué" style={styles.textarea} />
          <textarea placeholder="Notas iniciales" style={styles.textarea} />
          <button style={styles.buttonPrimary}>Crear ficha</button>
        </div>
      </div>
    </>
  );

  const renderMaterial = () => <AdminMaterial />;

  const renderVideos = () => <AdminVideos />;

  const renderNotificaciones = () => (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Notificaciones</h1>
      </div>
      <div style={styles.twoColumns}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Nueva notificación</h2>
          <select style={styles.select}>
            <option>Todas las clientas</option>
            {mockClientas.map((c) => (
              <option key={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select style={styles.select}>
            <option>Push</option>
            <option>Mensaje en app</option>
          </select>
          <input type="datetime-local" style={styles.input} />
          <textarea placeholder="Mensaje..." style={styles.textarea} />
          <button style={styles.buttonPrimary}>Enviar</button>
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
                  style={{
                    ...styles.buttonPrimary,
                    background: 'transparent',
                    color: colors.sageDark,
                    border: `1px solid ${colors.sage}`,
                    textAlign: 'left'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Historial</h2>
          {[
            { fecha: '18 Feb 2026 10:00', destinatario: 'Todas', mensaje: 'Hoy toca pesar 🌿', estado: 'Enviada' },
            { fecha: '17 Feb 2026 08:00', destinatario: 'María González', mensaje: 'Recordatorio de agua 💧', estado: 'Enviada' }
          ].map((n, i) => (
            <div
              key={i}
              style={{
                padding: '1rem',
                marginBottom: '0.75rem',
                background: colors.cream,
                borderRadius: '8px'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{n.fecha}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>
                Para: {n.destinatario}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>{n.mensaje}</div>
              <span style={{ ...styles.badge, ...styles.badgeGreen }}>{n.estado}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderAgenda = () => {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hoy = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return (
      <>
        <div style={styles.topbar}>
          <h1 style={styles.topbarTitle}>Agenda</h1>
          <button style={styles.buttonPrimary}>＋ Agendar sesión</button>
        </div>
        <div style={styles.section}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            {diasSemana.map((dia, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem',
                  background: i === hoy ? colors.sage : colors.cream,
                  color: i === hoy ? 'white' : colors.sageDark,
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 600
                }}
              >
                {dia}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1rem'
            }}
          >
            {diasSemana.map((dia, i) => (
              <div
                key={i}
                style={{
                  minHeight: '200px',
                  padding: '0.75rem',
                  background: 'white',
                  border: `1px solid ${colors.cream}`,
                  borderRadius: '8px'
                }}
              >
                {i === 2 && (
                  <div
                    style={{
                      background: colors.sage,
                      color: 'white',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    <strong>18:00</strong><br />
                    María González<br />
                    Seguimiento
                  </div>
                )}
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
        <h2 style={styles.sectionTitle}>Perfil de Ana Karina</h2>
        <input type="text" placeholder="Nombre" defaultValue="Ana Karina" style={styles.input} />
        <input type="text" placeholder="Especialidad" defaultValue="Nutricionista · Coach" style={styles.input} />
        <textarea placeholder="Bio corta" style={styles.textarea} />
        <input type="url" placeholder="URL de foto" style={styles.input} />
        <input type="text" placeholder="Redes sociales" style={styles.input} />
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Configuración de la app</h2>
        <input type="text" placeholder="Nombre de la app" defaultValue="Anabienestar Integral" style={styles.input} />
        <textarea placeholder="Frase de bienvenida por defecto" style={styles.textarea} />
        <select style={styles.select}>
          <option>Color principal</option>
          <option>Verde (#7a9e7e)</option>
          <option>Azul</option>
          <option>Morado</option>
        </select>
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Frases del día</h2>
        {[
          'Cada día es una oportunidad para cuidar tu cuerpo y tu mente con amor y paciencia.',
          'El progreso no es lineal, pero cada paso cuenta.',
          'Escuchá a tu cuerpo, él sabe lo que necesita.'
        ].map((f, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              marginBottom: '0.5rem',
              background: colors.cream,
              borderRadius: '8px'
            }}
          >
            <div style={{ fontStyle: 'italic' }}>{f}</div>
            <button style={{ ...styles.buttonPrimary, padding: '0.5rem 1rem' }}>Eliminar</button>
          </div>
        ))}
        <button style={styles.buttonPrimary}>Agregar frase</button>
      </div>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Checklist por defecto</h2>
        {['Actividad física', 'Agua', 'Respiración', 'Desayuno', 'Momento para mí'].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: colors.cream,
              borderRadius: '8px'
            }}
          >
            <input type="text" defaultValue={item} style={{ ...styles.input, margin: 0, flex: 1 }} />
            <button style={{ ...styles.buttonPrimary, padding: '0.5rem 1rem', background: colors.orange }}>
              Eliminar
            </button>
          </div>
        ))}
        <button style={styles.buttonPrimary}>Agregar ítem</button>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return renderResumen();
      case 'clientas':
        return renderClientas();
      case 'fichas':
        return renderFichas();
      case 'material':
        return renderMaterial();
      case 'videos':
        return renderVideos();
      case 'notificaciones':
        return renderNotificaciones();
      case 'agenda':
        return renderAgenda();
      case 'configuracion':
        return renderConfiguracion();
      default:
        return renderResumen();
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
              style={{
                ...styles.menuItem,
                ...(activeTab === item.id ? styles.menuItemActive : {})
              }}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'clientas') setSelectedClienta(null);
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
      <div style={styles.contentArea}>{renderContent()}</div>
    </div>
  );
}

export default Admin;
