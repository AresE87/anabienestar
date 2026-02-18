import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';

const USER_ID = '00000000-0000-0000-0000-000000000001';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcularSemana(fecha, fechaInicio) {
  const inicio = new Date(fechaInicio);
  const actual = new Date(fecha);
  const diffTime = actual - inicio;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

function formatFechaShort(str) {
  if (!str) return '';
  const d = new Date(str);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function buildChartAndRecords(registros) {
  const sorted = [...registros].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const last6 = sorted.slice(-6);
  const firstPeso = last6.length ? last6[0].peso : 0;
  const chartData = last6.map((r, i) => ({
    semana: `S${i + 1}`,
    peso: r.peso
  }));
  const weeklyRecords = last6.map((r, i) => ({
    semana: `Semana ${i + 1}`,
    fecha: formatFechaShort(r.fecha),
    peso: r.peso,
    perdido: Math.round((firstPeso - r.peso) * 10) / 10
  }));
  return { chartData, weeklyRecords };
}

function Progreso() {
  const [selectedPeriod, setSelectedPeriod] = useState('6 semanas');
  const [registros, setRegistros] = useState([]);
  const [showPesoModal, setShowPesoModal] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar registros al montar
  useEffect(() => {
    const loadRegistros = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('registros_peso')
          .select('fecha, peso, semana')
          .eq('usuario_id', USER_ID)
          .order('fecha', { ascending: true });

        if (!error && data) {
          setRegistros(data);
        }
      } catch (error) {
        console.error('Error cargando registros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRegistros();
  }, []);

  const { chartData, weeklyRecords } = useMemo(() => buildChartAndRecords(registros), [registros]);

  const openPesoModal = () => {
    setNuevoPeso('');
    setShowPesoModal(true);
  };

  const closePesoModal = () => {
    setShowPesoModal(false);
    setNuevoPeso('');
  };

  const savePeso = async () => {
    const num = parseFloat(nuevoPeso.replace(',', '.').trim());
    if (Number.isNaN(num) || num <= 0 || num >= 300) return;

    const fecha = getTodayKey();
    
    // Calcular semana: si hay registros, usar la fecha del primer registro como inicio
    // Si no hay registros, usar una fecha de inicio por defecto (15 de enero 2026)
    const fechaInicio = registros.length > 0 
      ? registros[0].fecha 
      : '2026-01-15';
    const semana = calcularSemana(fecha, fechaInicio);
    
    try {
      const { error } = await supabase
        .from('registros_peso')
        .upsert({
          usuario_id: USER_ID,
          fecha: fecha,
          peso: num,
          semana: semana
        });

      if (error) {
        console.error('Error guardando peso:', error);
        return;
      }

      // Recargar registros
      const { data, error: reloadError } = await supabase
        .from('registros_peso')
        .select('fecha, peso, semana')
        .eq('usuario_id', USER_ID)
        .order('fecha', { ascending: true });

      if (!reloadError && data) {
        setRegistros(data);
      }

      closePesoModal();
    } catch (error) {
      console.error('Error guardando peso:', error);
    }
  };

  // Colores (iguales a Home.js)
  const colors = {
    sage: '#7a9e7e',
    sageDark: '#3d5c41',
    cream: '#f8f4ee',
    gold: '#b8956a'
  };

  // Estilos
  const styles = {
    container: {
      padding: '1.25rem 1.25rem 1rem',
      minHeight: 'calc(100vh - 80px)',
      background: colors.cream
    },
    loadingText: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      textAlign: 'center',
      padding: '2rem'
    },
    header: {
      background: `linear-gradient(135deg, ${colors.sageDark} 0%, ${colors.sage} 100%)`,
      borderRadius: '0 0 1.5rem 1.5rem',
      padding: '2rem 1.25rem 1.5rem',
      margin: '-1.25rem -1.25rem 1.5rem -1.25rem',
      color: 'white'
    },
    headerTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.75rem',
      fontWeight: 600,
      margin: 0,
      marginBottom: '0.25rem'
    },
    headerSubtitle: {
      fontSize: '0.95rem',
      opacity: 0.9,
      fontFamily: "'Jost', sans-serif",
      fontWeight: 400,
      margin: 0
    },
    progressCard: {
      background: 'white',
      borderRadius: '1rem',
      padding: '2rem 1.5rem',
      marginBottom: '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      textAlign: 'center'
    },
    progressNumber: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '3rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.5rem',
      lineHeight: 1
    },
    progressText: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      color: colors.sageDark,
      opacity: 0.7,
      lineHeight: 1.5
    },
    chipsContainer: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '1.25rem',
      overflowX: 'auto',
      paddingBottom: '0.5rem'
    },
    chip: {
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
    chipActive: {
      background: colors.sage,
      color: 'white',
      borderColor: colors.sage
    },
    chartCard: {
      background: 'white',
      borderRadius: '1rem',
      padding: '1.5rem 1rem 1rem',
      marginBottom: '1.25rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    miniCardsContainer: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '1.25rem'
    },
    miniCard: {
      flex: 1,
      background: 'white',
      borderRadius: '0.75rem',
      padding: '1rem 0.75rem',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    miniCardNumber: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    miniCardLabel: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.75rem',
      color: colors.sageDark,
      opacity: 0.7
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.75rem',
      marginTop: '1.5rem'
    },
    recordsList: {
      background: 'white',
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    recordItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.25rem',
      borderBottom: '1px solid rgba(61, 92, 65, 0.1)'
    },
    recordItemLast: {
      borderBottom: 'none'
    },
    recordLeft: {
      flex: 1
    },
    recordWeek: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    recordDate: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sageDark,
      opacity: 0.6
    },
    recordRight: {
      textAlign: 'right'
    },
    recordPeso: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 600,
      color: colors.sageDark,
      marginBottom: '0.25rem'
    },
    recordPerdido: {
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.85rem',
      color: colors.sage,
      fontWeight: 500
    },
    addPesoButton: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.75rem',
      border: `2px solid ${colors.sage}`,
      background: 'white',
      color: colors.sageDark,
      fontFamily: "'Jost', sans-serif",
      fontSize: '0.95rem',
      fontWeight: 500,
      cursor: 'pointer',
      marginBottom: '1.25rem'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.25rem'
    },
    modalBox: {
      background: colors.cream,
      borderRadius: '1rem',
      padding: '1.5rem',
      maxWidth: '340px',
      width: '100%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    },
    modalTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '1.1rem',
      color: colors.sageDark,
      marginBottom: '1rem'
    },
    modalInput: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: `2px solid rgba(61, 92, 65, 0.3)`,
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      marginBottom: '1rem',
      boxSizing: 'border-box'
    },
    modalActions: {
      display: 'flex',
      gap: '0.75rem'
    },
    modalButtonSave: {
      flex: 1,
      padding: '0.75rem',
      borderRadius: '0.75rem',
      border: 'none',
      background: colors.sage,
      color: 'white',
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer'
    },
    modalButtonCancel: {
      flex: 1,
      padding: '0.75rem',
      borderRadius: '0.75rem',
      border: `2px solid ${colors.sage}`,
      background: 'transparent',
      color: colors.sageDark,
      fontFamily: "'Jost', sans-serif",
      fontSize: '1rem',
      fontWeight: 500,
      cursor: 'pointer'
    }
  };

  const periods = ['6 semanas', '3 meses', 'Todo'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.5rem',
          border: `1px solid ${colors.sage}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{
            margin: 0,
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.85rem',
            color: colors.sageDark,
            fontWeight: 600
          }}>
            {payload[0].payload.semana}: {payload[0].value} kg
          </p>
        </div>
      );
    }
    return null;
  };

  const pesoMin = chartData.length ? Math.min(...chartData.map((d) => d.peso)) - 2 : 70;
  const pesoMax = chartData.length ? Math.max(...chartData.map((d) => d.peso)) + 2 : 80;
  const yDomain = [Math.max(40, Math.floor(pesoMin)), Math.ceil(pesoMax)];

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Tu Progreso</h1>
        <p style={styles.headerSubtitle}>Semana 6 de 12</p>
      </div>

      <div style={styles.progressCard}>
        <div style={styles.progressNumber}>−5,5 kg</div>
        <div style={styles.progressText}>
          de tu objetivo de −10 kg · 55% logrado
        </div>
      </div>

      <div style={styles.chipsContainer}>
        {periods.map((period) => (
          <button
            key={period}
            style={{
              ...styles.chip,
              ...(selectedPeriod === period ? styles.chipActive : {})
            }}
            onClick={() => setSelectedPeriod(period)}
          >
            {period}
          </button>
        ))}
      </div>

      <button style={styles.addPesoButton} onClick={openPesoModal}>
        ＋ Registrar peso de hoy
      </button>

      <div style={styles.chartCard}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="semana"
              tick={{ fill: colors.sageDark, fontSize: 12, fontFamily: "'Jost', sans-serif" }}
              axisLine={{ stroke: colors.sageDark, opacity: 0.3 }}
              tickLine={{ stroke: colors.sageDark, opacity: 0.3 }}
            />
            <YAxis
              tick={{ fill: colors.sageDark, fontSize: 12, fontFamily: "'Jost', sans-serif" }}
              axisLine={{ stroke: colors.sageDark, opacity: 0.3 }}
              tickLine={{ stroke: colors.sageDark, opacity: 0.3 }}
              domain={yDomain}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="peso"
              stroke={colors.sage}
              strokeWidth={3}
              dot={(props) => {
                const { index } = props;
                if (index === chartData.length - 1) {
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={5}
                      fill={colors.sage}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              }}
              activeDot={{ r: 6, fill: colors.sage }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.miniCardsContainer}>
        <div style={styles.miniCard}>
          <div style={styles.miniCardNumber}>12</div>
          <div style={styles.miniCardLabel}>días racha</div>
        </div>
        <div style={styles.miniCard}>
          <div style={styles.miniCardNumber}>6/12</div>
          <div style={styles.miniCardLabel}>semanas</div>
        </div>
        <div style={styles.miniCard}>
          <div style={styles.miniCardNumber}>94%</div>
          <div style={styles.miniCardLabel}>adherencia</div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Registro semanal</h2>
      <div style={styles.recordsList}>
        {weeklyRecords.map((record, index) => (
          <div
            key={record.semana}
            style={{
              ...styles.recordItem,
              ...(index === weeklyRecords.length - 1 ? styles.recordItemLast : {})
            }}
          >
            <div style={styles.recordLeft}>
              <div style={styles.recordWeek}>{record.semana}</div>
              <div style={styles.recordDate}>{record.fecha}</div>
            </div>
            <div style={styles.recordRight}>
              <div style={styles.recordPeso}>{record.peso} kg</div>
              {record.perdido > 0 && (
                <div style={styles.recordPerdido}>−{record.perdido} kg</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPesoModal && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => e.target === e.currentTarget && closePesoModal()}
        >
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Registrar peso de hoy</h3>
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              placeholder="Ej: 72.5"
              style={styles.modalInput}
              value={nuevoPeso}
              onChange={(e) => setNuevoPeso(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && savePeso()}
            />
            <div style={styles.modalActions}>
              <button style={styles.modalButtonCancel} onClick={closePesoModal}>
                Cancelar
              </button>
              <button style={styles.modalButtonSave} onClick={savePeso}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Progreso;
