// src/pages/GestionProductos.jsx — VERSION 2
// - Campo de referencia en el formulario
// - Edición de productos existentes

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TIPOS = ['mono', 'bamba', 'malla']
const VARIANTES = {
  mono:  ['reglamentario', 'decorado', 'surtido'],
  bamba: ['sencilla', 'decorada'],
  malla: ['reglamentaria', 'decorada', 'tull'],
}

const TIPO_CONFIG = {
  mono:  { label: 'Moño',  bg: '#E6F1FB', color: '#0C447C' },
  bamba: { label: 'Bamba', bg: '#FAEEDA', color: '#633806' },
  malla: { label: 'Malla', bg: '#EAF3DE', color: '#27500A' },
}

const VARIANTE_LABELS = {
  reglamentario: 'Reglamentario',
  decorado:      'Decorado',
  surtido:       'Surtido',
  sencilla:      'Sencilla',
  decorada:      'Decorada',
  reglamentaria: 'Reglamentaria',
  tull:          'Tull',
}

const FORM_VACIO = { referencia: '', nombre: '', tipo: 'mono', variante: 'reglamentario', descripcion: '', precio_unit: '' }

export default function GestionProductos({ onVolver }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null) // id del producto en edición
  const [form, setForm] = useState(FORM_VACIO)
  const [busqueda, setBusqueda] = useState('')

  async function cargarProductos() {
    const { data } = await supabase.from('productos').select('*').order('tipo').order('nombre')
    setProductos(data || [])
    setLoading(false)
  }

  useEffect(() => { cargarProductos() }, [])

  function actualizarForm(campo, valor) {
    const nuevo = { ...form, [campo]: valor }
    if (campo === 'tipo') nuevo.variante = VARIANTES[valor][0]
    setForm(nuevo)
  }

  function iniciarEdicion(producto) {
    setEditando(producto.id)
    setForm({
      referencia: producto.referencia || '',
      nombre: producto.nombre,
      tipo: producto.tipo,
      variante: producto.variante,
      descripcion: producto.descripcion || '',
      precio_unit: producto.precio_unit || ''
    })
    setMostrarForm(false)
    setMensaje(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelarEdicion() {
    setEditando(null)
    setForm(FORM_VACIO)
    setMensaje(null)
  }

  async function guardarProducto() {
    if (!form.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre del producto es obligatorio' })
      return
    }
    if (!form.referencia.trim()) {
      setMensaje({ tipo: 'error', texto: 'La referencia es obligatoria' })
      return
    }
    setGuardando(true)
    setMensaje(null)

    const datos = {
      referencia:   form.referencia.trim().toUpperCase(),
      nombre:       form.nombre.trim(),
      tipo:         form.tipo,
      variante:     form.variante,
      descripcion:  form.descripcion.trim() || null,
      precio_unit:  form.precio_unit ? parseFloat(form.precio_unit) : 0,
    }

    try {
      if (editando) {
        const { error } = await supabase.from('productos').update(datos).eq('id', editando)
        if (error) throw error
        setMensaje({ tipo: 'exito', texto: `Producto "${form.nombre}" actualizado correctamente` })
        setEditando(null)
      } else {
        const { error } = await supabase.from('productos').insert({ ...datos, activo: true })
        if (error) throw error
        setMensaje({ tipo: 'exito', texto: `Producto "${form.nombre}" agregado correctamente` })
        setMostrarForm(false)
      }
      setForm(FORM_VACIO)
      cargarProductos()
    } catch (e) {
      console.error(e)
      setMensaje({ tipo: 'error', texto: e.message?.includes('unique') ? 'Esa referencia ya existe' : 'Error al guardar el producto' })
    }
    setGuardando(false)
  }

  async function toggleActivo(producto) {
    await supabase.from('productos').update({ activo: !producto.activo }).eq('id', producto.id)
    cargarProductos()
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.referencia || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const formulario = (titulo) => (
    <div style={{ background: '#fff', border: `1.5px solid ${editando ? '#639922' : '#378ADD'}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: editando ? '#27500A' : '#0C447C' }}>{titulo}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={s.label}>Referencia *</label>
          <input style={s.input} placeholder="Ej: MO01"
            value={form.referencia} onChange={e => actualizarForm('referencia', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label style={s.label}>Nombre del producto *</label>
          <input style={s.input} placeholder="Ej: Moño Reglamentario"
            value={form.nombre} onChange={e => actualizarForm('nombre', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={s.label}>Tipo *</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {TIPOS.map(t => (
              <button key={t} onClick={() => actualizarForm('tipo', t)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: form.tipo === t ? '1.5px solid #378ADD' : '0.5px solid #ddd', background: form.tipo === t ? '#E6F1FB' : '#fff', color: form.tipo === t ? '#0C447C' : '#666', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {TIPO_CONFIG[t].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={s.label}>Variante *</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {VARIANTES[form.tipo].map(v => (
              <button key={v} onClick={() => actualizarForm('variante', v)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: form.variante === v ? '1.5px solid #378ADD' : '0.5px solid #ddd', background: form.variante === v ? '#E6F1FB' : '#fff', color: form.variante === v ? '#0C447C' : '#666', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {VARIANTE_LABELS[v]}
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
          <label style={s.label}>Precio unitario ($)</label>
          <input type="number" min="0" style={s.input} placeholder="0"
            value={form.precio_unit} onChange={e => actualizarForm('precio_unit', e.target.value)} />
        </div>
      </div>

      {/* Vista previa */}
      <div style={{ background: '#f5f5f3', borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontSize: 12, color: '#555', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 500 }}>Vista previa:</span>
        <span style={{ fontFamily: 'monospace', background: '#e8e8e3', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{form.referencia || 'REF'}</span>
        <span>{form.nombre || 'Nombre'}</span>
        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: TIPO_CONFIG[form.tipo]?.bg, color: TIPO_CONFIG[form.tipo]?.color }}>{TIPO_CONFIG[form.tipo]?.label}</span>
        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: '#EEEDFE', color: '#3C3489' }}>{VARIANTE_LABELS[form.variante]}</span>
        {form.precio_unit && <span style={{ color: '#639922', fontWeight: 500 }}>${Number(form.precio_unit).toLocaleString('es-CO')}</span>}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={editando ? cancelarEdicion : () => { setMostrarForm(false); setForm(FORM_VACIO) }}
          style={{ flex: 1, padding: 11, borderRadius: 10, border: '0.5px solid #ddd', background: '#f5f5f3', color: '#555', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={guardarProducto} disabled={guardando}
          style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: guardando ? '#aaa' : (editando ? '#639922' : '#378ADD'), color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar al catálogo'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px 40px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver}
            style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}>
            ← Volver
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Catálogo de productos</h2>
        </div>
        {!editando && (
          <button onClick={() => { setMostrarForm(!mostrarForm); setMensaje(null) }}
            style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: mostrarForm ? '#f0efea' : '#378ADD', color: mostrarForm ? '#555' : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {mostrarForm ? 'Cancelar' : '+ Nuevo producto'}
          </button>
        )}
      </div>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: mensaje.tipo === 'exito' ? '#EAF3DE' : '#FCEBEB', color: mensaje.tipo === 'exito' ? '#27500A' : '#791F1F' }}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario nuevo o edición */}
      {editando && formulario('Editar producto')}
      {!editando && mostrarForm && formulario('Nuevo producto')}

      {/* Buscador */}
      {!editando && (
        <input style={{ ...s.input, marginBottom: 12 }} placeholder="Buscar por nombre o referencia..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      )}

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>Cargando...</div>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
            {productosFiltrados.filter(p => p.activo).length} activos · {productosFiltrados.filter(p => !p.activo).length} inactivos
          </div>
          {productosFiltrados.map(p => {
            const tc = TIPO_CONFIG[p.tipo]
            const esEditando = editando === p.id
            return (
              <div key={p.id} style={{ background: esEditando ? '#F0FFF4' : (p.activo ? '#fff' : '#f8f8f6'), border: esEditando ? '1.5px solid #639922' : '0.5px solid #e0e0db', borderRadius: 10, padding: '11px 14px', marginBottom: 8, opacity: p.activo ? 1 : 0.55 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f0efea', borderRadius: 4, padding: '1px 7px', color: '#555', flexShrink: 0 }}>
                        {p.referencia || '—'}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: p.activo ? '#222' : '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nombre}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: tc?.bg, color: tc?.color }}>{tc?.label}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489' }}>{VARIANTE_LABELS[p.variante] || p.variante}</span>
                      {p.descripcion && <span style={{ fontSize: 11, color: '#aaa' }}>{p.descripcion}</span>}
                      {p.precio_unit > 0 && <span style={{ fontSize: 11, color: '#639922', fontWeight: 500 }}>${Number(p.precio_unit).toLocaleString('es-CO')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    {!editando && (
                      <button onClick={() => iniciarEdicion(p)}
                        style={{ padding: '5px 11px', borderRadius: 8, border: '0.5px solid #ddd', background: '#f5f5f3', color: '#555', fontSize: 12, cursor: 'pointer' }}>
                        ✏️ Editar
                      </button>
                    )}
                    <button onClick={() => toggleActivo(p)}
                      style={{ padding: '5px 11px', borderRadius: 8, border: '0.5px solid #ddd', background: p.activo ? '#FCEBEB' : '#EAF3DE', color: p.activo ? '#791F1F' : '#27500A', fontSize: 12, cursor: 'pointer' }}>
                      {p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
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
