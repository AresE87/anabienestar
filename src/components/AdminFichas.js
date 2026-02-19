import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a'
};

const RESTRICCIONES_OPCIONES = ['Sin gluten', 'Sin lactosa', 'Vegetariana', 'Vegana', 'Otras'];
const NIVEL_ACTIVIDAD_OPCIONES = ['Bajo', 'Moderado', 'Alto'];

const styles = {
  topbar: { marginBottom: '2rem' },
  topbarTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.75rem',
    fontWeight: 600,
    color: colors.sageDark,
    margin: 0
  },
  twoColumns: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem'
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
  buttonPrimary: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    background: colors.sageDark,
    color: 'white',
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer'
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
  mensajeAuth: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#fff8e1',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontFamily: "'Jost', sans-serif",
    color: colors.sageDark
  }
};

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const d = new Date(fechaStr);
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

export default function AdminFichas() {
  const [fichas, setFichas] = useState([]);
  const [clientasSinFicha, setClientasSinFicha] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(null);

  // Form: 'existente' | 'nueva'
  const [modoClienta, setModoClienta] = useState('existente');
  const [usuarioIdSeleccionado, setUsuarioIdSeleccionado] = useState('');
  const [nombreNueva, setNombreNueva] = useState('');
  const [emailNueva, setEmailNueva] = useState('');
  const [pesoInicial, setPesoInicial] = useState('');
  const [objetivoKg, setObjetivoKg] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [restricciones, setRestricciones] = useState([]);
  const [nivelActividad, setNivelActividad] = useState('');
  const [horarioComidas, setHorarioComidas] = useState('');
  const [porQue, setPorQue] = useState('');
  const [notasKarina, setNotasKarina] = useState('');
  const [emailCreado, setEmailCreado] = useState(null);

  const loadFichas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('fichas')
        .select(`
          *,
          usuarios (nombre, email)
        `)
        .order('created_at', { ascending: false });

      if (err) {
        setError(err.message || 'Error al cargar fichas');
        setFichas([]);
      } else {
        setFichas(data || []);
      }
    } catch (e) {
      setError(e.message || 'Error inesperado');
      setFichas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClientasSinFicha = useCallback(async () => {
    try {
      const { data: usuarios } = await supabase
        .from('usuarios')
        .select('id, nombre, email')
        .eq('rol', 'clienta');
      const { data: fichasData } = await supabase.from('fichas').select('usuario_id');
      const idsConFicha = new Set((fichasData || []).map((f) => f.usuario_id));
      const sinFicha = (usuarios || []).filter((u) => !idsConFicha.has(u.id));
      setClientasSinFicha(sinFicha);
    } catch (e) {
      setClientasSinFicha([]);
    }
  }, []);

  useEffect(() => {
    loadFichas();
    loadClientasSinFicha();
  }, [loadFichas, loadClientasSinFicha]);

  const toggleRestriccion = (r) => {
    setRestricciones((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const handleCrearFicha = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);
    setEmailCreado(null);

    let usuarioId = usuarioIdSeleccionado;

    if (modoClienta === 'nueva') {
      const nombre = nombreNueva.trim();
      const email = emailNueva.trim();
      if (!nombre || !email) {
        setError('Completá nombre y email de la nueva clienta.');
        return;
      }
      setGuardando(true);
      try {
        const { data: nuevoUsuario, error: errUsuario } = await supabase
          .from('usuarios')
          .insert({
            nombre,
            email,
            rol: 'clienta'
          })
          .select('id')
          .single();

        if (errUsuario) {
          const msg = errUsuario.message || 'Error al crear la clienta';
          setError(msg + (errUsuario.details ? ' — ' + errUsuario.details : ''));
          setGuardando(false);
          return;
        }
        if (!nuevoUsuario || !nuevoUsuario.id) {
          setError('No se pudo obtener el ID de la nueva clienta. Verificá que la tabla usuarios tenga DEFAULT gen_random_uuid() en la columna id.');
          setGuardando(false);
          return;
        }
        usuarioId = nuevoUsuario.id;
        setEmailCreado(email);
      } catch (e) {
        setError(e.message || 'Error al crear la clienta');
        setGuardando(false);
        return;
      }
    } else {
      if (!usuarioId) {
        setError('Seleccioná una clienta o creá una nueva.');
        setGuardando(false);
        return;
      }
      setGuardando(true);
    }

    const pesoInicialNum = pesoInicial === '' ? null : Number(pesoInicial);
    const objetivoKgNum = objetivoKg === '' ? null : Number(objetivoKg);

    try {
      const { error: errFicha } = await supabase.from('fichas').insert({
        usuario_id: usuarioId,
        peso_inicial: pesoInicialNum,
        peso_actual: pesoInicialNum,
        objetivo_kg: objetivoKgNum,
        fecha_inicio: fechaInicio || null,
        restricciones: restricciones.length ? restricciones : [],
        nivel_actividad: nivelActividad || null,
        horario_comidas: horarioComidas || null,
        por_que: porQue || null,
        notas_karina: notasKarina || null,
        semana_actual: 1
      }).select();

      if (errFicha) {
        setError(errFicha.message || 'Error al crear la ficha');
        setGuardando(false);
        return;
      }

      setExito('Ficha creada correctamente.');
      setUsuarioIdSeleccionado('');
      setNombreNueva('');
      setEmailNueva('');
      setPesoInicial('');
      setObjetivoKg('');
      setFechaInicio('');
      setRestricciones([]);
      setNivelActividad('');
      setHorarioComidas('');
      setPorQue('');
      setNotasKarina('');
      loadFichas();
      loadClientasSinFicha();
    } catch (e) {
      setError(e.message || 'Error al crear la ficha');
    } finally {
      setGuardando(false);
    }
  };

  const nombreFicha = (f) => {
    const u = Array.isArray(f.usuarios) ? f.usuarios[0] : f.usuarios;
    if (u && typeof u === 'object') return u.nombre || u.email || 'Sin nombre';
    return '—';
  };

  return (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Fichas de clientas</h1>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '8px',
            fontFamily: "'Jost', sans-serif"
          }}
        >
          {error}
        </div>
      )}
      {exito && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: '#e8f5e9',
            color: colors.sageDark,
            borderRadius: '8px',
            fontFamily: "'Jost', sans-serif"
          }}
        >
          {exito}
        </div>
      )}

      <div style={styles.twoColumns}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Fichas existentes</h2>
          {loading ? (
            <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>
              Cargando...
            </p>
          ) : fichas.length === 0 ? (
            <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>
              No hay fichas todavía.
            </p>
          ) : (
            fichas.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  background: colors.cream,
                  borderRadius: '8px',
                  cursor: 'default'
                }}
              >
                <div style={{ fontWeight: 600, fontFamily: "'Jost', sans-serif" }}>
                  {nombreFicha(f)}
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  Inicio: {formatFecha(f.fecha_inicio)}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Nueva ficha</h2>

          <div style={styles.profileLabel}>Clienta</div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.checkboxLabel}>
              <input
                type="radio"
                name="modoClienta"
                checked={modoClienta === 'existente'}
                onChange={() => {
                  setModoClienta('existente');
                  setEmailCreado(null);
                }}
              />
              Usar clienta existente (sin ficha)
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="radio"
                name="modoClienta"
                checked={modoClienta === 'nueva'}
                onChange={() => setModoClienta('nueva')}
              />
              Crear nueva clienta
            </label>
          </div>

          {modoClienta === 'existente' ? (
            <select
              style={styles.select}
              value={usuarioIdSeleccionado}
              onChange={(e) => setUsuarioIdSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar clienta...</option>
              {clientasSinFicha.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre || u.email} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
              {clientasSinFicha.length === 0 && (
                <option value="" disabled>
                  No hay clientas sin ficha
                </option>
              )}
            </select>
          ) : (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                style={styles.input}
                value={nombreNueva}
                onChange={(e) => setNombreNueva(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                style={styles.input}
                value={emailNueva}
                onChange={(e) => setEmailNueva(e.target.value)}
              />
            </>
          )}

          <input
            type="date"
            placeholder="Fecha de inicio"
            style={styles.input}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <input
            type="number"
            step="0.1"
            placeholder="Peso inicial (kg)"
            style={styles.input}
            value={pesoInicial}
            onChange={(e) => setPesoInicial(e.target.value)}
          />
          <input
            type="number"
            step="0.1"
            placeholder="Objetivo de peso (kg a bajar)"
            style={styles.input}
            value={objetivoKg}
            onChange={(e) => setObjetivoKg(e.target.value)}
          />

          <div style={styles.profileLabel}>Restricciones alimentarias</div>
          <div style={styles.checkboxGroup}>
            {RESTRICCIONES_OPCIONES.map((r) => (
              <label key={r} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={restricciones.includes(r)}
                  onChange={() => toggleRestriccion(r)}
                />
                {r}
              </label>
            ))}
          </div>

          <div style={styles.profileLabel}>Nivel de actividad</div>
          <select
            style={styles.select}
            value={nivelActividad}
            onChange={(e) => setNivelActividad(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {NIVEL_ACTIVIDAD_OPCIONES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Horario de comidas preferido"
            style={styles.input}
            value={horarioComidas}
            onChange={(e) => setHorarioComidas(e.target.value)}
          />
          <textarea
            placeholder="Tu por qué"
            style={styles.textarea}
            value={porQue}
            onChange={(e) => setPorQue(e.target.value)}
          />
          <textarea
            placeholder="Notas iniciales (Karina)"
            style={styles.textarea}
            value={notasKarina}
            onChange={(e) => setNotasKarina(e.target.value)}
          />

          <button
            style={styles.buttonPrimary}
            onClick={handleCrearFicha}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Crear ficha'}
          </button>

          {emailCreado && (
            <div style={styles.mensajeAuth}>
              Recordá crear la cuenta de esta clienta en Supabase Auth (dashboard → Authentication
              → Users) con el email: <strong>{emailCreado}</strong>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
