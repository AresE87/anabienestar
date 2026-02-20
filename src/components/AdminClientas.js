import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a'
};

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
  searchInput: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: `1px solid rgba(61, 92, 65, 0.3)`,
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    boxSizing: 'border-box'
  },
  tableRow: {
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: `1px solid ${colors.cream}`
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
  profileField: { marginBottom: '1rem' },
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
  }
};

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const d = new Date(fechaStr);
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function semanasDesdeInicio(fechaInicio) {
  if (!fechaInicio) return 1;
  const inicio = new Date(fechaInicio);
  const hoy = new Date();
  const diff = hoy - inicio;
  const semanas = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, semanas + 1);
}

function calcularProgreso(pesoInicial, pesoActual, objetivoKg) {
  if (!pesoInicial || objetivoKg == null || objetivoKg === 0) return 0;
  const perdido = pesoInicial - (pesoActual ?? pesoInicial);
  return Math.min(100, Math.round((perdido / Math.abs(objetivoKg)) * 100));
}

export default function AdminClientas() {
  const [clientas, setClientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchClientas, setSearchClientas] = useState('');
  const [selectedClienta, setSelectedClienta] = useState(null);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [ultimoPeso, setUltimoPeso] = useState(null);
  const [ultimoMood, setUltimoMood] = useState(null);
  const [checklistHoy, setChecklistHoy] = useState([]);
  const [notasSesion, setNotasSesion] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingFicha, setEditingFicha] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  const loadClientas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: usuarios, error: errUsuarios } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'clienta')
        .order('nombre');

      if (errUsuarios) {
        setError(errUsuarios.message || 'Error al cargar clientas');
        setLoading(false);
        return;
      }

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
    } catch (e) {
      setError(e.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientas();
  }, [loadClientas]);

  useEffect(() => {
    if (!selectedClienta) {
      setSelectedFicha(null);
      setUltimoPeso(null);
      setUltimoMood(null);
      setChecklistHoy([]);
      setNotasSesion([]);
      setEditForm({});
      return;
    }

    const uid = selectedClienta.id;
    setLoadingDetail(true);

    const loadDetail = async () => {
      const hoy = getTodayKey();

      const [fichaRes, pesoRes, moodRes, checklistRes, notasRes] = await Promise.all([
        supabase.from('fichas').select('*').eq('usuario_id', uid).maybeSingle(),
        supabase
          .from('registros_peso')
          .select('*')
          .eq('usuario_id', uid)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('estados_animo')
          .select('*')
          .eq('usuario_id', uid)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('checklist_items')
          .select('*')
          .eq('usuario_id', uid)
          .eq('fecha', hoy)
          .order('item'),
        supabase
          .from('notas_sesion')
          .select('texto')
          .eq('usuario_id', uid)
          .eq('fecha', hoy)
          .order('created_at', { ascending: true })
      ]);

      setSelectedFicha(fichaRes.data || null);
      setUltimoPeso(pesoRes.data || null);
      setUltimoMood(moodRes.data || null);
      setChecklistHoy(checklistRes.data || []);
      setNotasSesion((notasRes.data || []).map((r) => r.texto));
      if (fichaRes.data) {
        setEditForm({
          peso_inicial: fichaRes.data.peso_inicial,
          peso_actual: fichaRes.data.peso_actual ?? fichaRes.data.peso_inicial,
          objetivo_kg: fichaRes.data.objetivo_kg,
          restricciones: fichaRes.data.restricciones || [],
          nivel_actividad: fichaRes.data.nivel_actividad || '',
          horario_comidas: fichaRes.data.horario_comidas || '',
          por_que: fichaRes.data.por_que || '',
          notas_karina: fichaRes.data.notas_karina || ''
        });
      } else {
        setEditForm({});
      }
      setLoadingDetail(false);
    };

    loadDetail();
  }, [selectedClienta]);

  const filteredClientas = clientas.filter((c) =>
    (c.nombre || '').toLowerCase().includes(searchClientas.toLowerCase())
  );

  const handleSaveFicha = async () => {
    if (!selectedClienta || !selectedFicha) return;
    setGuardando(true);
    try {
      const { error: err } = await supabase
        .from('fichas')
        .update({
          peso_inicial: editForm.peso_inicial != null ? Number(editForm.peso_inicial) : null,
          peso_actual: editForm.peso_actual != null ? Number(editForm.peso_actual) : null,
          objetivo_kg: editForm.objetivo_kg != null ? Number(editForm.objetivo_kg) : null,
          restricciones: Array.isArray(editForm.restricciones) ? editForm.restricciones : [],
          nivel_actividad: editForm.nivel_actividad || null,
          horario_comidas: editForm.horario_comidas || null,
          por_que: editForm.por_que || null,
          notas_karina: editForm.notas_karina || null,
          semana_actual: selectedFicha.fecha_inicio
            ? semanasDesdeInicio(selectedFicha.fecha_inicio)
            : selectedFicha.semana_actual
        })
        .eq('id', selectedFicha.id);

      if (err) {
        setError(err.message || 'Error al guardar');
        setGuardando(false);
        return;
      }
      setEditingFicha(false);
      const { data: updated } = await supabase
        .from('fichas')
        .select('*')
        .eq('id', selectedFicha.id)
        .single();
      if (updated) setSelectedFicha(updated);
      loadClientas();
    } catch (e) {
      setError(e.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const ficha = selectedFicha;
  // eslint-disable-next-line no-unused-vars
  const semanaActual = ficha?.fecha_inicio
    ? semanasDesdeInicio(ficha.fecha_inicio)
    : (ficha?.semana_actual ?? 1);
  const progreso = ficha
    ? calcularProgreso(ficha.peso_inicial, ficha.peso_actual, ficha.objetivo_kg)
    : 0;

  return (
    <>
      <div style={styles.topbar}>
        <h1 style={styles.topbarTitle}>Clientas</h1>
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

      {loading ? (
        <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>Cargando...</p>
      ) : (
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
              {filteredClientas.length === 0 ? (
                <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>
                  No hay clientas para mostrar.
                </p>
              ) : (
                filteredClientas.map((c) => (
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
                      if (selectedClienta?.id !== c.id) e.currentTarget.style.background = colors.cream;
                    }}
                    onMouseLeave={(e) => {
                      if (selectedClienta?.id !== c.id) e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {c.avatar || '👩'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontFamily: "'Jost', sans-serif" }}>
                          {c.nombre || c.email || 'Sin nombre'}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          {c.ficha
                            ? `Semana ${c.ficha.semana_actual ?? semanasDesdeInicio(c.ficha.fecha_inicio)}`
                            : 'Sin ficha'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedClienta && (
            <div style={styles.profileCard}>
              <div style={styles.profileAvatar}>
                {selectedClienta.avatar || '👩'}
              </div>
              <div style={styles.profileName}>
                {selectedClienta.nombre || selectedClienta.email || 'Sin nombre'}
              </div>

              {loadingDetail ? (
                <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>
                  Cargando perfil...
                </p>
              ) : !ficha ? (
                <p style={{ fontFamily: "'Jost', sans-serif", color: colors.sageDark }}>
                  Esta clienta aún no tiene ficha. Creala desde la pestaña Fichas.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button
                      style={{ ...styles.buttonPrimary, flex: 1 }}
                      onClick={() =>
                        editingFicha ? handleSaveFicha() : setEditingFicha(true)
                      }
                      disabled={guardando}
                    >
                      {guardando
                        ? 'Guardando...'
                        : editingFicha
                          ? 'Guardar cambios'
                          : 'Editar ficha'}
                    </button>
                    {!editingFicha && (
                      <button
                        style={{ ...styles.buttonPrimary, background: colors.gold, flexShrink: 0 }}
                        onClick={() => {
                          const nombre = selectedClienta?.nombre || selectedClienta?.email || 'Clienta';
                          const printContent = `<!DOCTYPE html><html><head><title>Ficha - ${nombre}</title>
                            <style>
                              body { font-family: 'Jost', Arial, sans-serif; color: #3d5c41; padding: 2rem; max-width: 700px; margin: 0 auto; }
                              h1 { font-family: 'Playfair Display', Georgia, serif; color: #3d5c41; border-bottom: 2px solid #7a9e7e; padding-bottom: 0.5rem; }
                              .field { margin-bottom: 1rem; }
                              .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #7a9e7e; font-weight: 600; }
                              .value { font-size: 1rem; margin-top: 0.25rem; }
                              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                              .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
                              .avatar { font-size: 3rem; }
                            </style></head><body>
                            <div class="header"><span class="avatar">${selectedClienta?.avatar || '👩'}</span><h1>${nombre}</h1></div>
                            <div class="grid">
                              <div class="field"><div class="label">Email</div><div class="value">${selectedClienta?.email || '—'}</div></div>
                              <div class="field"><div class="label">Fecha inicio</div><div class="value">${ficha.fecha_inicio || '—'}</div></div>
                              <div class="field"><div class="label">Peso inicial</div><div class="value">${ficha.peso_inicial || '—'} kg</div></div>
                              <div class="field"><div class="label">Peso actual</div><div class="value">${ficha.peso_actual || ficha.peso_inicial || '—'} kg</div></div>
                              <div class="field"><div class="label">Objetivo</div><div class="value">${ficha.objetivo_kg || '—'} kg a bajar</div></div>
                              <div class="field"><div class="label">Nivel actividad</div><div class="value">${ficha.nivel_actividad || '—'}</div></div>
                            </div>
                            <div class="field"><div class="label">Restricciones</div><div class="value">${ficha.restricciones || 'Ninguna'}</div></div>
                            <div class="field"><div class="label">Notas de Ana</div><div class="value">${ficha.notas_karina || 'Sin notas'}</div></div>
                            <hr style="border: 1px solid #eae5dd; margin: 2rem 0;">
                            <p style="font-size: 0.75rem; opacity: 0.5; text-align: center;">Anabienestar Integral · Ficha exportada el ${new Date().toLocaleDateString('es-UY')}</p>
                          </body></html>`;
                          const w = window.open('', '_blank');
                          w.document.write(printContent);
                          w.document.close();
                          w.print();
                        }}
                      >
                        📄 PDF
                      </button>
                    )}
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Fecha de inicio</div>
                    <div style={styles.profileValue}>{formatFecha(ficha.fecha_inicio)}</div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Objetivo (kg a bajar)</div>
                    <div style={styles.profileValue}>
                      {editingFicha ? (
                        <input
                          type="number"
                          value={editForm.objetivo_kg ?? ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              objetivo_kg: e.target.value
                            }))
                          }
                          style={styles.input}
                        />
                      ) : (
                        `${ficha.objetivo_kg != null ? ficha.objetivo_kg : '—'} kg`
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
                            step="0.1"
                            value={editForm.peso_inicial ?? ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                peso_inicial: e.target.value
                              }))
                            }
                            style={styles.input}
                            placeholder="Peso inicial"
                          />
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.peso_actual ?? ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                peso_actual: e.target.value
                              }))
                            }
                            style={styles.input}
                            placeholder="Peso actual"
                          />
                        </>
                      ) : (
                        `${ficha.peso_inicial ?? '—'} kg / ${ficha.peso_actual ?? ficha.peso_inicial ?? '—'} kg`
                      )}
                    </div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Progreso</div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${progreso}%`
                        }}
                      />
                    </div>
                    <div style={{ ...styles.profileValue, marginTop: '0.5rem' }}>
                      {progreso}% ·{' '}
                      {((ficha.peso_inicial ?? 0) - (ficha.peso_actual ?? ficha.peso_inicial ?? 0)).toFixed(1)} kg
                    </div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Último registro de peso</div>
                    <div style={styles.profileValue}>
                      {ultimoPeso
                        ? `${ultimoPeso.peso} kg (${formatFecha(ultimoPeso.fecha)})`
                        : 'Sin registros'}
                    </div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Último estado de ánimo</div>
                    <div style={styles.profileValue}>
                      {ultimoMood
                        ? `${ultimoMood.mood} (${formatFecha(ultimoMood.fecha)})`
                        : 'Sin registro'}
                    </div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Checklist de hoy</div>
                    <div style={styles.profileValue}>
                      {checklistHoy.length === 0
                        ? 'Sin ítems'
                        : (
                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                              {checklistHoy.map((item) => (
                                <li key={item.id}>
                                  {item.completado ? '✓ ' : ''}
                                  {item.item}
                                </li>
                              ))}
                            </ul>
                          )}
                    </div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Restricciones alimentarias</div>
                    <div style={styles.profileValue}>
                      {Array.isArray(ficha.restricciones) && ficha.restricciones.length
                        ? ficha.restricciones.join(', ')
                        : 'Ninguna'}
                    </div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Nivel de actividad</div>
                    <div style={styles.profileValue}>{ficha.nivel_actividad || '—'}</div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Horario de comidas</div>
                    <div style={styles.profileValue}>{ficha.horario_comidas || '—'}</div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Por qué</div>
                    <div style={styles.profileValue}>{ficha.por_que || '—'}</div>
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Notas de Karina</div>
                    {editingFicha ? (
                      <textarea
                        value={editForm.notas_karina ?? ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, notas_karina: e.target.value }))
                        }
                        style={styles.textarea}
                      />
                    ) : (
                      <div style={styles.profileValue}>
                        {ficha.notas_karina || '—'}
                      </div>
                    )}
                  </div>

                  <div style={styles.profileField}>
                    <div style={styles.profileLabel}>Notas de la clienta para la sesión (hoy)</div>
                    <div style={styles.profileValue}>
                      {notasSesion.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                          {notasSesion.map((n, i) => (
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
