import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../hooks/usePresence';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

export default function Chat() {
  const { perfil } = useAuth();
  const userId = perfil?.id;

  const [conversacionId, setConversacionId] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [anaTyping, setAnaTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const adminIdRef = useRef(null);
  const { isOnline } = usePresence(userId, 'clienta');
  const { isRecording, formattedDuration, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  // Cachear admin ID para push notifications
  useEffect(() => {
    const fetchAdminId = async () => {
      try {
        const { data } = await supabase
          .from('usuarios')
          .select('id')
          .eq('rol', 'admin')
          .limit(1);
        if (data?.length) adminIdRef.current = data[0].id;
      } catch (e) {
        // No critico
      }
    };
    fetchAdminId();
  }, []);

  // Push notification helper (fire-and-forget)
  const notifyAdmin = useCallback((body) => {
    if (!adminIdRef.current) return;
    supabase.functions.invoke('send-push', {
      body: {
        destinatario_id: adminIdRef.current,
        title: perfil?.nombre || 'Clienta',
        body: body.substring(0, 100),
        url: '/admin?tab=mensajes',
      },
    }).catch(() => {});
  }, [perfil?.nombre]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Obtener o crear conversacion
  const initConversacion = useCallback(async () => {
    if (!userId) return;
    try {
      // Buscar conversacion existente
      let { data, error } = await supabase
        .from('conversaciones')
        .select('id')
        .eq('clienta_id', userId)
        .maybeSingle();

      if (error && !error.message.includes('does not exist')) {
        console.error('Error buscando conversacion:', error);
      }

      if (data) {
        setConversacionId(data.id);
        return data.id;
      }

      // Crear nueva conversacion
      const { data: nueva, error: errCrear } = await supabase
        .from('conversaciones')
        .insert({ clienta_id: userId })
        .select('id')
        .single();

      if (errCrear) {
        console.error('Error creando conversacion:', errCrear);
        return null;
      }

      setConversacionId(nueva.id);
      return nueva.id;
    } catch (err) {
      console.error('Error init conversacion:', err);
      return null;
    }
  }, [userId]);

  // Cargar mensajes
  const loadMensajes = useCallback(async (convId) => {
    if (!convId) return;
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

      // Marcar como leidos los mensajes que no son mios
      const noLeidos = (data || []).filter(m => m.remitente_id !== userId && !m.leido);
      if (noLeidos.length > 0) {
        await supabase
          .from('mensajes')
          .update({ leido: true })
          .in('id', noLeidos.map(m => m.id));

        // Resetear contador de no leidos para clienta
        await supabase
          .from('conversaciones')
          .update({ no_leidos_clienta: 0 })
          .eq('id', convId);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, [userId]);

  // Init
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const convId = await initConversacion();
      if (convId) {
        await loadMensajes(convId);
      }
      setLoading(false);
    };
    init();
  }, [initConversacion, loadMensajes]);

  // Realtime subscription
  useEffect(() => {
    if (!conversacionId) return;

    const channel = supabase
      .channel(`chat-${conversacionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `conversacion_id=eq.${conversacionId}`,
      }, (payload) => {
        setMensajes(prev => [...prev, payload.new]);
        // Auto-marcar como leido si es de Ana
        if (payload.new.remitente_id !== userId) {
          supabase.from('mensajes').update({ leido: true }).eq('id', payload.new.id);
          supabase.from('conversaciones').update({ no_leidos_clienta: 0 }).eq('id', conversacionId);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId, userId]);

  // Typing indicator: escuchar cuando Ana escribe
  useEffect(() => {
    if (!conversacionId) return;

    const typingChannel = supabase
      .channel(`typing-${conversacionId}`)
      .on('broadcast', { event: 'user_typing' }, (payload) => {
        // Solo mostrar si es Ana escribiendo (no yo)
        if (payload.payload?.userId !== userId) {
          setAnaTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setAnaTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      setAnaTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(typingChannel);
    };
  }, [conversacionId, userId]);

  // Enviar broadcast de typing al escribir
  const sendTypingBroadcast = useCallback(() => {
    if (!conversacionId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return; // Debounce 2s
    lastTypingSentRef.current = now;
    supabase.channel(`typing-${conversacionId}`).send({
      type: 'broadcast',
      event: 'user_typing',
      payload: { userId },
    }).catch(() => {});
  }, [conversacionId, userId]);

  // Auto-scroll cuando llegan mensajes
  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Enviar mensaje de texto
  const handleEnviar = async () => {
    if (!nuevoMensaje.trim() || !conversacionId || enviando) return;
    setEnviando(true);
    const texto = nuevoMensaje.trim();
    setNuevoMensaje('');

    try {
      const { error } = await supabase.from('mensajes').insert({
        conversacion_id: conversacionId,
        remitente_id: userId,
        tipo: 'texto',
        contenido: texto,
      });

      if (error) {
        console.error('Error enviando:', error);
        setNuevoMensaje(texto); // Restaurar si fallo
        return;
      }

      // Actualizar conversacion
      await supabase.from('conversaciones').update({
        ultimo_mensaje: texto,
        ultimo_mensaje_at: new Date().toISOString(),
        no_leidos_admin: supabase.rpc ? 1 : 1, // Incrementar
      }).eq('id', conversacionId);

      // Incrementar no_leidos_admin manualmente
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('no_leidos_admin')
        .eq('id', conversacionId)
        .single();
      if (conv) {
        await supabase.from('conversaciones')
          .update({ no_leidos_admin: (conv.no_leidos_admin || 0) + 1 })
          .eq('id', conversacionId);
      }

      // Push notification a Ana
      notifyAdmin(texto);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setEnviando(false);
    }
  };

  // Subir archivo (imagen o video)
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !conversacionId) return;

    // Validar tipo
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      alert('Solo puedes enviar imagenes o videos');
      return;
    }

    // Validar tamano (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo es muy grande. Maximo 20MB.');
      return;
    }

    setSubiendo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error subiendo archivo:', uploadError);
        alert('Error subiendo archivo. Intenta de nuevo.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      const mediaUrl = urlData.publicUrl;
      const tipo = isImage ? 'imagen' : 'video';

      const { error } = await supabase.from('mensajes').insert({
        conversacion_id: conversacionId,
        remitente_id: userId,
        tipo: tipo,
        contenido: isImage ? 'Envio una foto' : 'Envio un video',
        media_url: mediaUrl,
        media_type: file.type,
      });

      if (error) {
        console.error('Error guardando mensaje:', error);
        return;
      }

      // Actualizar conversacion
      const preview = isImage ? '📷 Foto' : '🎥 Video';
      await supabase.from('conversaciones').update({
        ultimo_mensaje: preview,
        ultimo_mensaje_at: new Date().toISOString(),
      }).eq('id', conversacionId);

      // Incrementar no_leidos_admin
      const { data: conv } = await supabase
        .from('conversaciones')
        .select('no_leidos_admin')
        .eq('id', conversacionId)
        .single();
      if (conv) {
        await supabase.from('conversaciones')
          .update({ no_leidos_admin: (conv.no_leidos_admin || 0) + 1 })
          .eq('id', conversacionId);
      }

      // Push notification a Ana
      notifyAdmin(isImage ? 'Te envio una foto' : 'Te envio un video');
    } catch (err) {
      console.error('Error:', err);
      alert('Error subiendo archivo');
    } finally {
      setSubiendo(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Busqueda en mensajes
  const searchTimeoutRef = useRef(null);
  const handleSearch = useCallback(async (query) => {
    if (!query.trim() || !conversacionId) { setSearchResults([]); return; }
    try {
      const { data } = await supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', conversacionId)
        .ilike('contenido', `%${query.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      setSearchResults(data || []);
    } catch (err) { console.error('Error buscando:', err); }
  }, [conversacionId]);

  const onSearchChange = useCallback((value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 400);
  }, [handleSearch]);

  // Enviar mensaje de voz
  const handleSendAudio = async () => {
    const blob = await stopRecording();
    if (!blob || !conversacionId) return;

    setSubiendo(true);
    try {
      const fileName = `${userId}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, blob, { contentType: 'audio/webm' });

      if (uploadError) {
        alert('Error subiendo audio');
        return;
      }

      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);

      const { error } = await supabase.from('mensajes').insert({
        conversacion_id: conversacionId,
        remitente_id: userId,
        tipo: 'audio',
        contenido: 'Mensaje de voz',
        media_url: urlData.publicUrl,
        media_type: 'audio/webm',
      });

      if (error) {
        console.error('Error guardando audio:', error);
        return;
      }

      await supabase.from('conversaciones').update({
        ultimo_mensaje: '🎤 Audio',
        ultimo_mensaje_at: new Date().toISOString(),
      }).eq('id', conversacionId);

      const { data: conv } = await supabase
        .from('conversaciones')
        .select('no_leidos_admin')
        .eq('id', conversacionId)
        .single();
      if (conv) {
        await supabase.from('conversaciones')
          .update({ no_leidos_admin: (conv.no_leidos_admin || 0) + 1 })
          .eq('id', conversacionId);
      }

      notifyAdmin('Te envio un audio');
    } catch (err) {
      console.error('Error enviando audio:', err);
    } finally {
      setSubiendo(false);
    }
  };

  const formatHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFecha = (fecha) => {
    const hoy = new Date().toDateString();
    const msgDate = new Date(fecha).toDateString();
    if (hoy === msgDate) return 'Hoy';
    const ayer = new Date(Date.now() - 86400000).toDateString();
    if (ayer === msgDate) return 'Ayer';
    return new Date(fecha).toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
  };

  // Agrupar mensajes por fecha
  const mensajesAgrupados = mensajes.reduce((acc, msg) => {
    const fecha = formatFecha(msg.created_at);
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(msg);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Chat con Ana</h1>
        </div>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerAvatar}>👩‍⚕️</div>
          <div style={{ flex: 1 }}>
            <h1 style={styles.headerTitle}>Ana Karina</h1>
            <p style={styles.headerSub}>
              {adminIdRef.current && isOnline(adminIdRef.current)
                ? <><span style={{ color: '#4ade80' }}>●</span> En linea</>
                : 'Tu nutricionista'}
            </p>
          </div>
          <button
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); setSearchResults([]); }}
          >
            🔍
          </button>
        </div>
        {showSearch && (
          <div style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Buscar en mensajes..."
              style={{ width: '100%', padding: '8px 14px', borderRadius: 20, border: 'none', fontFamily: 'Jost, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div style={{ maxHeight: 150, overflowY: 'auto', marginTop: 6, background: 'white', borderRadius: 12, padding: '4px 0' }}>
                {searchResults.map(msg => (
                  <div
                    key={msg.id}
                    style={{ padding: '6px 12px', fontSize: 12, color: '#3d5c41', cursor: 'pointer', borderBottom: '1px solid #f0ede8', fontFamily: 'Jost, sans-serif' }}
                    onClick={() => {
                      const el = document.getElementById(`cmsg-${msg.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.style.outline = '2px solid #b8956a';
                        setTimeout(() => { el.style.outline = 'none'; }, 2000);
                      }
                      setShowSearch(false);
                    }}
                  >
                    {msg.contenido?.substring(0, 60)}
                    <span style={{ marginLeft: 6, opacity: 0.5 }}>{formatHora(msg.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div style={styles.messagesContainer}>
        {mensajes.length === 0 ? (
          <div style={styles.emptyChat}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
            <p style={styles.emptyTitle}>Habla con Ana</p>
            <p style={styles.emptyText}>
              Enviale mensajes, fotos de tus comidas o videos. Ana los vera en su panel y te respondera.
            </p>
          </div>
        ) : (
          Object.entries(mensajesAgrupados).map(([fecha, msgs]) => (
            <div key={fecha}>
              <div style={styles.fechaSeparator}>
                <span style={styles.fechaLabel}>{fecha}</span>
              </div>
              {msgs.map((msg) => {
                const esMio = msg.remitente_id === userId;
                return (
                  <div key={msg.id} id={`cmsg-${msg.id}`} style={{ ...styles.msgRow, justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                    <div style={{ ...styles.msgBubble, ...(esMio ? styles.msgBubbleMio : styles.msgBubbleAna) }}>
                      {/* Media */}
                      {msg.media_url && msg.tipo === 'imagen' && (
                        <img
                          src={msg.media_url}
                          alt="Foto"
                          style={styles.msgImage}
                          onClick={() => window.open(msg.media_url, '_blank')}
                        />
                      )}
                      {msg.media_url && msg.tipo === 'video' && (
                        <video
                          src={msg.media_url}
                          controls
                          style={styles.msgVideo}
                          preload="metadata"
                        />
                      )}
                      {msg.media_url && msg.tipo === 'audio' && (
                        <audio
                          src={msg.media_url}
                          controls
                          style={{ maxWidth: '100%', height: 40, marginBottom: 6 }}
                          preload="metadata"
                        />
                      )}
                      {/* Texto */}
                      {msg.tipo === 'texto' && (
                        <p style={{ ...styles.msgText, color: esMio ? 'white' : '#3d5c41' }}>
                          {msg.contenido}
                        </p>
                      )}
                      <div style={{ ...styles.msgTime, color: esMio ? 'rgba(255,255,255,0.7)' : 'rgba(61,92,65,0.5)' }}>
                        {formatHora(msg.created_at)}
                        {esMio && (
                          <span style={{ marginLeft: 4 }}>{msg.leido ? '✓✓' : '✓'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        {/* Typing indicator */}
        {anaTyping && (
          <div style={styles.typingRow}>
            <div style={styles.typingBubble}>
              <span style={styles.typingDots}>
                <span style={styles.dot1}>●</span>
                <span style={styles.dot2}>●</span>
                <span style={styles.dot3}>●</span>
              </span>
              <span style={styles.typingLabel}>Ana esta escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        {subiendo && (
          <div style={styles.uploadingBanner}>
            <span>Subiendo archivo...</span>
          </div>
        )}
        {isRecording ? (
          <div style={styles.inputRow}>
            <button style={styles.cancelRecordBtn} onClick={cancelRecording}>✕</button>
            <div style={styles.recordingIndicator}>
              <span style={styles.recordingDot}>●</span>
              <span style={styles.recordingTimer}>{formattedDuration}</span>
            </div>
            <button style={styles.sendBtn} onClick={handleSendAudio}>➤</button>
          </div>
        ) : (
          <div style={styles.inputRow}>
            <button
              style={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendo}
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
            <button style={styles.micBtn} onClick={startRecording} disabled={subiendo}>
              🎤
            </button>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
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
              ➤
            </button>
          </div>
        )}
      </div>

      {/* Spacer para BottomNav */}
      <div style={{ height: 90 }} />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 390,
    margin: '0 auto',
    backgroundColor: '#f8f4ee',
    minHeight: '100vh',
    fontFamily: 'Jost, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'linear-gradient(135deg, #3d5c41, #7a9e7e)',
    padding: '40px 20px 16px',
    borderRadius: '0 0 24px 24px',
    color: 'white',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    margin: 0,
    fontFamily: 'Playfair Display, serif',
    fontWeight: 700,
  },
  headerSub: {
    fontSize: 12,
    margin: 0,
    opacity: 0.85,
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#7a9e7e',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    padding: '12px 16px',
    overflowY: 'auto',
    minHeight: 'calc(100vh - 240px)',
  },
  emptyChat: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#3d5c41',
    margin: '0 0 8px',
    fontFamily: 'Playfair Display, serif',
  },
  emptyText: {
    fontSize: 14,
    color: '#7a9e7e',
    lineHeight: 1.5,
    margin: 0,
  },
  fechaSeparator: {
    textAlign: 'center',
    margin: '16px 0 12px',
  },
  fechaLabel: {
    fontSize: 12,
    color: '#7a9e7e',
    background: '#eae5dd',
    padding: '4px 12px',
    borderRadius: 12,
    fontWeight: 500,
  },
  msgRow: {
    display: 'flex',
    marginBottom: 8,
  },
  msgBubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: 18,
    position: 'relative',
  },
  msgBubbleMio: {
    backgroundColor: '#3d5c41',
    borderBottomRightRadius: 4,
  },
  msgBubbleAna: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  msgText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  msgImage: {
    maxWidth: '100%',
    borderRadius: 12,
    marginBottom: 6,
    cursor: 'pointer',
    display: 'block',
  },
  msgVideo: {
    maxWidth: '100%',
    borderRadius: 12,
    marginBottom: 6,
    display: 'block',
  },
  msgTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  inputArea: {
    position: 'fixed',
    bottom: 90,
    left: 0,
    right: 0,
    maxWidth: 390,
    margin: '0 auto',
    background: 'white',
    borderTop: '1px solid rgba(61,92,65,0.1)',
    padding: '8px 12px',
    zIndex: 50,
  },
  uploadingBanner: {
    padding: '6px 12px',
    background: '#fff4e6',
    borderRadius: 8,
    fontSize: 12,
    color: '#b8956a',
    textAlign: 'center',
    marginBottom: 6,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#f8f4ee',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 24,
    border: '1px solid rgba(61,92,65,0.2)',
    fontFamily: 'Jost, sans-serif',
    fontSize: 14,
    outline: 'none',
    background: '#f8f4ee',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#3d5c41',
    color: 'white',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typingRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    backgroundColor: 'white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  typingDots: {
    display: 'flex',
    gap: 2,
    fontSize: 10,
    color: '#7a9e7e',
  },
  dot1: { animation: 'pulse 1.2s infinite 0s' },
  dot2: { animation: 'pulse 1.2s infinite 0.2s' },
  dot3: { animation: 'pulse 1.2s infinite 0.4s' },
  typingLabel: {
    fontSize: 12,
    color: '#7a9e7e',
    fontStyle: 'italic',
    fontFamily: 'Jost, sans-serif',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#f8f4ee',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cancelRecordBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    background: '#fde8e8',
    color: '#c4762a',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recordingIndicator: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 24,
    background: '#fde8e8',
  },
  recordingDot: {
    color: '#e53e3e',
    fontSize: 12,
    animation: 'pulse 1s infinite',
  },
  recordingTimer: {
    fontFamily: 'Jost, sans-serif',
    fontSize: 14,
    fontWeight: 600,
    color: '#e53e3e',
  },
};
