import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const colors = {
  sageDark: '#3d5c41',
  sage: '#7a9e7e',
  cream: '#f8f4ee',
  gold: '#b8956a',
  orange: '#c4762a',
};

// Sonido de notificacion sutil (ding corto generado como Data URI)
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19teleQAIBAAEARQAxABAACABkYXRhId29vT18A' +
  // Mini beep WAV — se genera en runtime con AudioContext como fallback
  '';

const RESPUESTAS_RAPIDAS = [
  '¡Hola! ¿Como estas hoy?',
  '¡Excelente progreso!',
  'Recorda completar tu checklist',
  '¿Tenes alguna duda?',
  '¡Nos vemos en la proxima sesion!',
  'Perfecto, gracias por compartir 🌿',
  '¿Como te sentiste con las comidas esta semana?',
];

// Funcion para reproducir sonido de notificacion
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 830;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Navegador bloquea autoplay — no pasa nada
  }
};

export default function AdminMensajes() {
  const { perfil } = useAuth();
  const adminId = perfil?.id;

  const [conversaciones, setConversaciones] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [showRespuestas, setShowRespuestas] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectedConvRef = useRef(null);

  // Mantener ref actualizada para usar en callbacks de realtime
  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cargar todas las conversaciones
  const loadConversaciones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversaciones')
        .select('*, usuarios:clienta_id(id, nombre, email, avatar)')
        .order('ultimo_mensaje_at', { ascending: false });

      if (error) {
        console.error('Error cargando conversaciones:', error);
        return;
      }
      setConversaciones(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar mensajes de una conversacion
  const loadMensajes = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMensajes(true);
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error cargando mensajes:', error);
        return;
      }
      setMensajes(data || []);

      // Marcar como leidos los mensajes de la clienta
      const noLeidos = (data || []).filter(m => m.remitente_id !== adminId && !m.leido);
      if (noLeidos.length > 0) {
        await supabase
          .from('mensajes')
          .update({ leido: true })
          .in('id', noLeidos.map(m => m.id));

        await supabase
          .from('conversaciones')
          .update({ no_leidos_admin: 0 })
          .eq('id', convId);

        // Actualizar lista de conversaciones localmente
        setConversaciones(prev =>
          prev.map(c => c.id === convId ? { ...c, no_leidos_admin: 0 } : c)
        );
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingMensajes(false);
    }
  }, [adminId]);

  // Init
  useEffect(() => {
    loadConversaciones();
  }, [loadConversaciones]);

  // Cargar mensajes cuando se selecciona una conversacion
  useEffect(() => {
    if (selectedConv) {
      loadMensajes(selectedConv.id);
    }
  }, [selectedConv, loadMensajes]);

  // Realtime: nuevos mensajes + sonido de notificacion
  useEffect(() => {
    const channel = supabase
      .channel('admin-chat-all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
      }, (payload) => {
        const nuevoMsg = payload.new;
        const currentConv = selectedConvRef.current;

        // Si es de la conversacion activa, agregar al chat
        if (currentConv && nuevoMsg.conversacion_id === currentConv.id) {
          setMensajes(prev => [...prev, nuevoMsg]);
          // Auto-marcar como leido
          if (nuevoMsg.remitente_id !== adminId) {
            supabase.from('mensajes').update({ leido: true }).eq('id', nuevoMsg.id);
            supabase.from('conversaciones').update({ no_leidos_admin: 0 }).eq('id', currentConv.id);
          }
        }

        // Sonido de notificacion cuando un mensaje llega de una clienta
        if (nuevoMsg.remitente_id !== adminId) {
          // Suena si: no hay conv activa, o el mensaje es de otra conv, o el tab no esta enfocado
          const esOtraConv = !currentConv || nuevoMsg.conversacion_id !== currentConv.id;
          const tabNoEnfocado = document.hidden;
          if (esOtraConv || tabNoEnfocado) {
            playNotificationSound();
          }
        }

        // Actualizar lista de conversaciones
        loadConversaciones();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId, loadConversaciones]);

  // Realtime: typing indicator via Broadcast
  useEffect(() => {
    if (!selectedConv) return;

    const typingChannel = supabase
      .channel(`typing-${selectedConv.id}`)
      .on('broadcast', { event: 'user_typing' }, (payload) => {
        // Solo mostrar si es la clienta escribiendo (no el admin)
        if (payload.payload?.userId !== adminId) {
          setPeerTyping(true);
          // Limpiar timeout anterior
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setPeerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      setPeerTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(typingChannel);
    };
  }, [selectedConv, adminId]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Enviar broadcast de typing al canal de la conversacion activa
  const lastTypingSentRef = useRef(0);
  const sendTypingBroadcast = useCallback(() => {
    if (!selectedConv) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return; // Debounce 2s
    lastTypingSentRef.current = now;
    supabase.channel(`typing-${selectedConv.id}`).send({
      type: 'broadcast',
      event: 'user_typing',
      payload: { userId: adminId },
    }).catch(() => {});
  }, [selectedConv, adminId]);

  // Enviar mensaje
  const handleEnviar = async () => {
    if (!nuevoMensaje.trim() || !selectedConv || enviando) return;
    setEnviando(true);
    setShowRespuestas(false);
    const texto = nuevoMensaje.trim();
    setNuevoMensaje('');

    try {
      const { error } = await supabase.from('mensajes').insert({
        conversacion_id: selectedConv.id,
        remitente_id: adminId,
        tipo: 'texto',
        contenido: texto,
      });

      if (error) {
        console.error('Error enviando:', error);
        setNuevoMensaje(texto);
        return;
      }

      // Actualizar conversacion
      await supabase.from('conversaciones').update({
        ultimo_mensaje: texto,
        ultimo_mensaje_at: new Date().toISOString(),
      }).eq('id', selectedConv.id);

      // Incrementar no_leidos_clienta
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('no_leidos_clienta')
        .eq('id', selectedConv.id)
        .single();
      if (conv) {
        await supabase.from('conversaciones')
          .update({ no_leidos_clienta: (conv.no_leidos_clienta || 0) + 1 })
          .eq('id', selectedConv.id);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setEnviando(false);
    }
  };

  // Subir archivo
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      alert('Solo puedes enviar imagenes o videos');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo es muy grande. Maximo 20MB.');
      return;
    }

    setSubiendo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `admin/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) {
        alert('Error subiendo archivo');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      const tipo = isImage ? 'imagen' : 'video';

      const { error } = await supabase.from('mensajes').insert({
        conversacion_id: selectedConv.id,
        remitente_id: adminId,
        tipo: tipo,
        contenido: isImage ? 'Envio una foto' : 'Envio un video',
        media_url: urlData.publicUrl,
        media_type: file.type,
      });

      if (error) {
        console.error('Error guardando mensaje:', error);
        return;
      }

      const preview = isImage ? '📷 Foto' : '🎥 Video';
      await supabase.from('conversaciones').update({
        ultimo_mensaje: preview,
        ultimo_mensaje_at: new Date().toISOString(),
      }).eq('id', selectedConv.id);

      // Incrementar no_leidos_clienta
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('no_leidos_clienta')
        .eq('id', selectedConv.id)
        .single();
      if (conv) {
        await supabase.from('conversaciones')
          .update({ no_leidos_clienta: (conv.no_leidos_clienta || 0) + 1 })
          .eq('id', selectedConv.id);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFechaMsg = (fecha) => {
    const hoy = new Date().toDateString();
    const msgDate = new Date(fecha).toDateString();
    if (hoy === msgDate) return 'Hoy';
    const ayer = new Date(Date.now() - 86400000).toDateString();
    if (ayer === msgDate) return 'Ayer';
    return new Date(fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
  };

  const formatTiempo = (fecha) => {
    if (!fecha) return '';
    const hoy = new Date().toDateString();
    const msgDate = new Date(fecha).toDateString();
    if (hoy === msgDate) return formatHora(fecha);
    return new Date(fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
  };

  const totalNoLeidos = conversaciones.reduce((sum, c) => sum + (c.no_leidos_admin || 0), 0);

  const getNombre = (conv) => {
    const u = Array.isArray(conv.usuarios) ? conv.usuarios[0] : conv.usuarios;
    return u?.nombre || u?.email || 'Clienta';
  };

  const getAvatar = (conv) => {
    const u = Array.isArray(conv.usuarios) ? conv.usuarios[0] : conv.usuarios;
    return u?.avatar || '👩';
  };

  // Agrupar mensajes por fecha
  const mensajesAgrupados = mensajes.reduce((acc, msg) => {
    const fecha = formatFechaMsg(msg.created_at);
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(msg);
    return acc;
  }, {});

  return (
    <>
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.topbarTitle}>
            Mensajes
            {totalNoLeidos > 0 && (
              <span style={styles.totalBadge}>{totalNoLeidos}</span>
            )}
          </h1>
          <p style={styles.topbarSub}>
            {conversaciones.length} conversacion{conversaciones.length !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      <div style={styles.chatLayout}>
        {/* Lista de conversaciones */}
        <div style={styles.convList}>
          {loading ? (
            <p style={styles.loadingText}>Cargando...</p>
          ) : conversaciones.length === 0 ? (
            <div style={styles.emptyConvs}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              <p style={styles.emptyText}>No hay mensajes todavia</p>
              <p style={styles.emptySub}>Cuando una clienta te escriba, aparecera aqui</p>
            </div>
          ) : (
            conversaciones.map(conv => {
              const isActive = selectedConv?.id === conv.id;
              const noLeidos = conv.no_leidos_admin || 0;
              return (
                <div
                  key={conv.id}
                  style={{
                    ...styles.convItem,
                    ...(isActive ? styles.convItemActive : {}),
                    ...(noLeidos > 0 ? { borderLeft: `3px solid ${colors.gold}` } : {}),
                  }}
                  onClick={() => setSelectedConv(conv)}
                >
                  <div style={styles.convAvatar}>{getAvatar(conv)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.convHeader}>
                      <span style={{ ...styles.convName, fontWeight: noLeidos > 0 ? 700 : 500 }}>
                        {getNombre(conv)}
                      </span>
                      <span style={styles.convTime}>{formatTiempo(conv.ultimo_mensaje_at)}</span>
                    </div>
                    <div style={styles.convPreview}>
                      <span style={{
                        ...styles.convLastMsg,
                        fontWeight: noLeidos > 0 ? 600 : 400,
                        color: noLeidos > 0 ? colors.sageDark : 'rgba(61,92,65,0.6)',
                      }}>
                        {conv.ultimo_mensaje || 'Sin mensajes'}
                      </span>
                      {noLeidos > 0 && (
                        <span style={styles.convBadge}>{noLeidos}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Area de chat */}
        <div style={styles.chatArea}>
          {!selectedConv ? (
            <div style={styles.noChatSelected}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={styles.noChatTitle}>Selecciona una conversacion</p>
              <p style={styles.noChatSub}>Elige una clienta de la lista para ver sus mensajes</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderAvatar}>{getAvatar(selectedConv)}</div>
                <div>
                  <div style={styles.chatHeaderName}>{getNombre(selectedConv)}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={styles.chatMessages}>
                {loadingMensajes ? (
                  <p style={styles.loadingText}>Cargando mensajes...</p>
                ) : mensajes.length === 0 ? (
                  <div style={styles.emptyMessages}>
                    <p>No hay mensajes en esta conversacion</p>
                  </div>
                ) : (
                  Object.entries(mensajesAgrupados).map(([fecha, msgs]) => (
                    <div key={fecha}>
                      <div style={styles.dateSep}>
                        <span style={styles.dateLabel}>{fecha}</span>
                      </div>
                      {msgs.map(msg => {
                        const esAdmin = msg.remitente_id === adminId;
                        return (
                          <div key={msg.id} style={{ ...styles.msgRow, justifyContent: esAdmin ? 'flex-end' : 'flex-start' }}>
                            <div style={{ ...styles.msgBubble, ...(esAdmin ? styles.msgAdmin : styles.msgClienta) }}>
                              {msg.media_url && msg.tipo === 'imagen' && (
                                <img
                                  src={msg.media_url}
                                  alt="Foto"
                                  style={styles.msgMedia}
                                  onClick={() => window.open(msg.media_url, '_blank')}
                                />
                              )}
                              {msg.media_url && msg.tipo === 'video' && (
                                <video
                                  src={msg.media_url}
                                  controls
                                  style={styles.msgMedia}
                                  preload="metadata"
                                />
                              )}
                              {msg.tipo === 'texto' && (
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-word', color: esAdmin ? 'white' : colors.sageDark }}>
                                  {msg.contenido}
                                </p>
                              )}
                              <div style={{ fontSize: '0.75rem', marginTop: 4, textAlign: 'right', color: esAdmin ? 'rgba(255,255,255,0.6)' : 'rgba(61,92,65,0.4)' }}>
                                {formatHora(msg.created_at)}
                                {esAdmin && <span style={{ marginLeft: 4 }}>{msg.leido ? '✓✓' : '✓'}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              {peerTyping && (
                <div style={styles.typingIndicator}>
                  <span style={styles.typingDot}>●</span>
                  <span style={styles.typingText}>Escribiendo...</span>
                </div>
              )}

              {/* Input */}
              <div style={styles.chatInput}>
                {subiendo && (
                  <div style={styles.uploadBanner}>Subiendo archivo...</div>
                )}

                {/* Menu de respuestas rapidas */}
                {showRespuestas && (
                  <div style={styles.respuestasMenu}>
                    {RESPUESTAS_RAPIDAS.map((resp, i) => (
                      <button
                        key={i}
                        style={styles.respuestaItem}
                        onClick={() => {
                          setNuevoMensaje(resp);
                          setShowRespuestas(false);
                        }}
                      >
                        {resp}
                      </button>
                    ))}
                  </div>
                )}

                <div style={styles.inputRow}>
                  <button
                    style={styles.attachBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendo}
                    title="Adjuntar foto o video"
                  >
                    📎
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <button
                    style={{
                      ...styles.quickReplyBtn,
                      background: showRespuestas ? colors.gold : colors.cream,
                      color: showRespuestas ? 'white' : colors.gold,
                    }}
                    onClick={() => setShowRespuestas(!showRespuestas)}
                    title="Respuestas rapidas"
                  >
                    ⚡
                  </button>
                  <input
                    type="text"
                    placeholder="Escribe tu respuesta..."
                    style={styles.textInput}
                    value={nuevoMensaje}
                    onChange={(e) => {
                      setNuevoMensaje(e.target.value);
                      sendTypingBroadcast();
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar(); } }}
                    disabled={enviando}
                  />
                  <button
                    style={{ ...styles.sendBtn, opacity: !nuevoMensaje.trim() || enviando ? 0.5 : 1 }}
                    onClick={handleEnviar}
                    disabled={!nuevoMensaje.trim() || enviando}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  topbarTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.sageDark,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  topbarSub: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.85rem',
    color: colors.sageDark,
    opacity: 0.6,
    margin: '0.25rem 0 0',
  },
  totalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    background: colors.orange,
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: "'Jost', sans-serif",
    padding: '0 6px',
  },
  chatLayout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '1.5rem',
    height: 'calc(100vh - 140px)',
  },
  convList: {
    background: 'white',
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflowY: 'auto',
    padding: '0.5rem',
  },
  convItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s',
    borderLeft: '3px solid transparent',
    marginBottom: 2,
  },
  convItemActive: {
    background: colors.cream,
    borderLeft: `3px solid ${colors.sage}`,
  },
  convAvatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },
  convHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  convName: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    color: colors.sageDark,
  },
  convTime: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.75rem',
    color: colors.sageDark,
    opacity: 0.5,
  },
  convPreview: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convLastMsg: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.82rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '180px',
  },
  convBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    background: colors.gold,
    color: 'white',
    fontSize: '0.72rem',
    fontWeight: 700,
    fontFamily: "'Jost', sans-serif",
  },
  chatArea: {
    background: 'white',
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  noChatSelected: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  noChatTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: '1.1rem',
    color: colors.sageDark,
    fontWeight: 600,
    margin: 0,
  },
  noChatSub: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.85rem',
    color: colors.sageDark,
    opacity: 0.5,
    margin: '0.25rem 0 0',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    borderBottom: `1px solid ${colors.cream}`,
    background: 'white',
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: colors.cream,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
  },
  chatHeaderName: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '1rem',
    fontWeight: 600,
    color: colors.sageDark,
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    background: colors.cream,
  },
  loadingText: {
    fontFamily: "'Jost', sans-serif",
    color: colors.sageDark,
    opacity: 0.6,
    textAlign: 'center',
    padding: '2rem',
  },
  emptyConvs: {
    textAlign: 'center',
    padding: '3rem 1rem',
  },
  emptyText: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    color: colors.sageDark,
    fontWeight: 600,
    margin: 0,
  },
  emptySub: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.8rem',
    color: colors.sageDark,
    opacity: 0.5,
    margin: '0.25rem 0 0',
  },
  emptyMessages: {
    textAlign: 'center',
    padding: '3rem',
    fontFamily: "'Jost', sans-serif",
    color: colors.sageDark,
    opacity: 0.5,
    fontSize: '0.9rem',
  },
  dateSep: {
    textAlign: 'center',
    margin: '12px 0',
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: colors.sageDark,
    opacity: 0.5,
    background: 'rgba(255,255,255,0.7)',
    padding: '3px 10px',
    borderRadius: 10,
    fontFamily: "'Jost', sans-serif",
  },
  msgRow: {
    display: 'flex',
    marginBottom: 8,
  },
  msgBubble: {
    maxWidth: '65%',
    padding: '10px 14px',
    borderRadius: 16,
  },
  msgAdmin: {
    background: colors.sageDark,
    borderBottomRightRadius: 4,
    color: 'white',
  },
  msgClienta: {
    background: 'white',
    borderBottomLeftRadius: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  msgMedia: {
    maxWidth: '100%',
    maxHeight: 300,
    borderRadius: 10,
    marginBottom: 6,
    cursor: 'pointer',
    display: 'block',
  },
  chatInput: {
    padding: '0.75rem 1rem',
    borderTop: `1px solid ${colors.cream}`,
    background: 'white',
  },
  uploadBanner: {
    padding: '6px',
    background: '#fff4e6',
    borderRadius: 8,
    fontSize: '0.8rem',
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: "'Jost', sans-serif",
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: colors.cream,
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    padding: '0.65rem 1rem',
    borderRadius: 20,
    border: `1px solid rgba(61,92,65,0.2)`,
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    background: colors.cream,
  },
  sendBtn: {
    padding: '0.65rem 1.25rem',
    borderRadius: 14,
    border: 'none',
    background: colors.sage,
    color: 'white',
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    flexShrink: 0,
  },
  quickReplyBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  respuestasMenu: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    background: colors.cream,
    borderRadius: 12,
    animation: 'fadeIn 0.15s ease',
  },
  respuestaItem: {
    padding: '0.45rem 0.85rem',
    borderRadius: 16,
    border: `1px solid rgba(61,92,65,0.15)`,
    background: 'white',
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.82rem',
    color: colors.sageDark,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.35rem 1.25rem',
    background: 'white',
  },
  typingDot: {
    color: colors.sage,
    fontSize: '0.7rem',
    animation: 'pulse 1s infinite',
  },
  typingText: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '0.8rem',
    color: colors.sage,
    fontStyle: 'italic',
  },
};
