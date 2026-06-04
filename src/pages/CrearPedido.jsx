// src/pages/CrearPedido.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function CrearPedido({ usuario, onVolver, onPedidoCreado }) {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [clienteId, setClienteId] = useState('')
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', entidad: '', telefono: '', ciudad: '' })
  const [usarNuevoCliente, setUsarNuevoCliente] = useState(false)
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState([{ productoId: '', cantidad: '' }])

  useEffect(() => {
    async function cargarDatos() {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('productos').select('*').eq('activo', true).order('nombre')
      ])
      setClientes(c || [])
      setProductos(p || [])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  function agregarItem() {
    setItems([...items, { productoId: '', cantidad: '' }])
  }

  function quitarItem(index) {
    setItems(items.filter((_, i) => i !== index))
  }

  function actualizarItem(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index][campo] = valor
    setItems(nuevos)
  }

  async function guardarPedido() {
    if (!usarNuevoCliente && !clienteId) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un cliente o crea uno nuevo' })
      return
    }
    if (usarNuevoCliente && !nuevoCliente.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'Escribe el nombre del cliente' })
      return
    }
    const itemsValidos = items.filter(i => i.productoId && i.cantidad > 0)
    if (itemsValidos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto con cantidad' })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      let idClienteFinal = clienteId
      if (usarNuevoCliente) {
        const { data: clienteCreado, error: ce } = await supabase
          .from('clientes').insert(nuevoCliente).select().single()
        if (ce) throw ce
        idClienteFinal = clienteCreado.id
      }

      const { data: pedido, error: pe } = await supabase
        .from('pedidos')
        .insert({
          cliente_id: idClienteFinal,
          fecha_entrega: fechaEntrega || null,
          notas: notas || null,
          created_by: usuario.id,
          codigo: 'TEMP'
        })
        .select().single()
      if (pe) throw pe

      const itemsData = itemsValidos.map(item => ({
        pedido_id: pedido.id,
        producto_id: item.productoId,
        cantidad_pedida: parseInt(item.cantidad)
      }))
      const { error: ie } = await supabase.from('pedido_items').insert(itemsData)
      if (ie) throw ie

      setMensaje({ tipo: 'exito', texto: `Pedido ${pedido.codigo} creado exitosamente` })
      setTimeout(() => { onPedidoCreado() }, 1500)

    } catch (e) {
      console.error(e)
      setMensaje({ tipo: 'error', texto: 'Error al guardar. Intenta de nuevo.' })
    }
    setGuardando(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 20px' }}>
        <button onClick={onVolver} style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}>
          ← Volver
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Nuevo pedido</h2>
      </div>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: mensaje.tipo === 'exito' ? '#EAF3DE' : '#FCEBEB', color: mensaje.tipo === 'exito' ? '#27500A' : '#791F1F' }}>
          {mensaje.texto}
        </div>
      )}

      <div style={s.seccion}>
        <div style={s.titulo}>Cliente</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[false, true].map((esNuevo) => (
            <button key={String(esNuevo)} onClick={() => setUsarNuevoCliente(esNuevo)}
              style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: usarNuevoCliente === esNuevo ? '#E6F1FB' : 'transparent',
                color: usarNuevoCliente === esNuevo ? '#0C447C' : '#888',
                border: usarNuevoCliente === esNuevo ? '1.5px solid #378ADD' : '0.5px solid #ddd' }}>
              {esNuevo ? '+ Nuevo cliente' : 'Cliente existente'}
            </button>
          ))}
        </div>

        {!usarNuevoCliente ? (
          <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={s.input}>
            <option value="">Selecciona un cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}{c.entidad ? ` — ${c.entidad}` : ''}{c.ciudad ? ` (${c.ciudad})` : ''}</option>
            ))}
          </select>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Nombre *</label>
              <input style={s.input} placeholder="Nombre del contacto" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Entidad / Unidad</label>
              <input style={s.input} placeholder="Ej: Policía Risaralda" value={nuevoCliente.entidad} onChange={e => setNuevoCliente({ ...nuevoCliente, entidad: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Ciudad</label>
              <input style={s.input} placeholder="Ej: Pereira" value={nuevoCliente.ciudad} onChange={e => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Teléfono</label>
              <input style={s.input} placeholder="Número de contacto" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div style={s.seccion}>
        <div style={s.titulo}>Detalles del pedido</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={s.label}>Fecha de entrega</label>
            <input type="date" style={s.input} value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Notas adicionales</label>
            <input style={s.input} placeholder="Ej: Urgente..." value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={s.seccion}>
        <div style={s.titulo}>Productos del pedido</div>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              {index === 0 && <label style={s.label}>Producto</label>}
              <select value={item.productoId} onChange={e => actualizarItem(index, 'productoId', e.target.value)} style={s.input}>
                <option value="">Selecciona producto...</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div style={{ width: 90 }}>
              {index === 0 && <label style={s.label}>Cantidad</label>}
              <input type="number" min="1" placeholder="0" value={item.cantidad}
                onChange={e => actualizarItem(index, 'cantidad', e.target.value)}
                style={{ ...s.input, textAlign: 'center' }} />
            </div>
            {items.length > 1 && (
              <button onClick={() => quitarItem(index)}
                style={{ width: 36, height: 38, borderRadius: 8, border: '0.5px solid #ddd', background: '#FCEBEB', color: '#791F1F', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>
                ×
              </button>
            )}
          </div>
        ))}
        <button onClick={agregarItem}
          style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px dashed #aaa', background: 'transparent', color: '#555', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
          + Agregar otro producto
        </button>
      </div>

      {items.some(i => i.productoId && i.cantidad > 0) && (
        <div style={{ background: '#E6F1FB', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#0C447C', fontWeight: 500, marginBottom: 6 }}>Resumen del pedido</div>
          {items.filter(i => i.productoId && i.cantidad > 0).map((item, i) => {
            const prod = productos.find(p => p.id === item.productoId)
            return <div key={i} style={{ fontSize: 13, color: '#0C447C', marginBottom: 2 }}>• {prod?.nombre}: <strong>{item.cantidad} unidades</strong></div>
          })}
          <div style={{ fontSize: 12, color: '#0C447C', marginTop: 6, opacity: 0.8 }}>
            Total: {items.reduce((s, i) => s + parseInt(i.cantidad || 0), 0)} unidades
          </div>
        </div>
      )}

      <button onClick={guardarPedido} disabled={guardando}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: guardando ? '#aaa' : '#378ADD', color: '#fff', fontSize: 15, fontWeight: 500, cursor: guardando ? 'default' : 'pointer' }}>
        {guardando ? 'Guardando...' : 'Crear pedido'}
      </button>
    </div>
  )
}

const s = {
  seccion: { background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 12, padding: '14px 16px', marginBottom: 14 },
  titulo: { fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 12 },
  label: { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 },
  input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 14, boxSizing: 'border-box', background: '#fff' }
}
