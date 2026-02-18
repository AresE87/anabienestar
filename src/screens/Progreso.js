import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Progreso() {
  const { registrosPeso, pesoLoaded, registrarPeso, racha } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [pesoInput, setPesoInput] = useState('');
  const [semanaInput, setSemanaInput] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState('todo'); // '6sem' | '3mes' | 'todo'

  // ── Calcular datos ──────────────────────────────
  const pesoInicial = registrosPeso.length > 0 ? registrosPeso[0].peso : null;
  const pesoActual = registrosPeso.length > 0 ? registrosPeso[registrosPeso.length - 1].peso : null;
  const kgPerdidos = pesoInicial && pesoActual ? (pesoInicial - pesoActual).toFixed(1) : '0.0';

  // ── Filtrar registros para el gráfico ──────────
  const filtrarRegistros = () => {
    if (!registrosPeso.length) return [];
    const ahora = new Date();

    return registrosPeso.filter((r) => {
      if (filtro === 'todo') return true;
      const fecha = new Date(r.fecha);
      const diffDias = (ahora - fecha) / (1000 * 60 * 60 * 24);
      if (filtro === '6sem') return diffDias <= 42;
      if (filtro === '3mes') return diffDias <= 90;
      return true;
    });
  };

  const datosGrafico = filtrarRegistros().map((r) => ({
    fecha: new Date(r.fecha).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'short',
    }),
    peso: r.peso,
  }));

  // ── Guardar peso ────────────────────────────────
  const handleGuardarPeso = async () => {
    if (!pesoInput || isNaN(parseFloat(pesoInput))) return;

    setGuardando(true);
    const result = await registrarPeso(pesoInput, semanaInput || null);
    setGuardando(false);

    if (result.success) {
      setPesoInput('');
      setSemanaInput('');
      setShowModal(false);
    } else {
      alert('Error al guardar. Intentá de nuevo.');
    }
  };

  const semanaActual = registrosPeso.length > 0
    ? Math.max(...registrosPeso.filter((r) => r.semana).map((r) => r.semana), 1)
    : 1;

  return (
    <div style={styles.container}>
      {/* ── Header ──────────────────────────────── */}
      <div style={styles.header}>
        <p style={styles.headerSub}>Tu progreso</p>
        <h1 style={styles.headerTitle}>Semana {semanaActual} de 12</h1>
      </div>

      {/* ── Card principal ──────────────────────── */}
      <div style={styles.mainCard}>
        <p style={styles.mainCardLabel}>Has bajado</p>
        <p style={styles.mainCardNum}>{kgPerdidos} kg</p>
        <div style={styles.progressBarBg}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${Math.min((semanaActual / 12) * 100, 100)}%`,
            }}
          />
        </div>
        <p style={styles.mainCardPercent}>
          {((semanaActual / 12) * 100).toFixed(0)}% del programa completado
        </p>
      </div>

      {/* ── Filtros ─────────────────────────────── */}
      <div style={styles.filtros}>
        {[
          { id: '6sem', label: '6 semanas' },
          { id: '3mes', label: '3 meses' },
          { id: 'todo', label: 'Todo' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            style={{
              ...styles.filtroBtn,
              ...(filtro === f.id ? styles.filtroBtnActive : {}),
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Gráfico ─────────────────────────────── */}
      <div style={styles.chartContainer}>
        {!pesoLoaded ? (
          <p style={styles.loading}>Cargando gráfico...</p>
        ) : datosGrafico.length === 0 ? (
          <p style={styles.loading}>Registrá tu primer peso para ver el gráfico</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={datosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eaf2eb" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: '#7a9e7e' }}
                axisLine={{ stroke: '#eaf2eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#7a9e7e' }}
                axisLine={{ stroke: '#eaf2eb' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontFamily: 'Jost, sans-serif',
                }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#3d5c41"
                strokeWidth={3}
                dot={{ fill: '#3d5c41', r: 5 }}
                activeDot={{ fill: '#b8956a', r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Mini stats ──────────────────────────── */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statEmoji}>🔥</p>
          <p style={styles.statNum}>{racha}</p>
          <p style={styles.statLabel}>Racha</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statEmoji}>📅</p>
          <p style={styles.statNum}>{semanaActual}</p>
          <p style={styles.statLabel}>Semanas</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statEmoji}>📊</p>
          <p style={styles.statNum}>{registrosPeso.length}</p>
          <p style={styles.statLabel}>Registros</p>
        </div>
      </div>

      {/* ── Botón registrar peso ────────────────── */}
      <button
        onClick={() => setShowModal(true)}
        style={styles.registrarBtn}
      >
        ＋ Registrar peso de hoy
      </button>

      {/* ── Modal ───────────────────────────────── */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Registrar peso</h3>

            <label style={styles.inputLabel}>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="Ej: 72.5"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              style={styles.input}
              autoFocus
            />

            <label style={styles.inputLabel}>Semana (opcional)</label>
            <input
              type="number"
              placeholder="Ej: 3"
              value={semanaInput}
              onChange={(e) => setSemanaInput(e.target.value)}
              style={styles.input}
            />

            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelBtn}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPeso}
                disabled={guardando || !pesoInput}
                style={{
                  ...styles.saveBtn,
                  opacity: guardando || !pesoInput ? 0.5 : 1,
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer para BottomNav */}
      <div style={{ height: 90 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════
const styles = {
  container: {
    maxWidth: 390,
    margin: '0 auto',
    backgroundColor: '#f8f4ee',
    minHeight: '100vh',
    fontFamily: 'Jost, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #3d5c41, #7a9e7e)',
    padding: '40px 24px 30px',
    borderRadius: '0 0 24px 24px',
    color: 'white',
  },
  headerSub: {
    fontSize: 14,
    margin: 0,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    margin: '4px 0 0',
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700,
  },
  mainCard: {
    margin: '16px 16px 0',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: 20,
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  mainCardLabel: { margin: 0, fontSize: 13, color: '#7a9e7e' },
  mainCardNum: {
    margin: '4px 0 12px',
    fontSize: 36,
    fontWeight: 700,
    color: '#3d5c41',
    fontFamily: 'Playfair Display, serif',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eaf2eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7a9e7e',
    borderRadius: 4,
    transition: 'width 0.5s ease',
  },
  mainCardPercent: {
    margin: '8px 0 0',
    fontSize: 12,
    color: '#7a9e7e',
  },
  filtros: {
    display: 'flex',
    gap: 8,
    margin: '16px 16px 0',
    justifyContent: 'center',
  },
  filtroBtn: {
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1.5px solid #eaf2eb',
    borderRadius: 20,
    fontSize: 13,
    color: '#7a9e7e',
    cursor: 'pointer',
    fontFamily: 'Jost, sans-serif',
    fontWeight: 500,
  },
  filtroBtnActive: {
    backgroundColor: '#3d5c41',
    borderColor: '#3d5c41',
    color: 'white',
  },
  chartContainer: {
    margin: '16px 16px 0',
    padding: '16px 8px',
    backgroundColor: 'white',
    borderRadius: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  loading: {
    fontSize: 14,
    color: '#7a9e7e',
    textAlign: 'center',
    padding: 30,
  },
  statsRow: {
    display: 'flex',
    gap: 10,
    margin: '16px 16px 0',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: '14px 8px',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  statEmoji: { fontSize: 22, margin: '0 0 4px' },
  statNum: {
    fontSize: 20,
    fontWeight: 700,
    color: '#3d5c41',
    margin: 0,
  },
  statLabel: { fontSize: 11, color: '#7a9e7e', margin: '2px 0 0' },
  registrarBtn: {
    display: 'block',
    width: 'calc(100% - 32px)',
    margin: '20px 16px 0',
    padding: '16px',
    backgroundColor: '#3d5c41',
    color: 'white',
    border: 'none',
    borderRadius: 16,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Jost, sans-serif',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: '28px 24px',
    maxWidth: 340,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Playfair Display, serif',
    color: '#3d5c41',
    margin: '0 0 20px',
    textAlign: 'center',
  },
  inputLabel: {
    display: 'block',
    fontSize: 13,
    color: '#7a9e7e',
    marginBottom: 6,
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #eaf2eb',
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Jost, sans-serif',
    marginBottom: 16,
    outline: 'none',
    boxSizing: 'border-box',
    color: '#3d5c41',
  },
  modalButtons: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f8f4ee',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    color: '#7a9e7e',
    cursor: 'pointer',
    fontFamily: 'Jost, sans-serif',
  },
  saveBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#3d5c41',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    fontFamily: 'Jost, sans-serif',
  },
};
