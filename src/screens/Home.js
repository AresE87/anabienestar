import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const TODAY = new Date().toISOString().split('T')[0];

const CHECKLIST_DEFAULT = [
  'Actividad física 30 min',
  'Agua 8 vasos',
  'Respiración consciente',
  'Desayuno saludable',
  'Momento para mí'
];

const colors = {
  sageDark: '#3d5c41', sage: '#7a9e7e', sagePale: '#eaf2eb',
  cream: '#f8f4ee', gold: '#b8956a', white: '#ffffff',
  light: '#a0a0a0', charcoal: '#2a2a2a', mid: '#6a6a6a'
};

export default function Home() {
  const [checklist, setChecklist] = useState(
    CHECKLIST_DEFAULT.map(item => ({ item, completado: false }))
  );
  const [mood, setMood] = useState(null);
  const [showDificil, setShowDificil] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    try {
      const { data: checkData } = await supabase
        .from('checklist_items')
        .select('item, completado')
        .eq('usuario_id', USER_ID)
        .eq('fecha', TODAY);

      if (checkData && checkData.length > 0) {
        const updated = CHECKLIST_DEFAULT.map(item => {
          const found = checkData.find(d => d.item === item);
          return { item, completado: found ? found.completado : false };
        });
        setChecklist(updated);
      }

      const { data: moodData } = await supabase
        .from('estados_animo')
        .select('mood')
        .eq('usuario_id', USER_ID)
        .eq('fecha', TODAY)
        .maybeSingle();

      if (moodData) setMood(moodData.mood);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
    setLoading(false);
  }

  async function toggleCheck(index) {
    const nuevo = checklist.map((c, i) =>
      i === index ? { ...c, completado: !c.completado } : c
    );
    setChecklist(nuevo);
    const item = nuevo[index];
    await supabase.from('checklist_items').upsert(
      { usuario_id: USER_ID, fecha: TODAY, item: item.item, completado: item.completado },
      { onConflict: 'usuario_id,fecha,item' }
    );
  }

  async function seleccionarMood(m) {
    setMood(m);
    await supabase.from('estados_animo').upsert(
      { usuario_id: USER_ID, fecha: TODAY, mood: m },
      { onConflict: 'usuario_id,fecha' }
    );
  }

  const moods = [
    { key: 'bien', emoji: '😊', label: 'Bien' },
    { key: 'regular', emoji: '😐', label: 'Regular' },
    { key: 'dificil', emoji: '😔', label: 'Dificil' },
    { key: 'motivada', emoji: '🔥', label: 'Motivada!' }
  ];

  const completados = checklist.filter(c => c.completado).length;

  return (
    <div style={{ background: colors.cream, minHeight: '100vh', paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{
        background: `linear-gradient(155deg, ${colors.sageDark} 0%, ${colors.sage} 100%)`,
        padding: '22px 20px 28px'
      }}>
        <div style={{ fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', marginBottom: 3 }}>Buenos dias,</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.65rem', color: '#fff', fontStyle: 'italic' }}>Maria Laura</div>
        <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Semana 6 - Tu mejor momento es ahora</div>
      </div>

      {/* RACHA */}
      <div style={{ margin: '14px 16px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, ${colors.sageDark}, ${colors.sage})`,
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(61,92,65,.3)'
        }}>
          <div>
            <div style={{ fontSize: '1.4rem' }}>🔥</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: '#fff', fontWeight: 700, lineHeight: 1 }}>12</div>
            <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.7)', letterSpacing: '.1em', textTransform: 'uppercase' }}>dias seguidos</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.85)', fontStyle: 'italic' }}>No rompas la racha!</div>
            <div style={{ display: 'flex', gap: 3, marginTop: 6, justifyContent: 'flex-end' }}>
              {[...Array(7)].map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FRASE */}
      <div style={{ margin: '14px 16px 0', borderLeft: `3px solid ${colors.gold}`, padding: 14, background: colors.white, borderRadius: '0 14px 14px 0', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <div style={{ fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', color: colors.gold, marginBottom: 5 }}>Ana Karina</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '.95rem', fontStyle: 'italic', color: colors.charcoal, lineHeight: 1.55 }}>
          Cada eleccion pequena que haces hoy construye la version de vos que sonas.
        </div>
      </div>

      {/* CHECKLIST */}
      <div style={{ margin: '14px 16px 0' }}>
        <div style={{ fontSize: '.58rem', letterSpacing: '.16em', textTransform: 'uppercase', color: colors.light, marginBottom: 8 }}>
          Tu checklist - {completados}/{checklist.length}
        </div>
        <div style={{ background: colors.white, borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,.06)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 16, textAlign: 'center', color: colors.light, fontSize: '.75rem' }}>Cargando...</div>
          ) : (
            checklist.map((c, i) => (
              <div key={c.item} onClick={() => toggleCheck(i)} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 16px',
                borderBottom: i < checklist.length - 1 ? '1px solid #f2f2f2' : 'none',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: c.completado ? colors.sage : 'transparent',
                  border: `1.5px solid ${c.completado ? colors.sage : '#d0d0d0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '.65rem', transition: 'all .2s'
                }}>
                  {c.completado ? '✓' : ''}
                </div>
                <div style={{
                  fontSize: '.8rem',
                  color: c.completado ? colors.light : colors.charcoal,
                  textDecoration: c.completado ? 'line-through' : 'none'
                }}>{c.item}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MOOD */}
      <div style={{ margin: '14px 16px 0' }}>
        <div style={{ fontSize: '.58rem', letterSpacing: '.16em', textTransform: 'uppercase', color: colors.light, marginBottom: 8 }}>Como te sentis hoy?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {moods.map(m => (
            <div key={m.key} onClick={() => seleccionarMood(m.key)} style={{
              flex: 1, borderRadius: 12, padding: '10px 4px',
              textAlign: 'center', cursor: 'pointer',
              border: `1.5px solid ${mood === m.key ? colors.sage : 'transparent'}`,
              background: mood === m.key ? colors.sagePale : colors.white,
              boxShadow: '0 1px 6px rgba(0,0,0,.05)', transition: 'all .2s'
            }}>
              <div style={{ fontSize: '1.4rem' }}>{m.emoji}</div>
              <div style={{ fontSize: '.52rem', color: colors.light, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DIA DIFICIL */}
      <div style={{ margin: '14px 16px 0' }}>
        <button onClick={() => setShowDificil(true)} style={{
          width: '100%', background: 'transparent', border: '1px solid #e8e4de',
          borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center',
          gap: 10, cursor: 'pointer', textAlign: 'left'
        }}>
          <span style={{ fontSize: '1rem' }}>🌿</span>
          <div>
            <div style={{ fontSize: '.75rem', color: colors.charcoal, fontWeight: 500 }}>Hoy es un dia dificil</div>
            <div style={{ fontSize: '.62rem', color: colors.light }}>Esta bien. Ana Karina tiene un mensaje para vos.</div>
          </div>
        </button>
      </div>

      {/* MODAL DIA DIFICIL */}
      {showDificil && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{ background: colors.white, borderRadius: 20, padding: 24, maxWidth: 320, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '2rem' }}>🌿</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '.95rem', fontStyle: 'italic', color: colors.charcoal, lineHeight: 1.6, textAlign: 'center', marginBottom: 20 }}>
              Esta bien tomarse un descanso. Lo mas importante es que estas aca, intentandolo. Eso ya es un logro enorme.
            </div>
            <div style={{ fontSize: '.7rem', color: colors.light, textAlign: 'center', marginBottom: 16 }}>Ana Karina</div>
            <button onClick={() => setShowDificil(false)} style={{
              width: '100%', background: colors.sage, color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px', fontFamily: 'Jost, sans-serif',
              fontSize: '.8rem', cursor: 'pointer', fontWeight: 500
            }}>Gracias, Ana</button>
          </div>
        </div>
      )}
    </div>
  );
}