import { useState, useEffect } from 'react'
import { supabase, getUsuarioActual, iniciarSesion, cerrarSesion } from './supabaseClient'
import VistaOperaria from './pages/VistaOperaria'
import VistaLider from './pages/VistaLider'

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await iniciarSesion(email, password)
      onLogin()
    } catch (err) {
      setError('Email o contraseña incorrectos')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎀</div>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Sistema de producción</h1>
        <p style={{ color: '#888', fontSize: 14, margin: '4px 0 0' }}>Moños policía Colombia</p>
      </div>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box'
            }}
          />
        </div>
        {error && (
          <p style={{ color: '#A32D2D', fontSize: 13, margin: '0 0 12px' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: 12, borderRadius: 10, border: 'none',
            background: loading ? '#aaa' : '#378ADD', color: '#fff',
            fontSize: 15, fontWeight: 500, cursor: loading ? 'default' : 'pointer'
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  async function cargarUsuario() {
    const u = await getUsuarioActual()
    setUsuario(u)
    setLoading(false)
  }

  useEffect(() => {
    cargarUsuario()
    const { data: listener } = supabase.auth.onAuthStateChange(() => cargarUsuario())
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 15 }}>
        Cargando...
      </div>
    )
  }

  if (!usuario) {
    return <LoginForm onLogin={cargarUsuario} />
  }

  return (
    <div>
      <div style={{
        borderBottom: '1px solid #e0e0db', padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fff'
      }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>🎀 Moños policía</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{usuario.nombre}</span>
          <button
            onClick={cerrarSesion}
            style={{
              fontSize: 12, color: '#888', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 8px'
            }}
          >
            Salir
          </button>
        </div>
      </div>

      {usuario.rol === 'lider'
        ? <VistaLider usuario={usuario} />
        : <VistaOperaria usuario={usuario} />
      }
    </div>
  )
}
