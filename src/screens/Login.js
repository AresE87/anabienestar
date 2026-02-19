import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const colors = {
  cream: '#f8f4ee',
  sage: '#7a9e7e',
  sageDark: '#3d5c41',
  gold: '#b8956a',
};

export default function Login({ onLoginError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresá tu email y contraseña.');
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
          setError('Email o contraseña incorrectos. Revisá los datos e intentá de nuevo.');
        } else if (msg.includes('Email not confirmed')) {
          setError('Tu cuenta aún no fue confirmada. Revisá tu correo.');
        } else {
          setError('No pudimos iniciar sesión. Intentá de nuevo.');
        }
        if (typeof onLoginError === 'function') onLoginError(authError);
      }
    } catch (err) {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.');
      if (typeof onLoginError === 'function') onLoginError(err);
    } finally {
      setLoading(false);
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
      border: `1px solid rgba(61, 92, 65, 0.25)`,
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
  };

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
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            autoComplete="current-password"
            disabled={loading}
          />
          {error ? <p style={styles.error}>{error}</p> : null}
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
