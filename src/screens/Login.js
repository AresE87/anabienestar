import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const colors = {
  cream: '#f8f4ee',
  sage: '#7a9e7e',
  sageDark: '#3d5c41',
  gold: '#b8956a',
};

// SVG icons inline para no agregar dependencias
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

export default function Login({ onLoginError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null); // 'google' | 'apple' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresa tu email y contrasena.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        const msg = authError.message || '';
        if (msg.includes('Invalid login')) {
          setError('Email o contrasena incorrectos. Revisa los datos e intenta de nuevo.');
        } else if (msg.includes('Email not confirmed')) {
          setError('Tu cuenta aun no fue confirmada. Revisa tu correo.');
        } else {
          setError('No pudimos iniciar sesion. Intenta de nuevo.');
        }
        if (typeof onLoginError === 'function') onLoginError(authError);
      }
    } catch (err) {
      setError('Error de conexion. Verifica tu internet e intenta de nuevo.');
      if (typeof onLoginError === 'function') onLoginError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError('');
    setOauthLoading(provider);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (oauthError) {
        setError('Error al conectar con ' + (provider === 'google' ? 'Google' : 'Apple') + '. Intenta de nuevo.');
        setOauthLoading(null);
      }
      // Si no hay error, el navegador redirige al provider
    } catch (err) {
      setError('Error de conexion. Verifica tu internet.');
      setOauthLoading(null);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.cream,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: "'Jost', sans-serif",
    },
    box: {
      width: '100%',
      maxWidth: 340,
      background: 'white',
      borderRadius: 16,
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(61, 92, 65, 0.1)',
    },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontStyle: 'italic',
      fontSize: '1.5rem',
      fontWeight: 600,
      color: colors.sageDark,
      textAlign: 'center',
      marginBottom: '2rem',
    },
    input: {
      width: '100%',
      padding: '0.85rem 1rem',
      marginBottom: '1rem',
      border: '1px solid rgba(61, 92, 65, 0.25)',
      borderRadius: 10,
      fontSize: '1rem',
      boxSizing: 'border-box',
      fontFamily: "'Jost', sans-serif",
    },
    button: {
      width: '100%',
      padding: '0.85rem',
      marginTop: '0.5rem',
      background: colors.sageDark,
      color: 'white',
      border: 'none',
      borderRadius: 10,
      fontSize: '1rem',
      fontWeight: 600,
      fontFamily: "'Jost', sans-serif",
      cursor: 'pointer',
    },
    error: {
      color: '#b55454',
      fontSize: '0.9rem',
      marginBottom: '1rem',
      textAlign: 'center',
    },
    // OAuth styles
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '1.5rem 0',
      gap: '0.75rem',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      background: 'rgba(61, 92, 65, 0.15)',
    },
    dividerText: {
      fontSize: '0.8rem',
      color: colors.sage,
      whiteSpace: 'nowrap',
    },
    oauthBtn: {
      width: '100%',
      padding: '0.75rem 1rem',
      border: '1.5px solid rgba(61, 92, 65, 0.2)',
      borderRadius: 10,
      fontSize: '0.95rem',
      fontWeight: 500,
      fontFamily: "'Jost', sans-serif",
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.6rem',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
    },
    googleBtn: {
      background: 'white',
      color: '#3c4043',
      marginBottom: '0.75rem',
    },
    appleBtn: {
      background: '#000',
      color: '#fff',
      borderColor: '#000',
    },
  };

  const isDisabled = loading || oauthLoading;

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.logo}>AnabienestarIntegral</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            autoComplete="email"
            disabled={isDisabled}
          />
          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
            disabled={isDisabled}
          />
          {error ? <p style={styles.error}>{error}</p> : null}
          <button type="submit" style={styles.button} disabled={isDisabled}>
            {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>o continuar con</span>
          <div style={styles.dividerLine} />
        </div>

        {/* OAuth buttons */}
        <button
          onClick={() => handleOAuth('google')}
          disabled={isDisabled}
          style={{ ...styles.oauthBtn, ...styles.googleBtn, opacity: isDisabled ? 0.6 : 1 }}
        >
          <GoogleIcon />
          {oauthLoading === 'google' ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <button
          onClick={() => handleOAuth('apple')}
          disabled={isDisabled}
          style={{ ...styles.oauthBtn, ...styles.appleBtn, opacity: isDisabled ? 0.6 : 1 }}
        >
          <AppleIcon />
          {oauthLoading === 'apple' ? 'Conectando...' : 'Continuar con Apple'}
        </button>
      </div>
    </div>
  );
}
