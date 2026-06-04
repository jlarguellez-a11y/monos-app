// src/pages/GestionProductos.jsx
// Vista para que el líder agregue y administre productos del catálogo

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TIPOS = ['mono', 'bamba']
const VARIANTES = {
  mono:  ['reglamentario', 'decorado'],
  bamba: ['sencilla', 'decorada'],
}

export default function GestionProductos({ onVolver }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const [form, setForm] = useState({ nombre: '', tipo: 'mono', variante: 'reglamentario', descripcion: '', precio_unit: '' })

  async function cargarProductos() {
    const { data } = await supabase.from('productos').select('*').order('tipo').order('nombre')
    setProductos(data || [])
    setLoading(false)
  }

  useEffect(() => { cargarProductos() }, [])

  function actualizarForm(campo, valor) {
    const nuevo = { ...form, [campo]: valor }
    // Si cambia el tipo, resetear variante a la primera opción disponible
    if (campo === 'tipo') nuevo.variante = VARIANTES[valor][0]
    setForm(nuevo)
  }

  async function guardarProducto() {
    if (!form.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre del producto es obligatorio' })
      return
    }
    setGuardando(true)
    setMensaje(null)
    try {
      const { error } = await supabase.from('productos').insert({
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        variante: form.variante,
        descripcion: form.descripcion.trim() || null,
        precio_unit: form.precio_unit ? parseFloat(form.precio_unit) : 0,
        activo: true
      })
      if (error) throw error
      setMensaje({ tipo: 'exito', texto: `Producto "${form.nombre}" agregado correctamente` })
      setForm({ nombre: '', tipo: 'mono', variante: 'reglamentario', descripcion: '', precio_unit: '' })
      setMostrarForm(false)
      cargarProductos()
    } catch (e) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar el producto' })
    }
    setGuardando(false)
  }

  async function toggleActivo(producto) {
    await supabase.from('productos').update({ activo: !producto.activo }).eq('id', producto.id)
    cargarProductos()
  }

  const TIPO_CONFIG = {
    mono:  { label: 'Moño',  bg: '#E6F1FB', color: '#0C447C' },
    bamba: { label: 'Bamba', bg: '#FAEEDA', color: '#633806' },
  }

  const VARIANTE_CONFIG = {
    reglamentario: { label: 'Reglamentario', bg: '#EAF3DE', color: '#27500A' },
    decorado:      { label: 'Decorado',       bg: '#EEEDFE', color: '#3C3489' },
    sencilla:      { label: 'Sencilla',       bg: '#EAF3DE', color: '#27500A' },
    decorada:      { label: 'Decorada',       bg: '#EEEDFE', color: '#3C3489' },
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 40px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver}
            style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}>
            ← Volver
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Catálogo de productos</h2>
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); setMensaje(null) }}
          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: mostrarForm ? '#f0efea' : '#378ADD', color: mostrarForm ? '#555' : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          {mostrarForm ? 'Cancelar' : '+ Nuevo producto'}
        </button>
      </div>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: mensaje.tipo === 'exito' ? '#EAF3DE' : '#FCEBEB', color: mensaje.tipo === 'exito' ? '#27500A' : '#791F1F' }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario nuevo producto */}
      {mostrarForm && (
        <div style={{ background: '#fff', border: '1.5px solid #378ADD', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: '#0C447C' }}>Nuevo producto</div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Nombre del producto *</label>
            <input style={s.input} placeholder="Ej: Moño decorado mariposa"
              value={form.nombre} onChange={e => actualizarForm('nombre', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={s.label}>Tipo *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TIPOS.map(t => (
                  <button key={t} onClick={() => actualizarForm('tipo', t)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: form.tipo === t ? '1.5px solid #378ADD' : '0.5px solid #ddd', background: form.tipo === t ? '#E6F1FB' : '#fff', color: form.tipo === t ? '#0C447C' : '#666', fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t === 'mono' ? 'Moño' : 'Bamba'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={s.label}>Variante *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {VARIANTES[form.tipo].map(v => (
                  <button key={v} onClick={() => actualizarForm('variante', v)}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: form.variante === v ? '1.5px solid #378ADD' : '0.5px solid #ddd', background: form.variante === v ? '#E6F1FB' : '#fff', color: form.variante === v ? '#0C447C' : '#666', fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={s.label}>Descripción (opcional)</label>
              <input style={s.input} placeholder="Ej: Con flor de tela bordada"
                value={form.descripcion} onChange={e => actualizarForm('descripcion', e.target.value)} />
            </div>
            <div>
              <label style={s.label}>Precio unitario</label>
              <input type="number" min="0" style={s.input} placeholder="0"
                value={form.precio_unit} onChange={e => actualizarForm('precio_unit', e.target.value)} />
            </div>
          </div>

          {/* Vista previa */}
          <div style={{ background: '#f5f5f3', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#555' }}>
            <span style={{ fontWeight: 500 }}>Vista previa: </span>
            <span>{form.nombre || 'Nombre del producto'} </span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: TIPO_CONFIG[form.tipo]?.bg, color: TIPO_CONFIG[form.tipo]?.color, marginRight: 4 }}>
              {TIPO_CONFIG[form.tipo]?.label}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: VARIANTE_CONFIG[form.variante]?.bg, color: VARIANTE_CONFIG[form.variante]?.color }}>
              {VARIANTE_CONFIG[form.variante]?.label}
            </span>
          </div>

          <button onClick={guardarProducto} disabled={guardando}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: guardando ? '#aaa' : '#378ADD', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            {guardando ? 'Guardando...' : 'Agregar producto al catálogo'}
          </button>
        </div>
      )}

      {/* Lista de productos existentes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>Cargando...</div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            {productos.filter(p => p.activo).length} productos activos · {productos.filter(p => !p.activo).length} inactivos
          </div>
          {productos.map(p => {
            const tc = TIPO_CONFIG[p.tipo]
            const vc = VARIANTE_CONFIG[p.variante]
            return (
              <div key={p.id} style={{ background: p.activo ? '#fff' : '#f8f8f6', border: '0.5px solid #e0e0db', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: p.activo ? 1 : 0.6 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: p.activo ? '#222' : '#999' }}>{p.nombre}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: tc?.bg, color: tc?.color }}>{tc?.label}</span>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: vc?.bg, color: vc?.color, textTransform: 'capitalize' }}>{p.variante}</span>
                    {p.descripcion && <span style={{ fontSize: 11, color: '#aaa' }}>{p.descripcion}</span>}
                  </div>
                </div>
                <button onClick={() => toggleActivo(p)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '0.5px solid #ddd', background: p.activo ? '#FCEBEB' : '#EAF3DE', color: p.activo ? '#791F1F' : '#27500A', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {p.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s = {
  label: { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', background: '#fff' }
}
