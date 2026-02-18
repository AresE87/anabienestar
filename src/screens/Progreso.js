import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function Progreso() {
  const [selectedPeriod, setSelectedPeriod] = useState('6 semanas');

  // Colores (iguales a Home.js)
  const colors = {
    sage: '#7a9e7e',
    sageDark: '#3d5c41',
    cream: '#f8f4ee',
    gold: '#b8956a'
  };

  // Datos del gráfico
  const chartData = [
    { semana: 'S1', peso: 78 },
    { semana: 'S2', peso: 76.5 },
    { semana: 'S3', peso: 75.3 },
    { semana: 'S4', peso: 74.4 },
    { semana: 'S5', peso: 73.3 },
    { semana: 'S6', peso: 72.5 }
  ];

  // Datos de registro semanal
  const weeklyRecords = [
    { semana: 'Semana 1', fecha: '15 Ene', peso: 78.0, perdido: 0 },
    { semana: 'Semana 2', fecha: '22 Ene', peso: 76.5, perdido: 1.5 },
    { semana: 'Semana 3', fecha: '29 Ene', peso: 75.3, perdido: 2.7 },
    { semana: 'Semana 4', fecha: '5 Feb', peso: 74.4, perdido: 3.6 },
    { semana: 'Semana 5', fecha: '12 Feb', peso: 73.3, perdido: 4.7 },
    { semana: 'Semana 6', fecha: '19 Feb', peso: 72.5, perdido: 5.5 }
  ];

  // Estilos
  const styles = {
    container: {
      padding: '1.25rem 1.25rem 1rem',
      minHeight: 'calc(100vh - 80px)',
      background: colors.cream
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
    }
  };

  const periods = ['6 semanas', '3 meses', 'Todo'];

  // Custom tooltip para el gráfico
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

  return (
    <div style={styles.container}>
      {/* Header con gradiente */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Tu Progreso</h1>
        <p style={styles.headerSubtitle}>Semana 6 de 12</p>
      </div>

      {/* Tarjeta de progreso principal */}
      <div style={styles.progressCard}>
        <div style={styles.progressNumber}>−5,5 kg</div>
        <div style={styles.progressText}>
          de tu objetivo de −10 kg · 55% logrado
        </div>
      </div>

      {/* Chips de período */}
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

      {/* Tarjeta con gráfico */}
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
              domain={[70, 80]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="peso"
              stroke={colors.sage}
              strokeWidth={3}
              dot={(props) => {
                const { index, payload } = props;
                // Solo mostrar punto en el último elemento
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

      {/* Tres mini tarjetas */}
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

      {/* Lista de registro semanal */}
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
    </div>
  );
}

export default Progreso;
