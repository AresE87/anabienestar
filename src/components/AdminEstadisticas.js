import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a',
};

const MOOD_COLORS = {
  happy: '#4ade80',
  neutral: '#facc15',
  sad: '#f87171',
  fire: '#fb923c',
};

const MOOD_LABELS = {
  happy: 'Bien',
  neutral: 'Normal',
  sad: 'Bajon',
  fire: 'Imparable',
};

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AdminEstadisticas() {
  const [range, setRange] = useState(30);
  const [checklistData, setChecklistData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [messageData, setMessageData] = useState([]);
  const [summaryData, setSummaryData] = useState({ clientasActivas: 0, mensajesTotales: 0, promedioChecklist: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const since = getDaysAgo(range);

    try {
      const [checklistRes, moodRes, mensajesRes, clientasRes] = await Promise.all([
        supabase.from('checklist_items').select('fecha, completado').gte('fecha', since.split('T')[0]),
        supabase.from('estados_animo').select('mood, fecha').gte('fecha', since.split('T')[0]),
        supabase.from('mensajes').select('created_at, remitente_id').gte('created_at', since),
        supabase.from('usuarios').select('id').eq('rol', 'clienta'),
      ]);

      // Checklist: group by date, calculate completion %
      const checklistByDate = {};
      (checklistRes.data || []).forEach(item => {
        const fecha = item.fecha;
        if (!checklistByDate[fecha]) checklistByDate[fecha] = { total: 0, completed: 0 };
        checklistByDate[fecha].total++;
        if (item.completado) checklistByDate[fecha].completed++;
      });

      const checklistChart = Object.entries(checklistByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([fecha, data]) => ({
          fecha: formatDate(fecha),
          porcentaje: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        }));
      setChecklistData(checklistChart);

      // Mood: count per type
      const moodCounts = {};
      (moodRes.data || []).forEach(item => {
        moodCounts[item.mood] = (moodCounts[item.mood] || 0) + 1;
      });
      const moodChart = Object.entries(moodCounts).map(([mood, count]) => ({
        name: MOOD_LABELS[mood] || mood,
        value: count,
        color: MOOD_COLORS[mood] || colors.sage,
      }));
      setMoodData(moodChart);

      // Messages: count per day
      const msgByDay = {};
      (mensajesRes.data || []).forEach(msg => {
        const day = new Date(msg.created_at).toISOString().split('T')[0];
        msgByDay[day] = (msgByDay[day] || 0) + 1;
      });
      const msgChart = Object.entries(msgByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([fecha, count]) => ({
          fecha: formatDate(fecha),
          mensajes: count,
        }));
      setMessageData(msgChart);

      // Summary
      const totalChecklist = checklistRes.data?.length || 0;
      const completedChecklist = checklistRes.data?.filter(i => i.completado).length || 0;
      setSummaryData({
        clientasActivas: clientasRes.data?.length || 0,
        mensajesTotales: mensajesRes.data?.length || 0,
        promedioChecklist: totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0,
      });
    } catch (err) {
      console.error('Error cargando estadisticas:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.title}>Estadisticas de Engagement</h1>
          <p style={styles.subtitle}>Metricas de uso de las ultimas {range === 7 ? 'semana' : `${range} dias`}</p>
        </div>
        <div style={styles.rangeSelector}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              style={{
                ...styles.rangeBtn,
                background: range === d ? colors.sage : 'white',
                color: range === d ? 'white' : colors.sageDark,
              }}
              onClick={() => setRange(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={styles.loadingText}>Cargando estadisticas...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{summaryData.clientasActivas}</div>
              <div style={styles.statLabel}>Clientas activas</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{summaryData.mensajesTotales}</div>
              <div style={styles.statLabel}>Mensajes</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{summaryData.promedioChecklist}%</div>
              <div style={styles.statLabel}>Checklist completado</div>
            </div>
          </div>

          {/* Charts grid */}
          <div style={styles.chartsGrid}>
            {/* Checklist bar chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Completado de Checklist Diario</h3>
              {checklistData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={checklistData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eae5dd" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fontFamily: 'Jost' }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Jost' }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="porcentaje" fill={colors.sage} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.noData}>Sin datos de checklist</p>
              )}
            </div>

            {/* Mood pie chart */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Distribucion de Animo</h3>
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={moodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {moodData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.noData}>Sin datos de animo</p>
              )}
            </div>

            {/* Messages line chart */}
            <div style={{ ...styles.chartCard, gridColumn: '1 / -1' }}>
              <h3 style={styles.chartTitle}>Frecuencia de Mensajes</h3>
              {messageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={messageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eae5dd" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fontFamily: 'Jost' }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Jost' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="mensajes" stroke={colors.gold} strokeWidth={2} dot={{ fill: colors.gold }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={styles.noData}>Sin datos de mensajes</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

const styles = {
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.sageDark,
    margin: 0,
  },
  subtitle: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.85rem',
    color: colors.sageDark,
    opacity: 0.6,
    margin: '0.25rem 0 0',
  },
  rangeSelector: {
    display: 'flex',
    gap: '0.5rem',
  },
  rangeBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: `1px solid ${colors.sage}`,
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    background: 'white',
    borderRadius: 14,
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statValue: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '2rem',
    fontWeight: 600,
    color: colors.sageDark,
    marginBottom: '0.5rem',
  },
  statLabel: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    color: colors.sageDark,
    opacity: 0.7,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  chartCard: {
    background: 'white',
    borderRadius: 14,
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  chartTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.1rem',
    fontWeight: 600,
    color: colors.sageDark,
    marginBottom: '1rem',
    marginTop: 0,
  },
  noData: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    color: colors.sageDark,
    opacity: 0.5,
    textAlign: 'center',
    padding: '2rem',
  },
  loadingText: {
    fontFamily: "'Jost', sans-serif",
    color: colors.sageDark,
    textAlign: 'center',
    padding: '3rem',
  },
};
