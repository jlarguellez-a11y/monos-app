// src/pages/VistaOperaria.jsx — VERSION 2
// - Operaria puede marcar: en_proceso, culminado, listo_enviar (NO cancelar)
// - Puede registrar bases producidas y moños/bambas terminados
// - El porcentaje se actualiza en tiempo real

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const ESTADO_CONFIG = {
  pendiente:    { label: 'Pendiente',      bg: '#FAEEDA', color: '#633806' },
  en_proceso:   { label: 'En proceso',     bg: '#E6F1FB', color: '#0C447C' },
  culminado:    { label: 'Culminado',      bg: '#EAF3DE', color: '#27500A' },
  listo_enviar: { label: 'Listo p/enviar', bg: '#EEEDFE', color: '#3C3489' },
  enviado:      { label: 'Enviado',        bg: '#E1F5EE', color: '#085041' },
}

// Estados que la operaria puede avanzar (sin cancelar)
const TRANSICIONES_OPERARIA = {
  pendiente:  ['en_proceso'],
  en_proceso: ['culminado'],
  culminado:  ['listo_enviar'],
  listo_enviar: [],
  enviado: [],
}

function BarraProgreso({ actual, total, color = '#378ADD' }) {
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0
  return (
    <div>
      <div style={{ background: '#f0efea', borderRadius: 4, height: 8, margin: '5px 0 3px' }}>
        <div style={{ background: pct >= 100 ? '#639922' : color, borderRadius: 4, height: 8, width: `${Math.min(100, pct)}%`, transition: 'width .4s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>{actual} / {total} ({pct}%)</div>
    </div>
  )
}

function SelectorCantidad({ value, onChange, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
      <button onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width: 40, height: 40, borderRadius: 8, border: '0.5px solid #ccc', background: '#f5f5f3', fontSize: 22, cursor: 'pointer' }}>−</button>
      <span style={{ flex: 1, textAlign: 'center', fontSize: 30, fontWeight: 500 }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 40, height: 40, borderRadius: 8, border: '0.5px solid #ccc', background: '#f5f5f3', fontSize: 22, cursor: 'pointer' }}>+</button>
    </div>
  )
}

function ItemProduccion({ item, userId, onActualizar }) {
  const [cantBase, setCantBase] = useState(0)
  const [cantTerminado, setCantTerminado] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const maxBase = item.cantidad_pedida - item.bases_producidas
  const maxTerminado = item.bases_producidas - item.unidades_terminadas
  const nombreProducto = item.productos?.nombre || 'Producto'

  async function registrar(tipo, cantidad, setCantidad) {
    if (cantidad === 0) return
    setLoading(true)
    try {
      const { error } = await supabase.from('registros_produccion').insert({
        pedido_item_id: item.id,
        tipo_registro: tipo,
        cantidad,
        usuario_id: userId
      })
      if (error) throw error
      setMensaje(`✓ ${cantidad} ${tipo === 'base' ? 'bases' : 'unidades terminadas'} registradas`)
      setCantidad(0)
      setTimeout(() => setMensaje(''), 3000)
      onActualizar()
    } catch (e) {
      setMensaje('Error al registrar, intenta de nuevo')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#fafaf8', border: '0.5px solid #e8e8e3', borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#222' }}>
        {nombreProducto}
      </div>

      {mensaje && (
        <div style={{ background: '#EAF3DE', color: '#27500A', borderRadius: 7, padding: '5px 10px', fontSize: 12, marginBottom: 8 }}>
          {mensaje}
        </div>
      )}

      {/* Bases */}
      <div style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>Bases armadas (máquina plana)</div>
      <BarraProgreso actual={item.bases_producidas} total={item.cantidad_pedida} color="#378ADD" />
      {maxBase > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 11, color: '#888' }}>Agregar bases ahora:</div>
          <SelectorCantidad value={cantBase} onChange={setCantBase} max={maxBase} />
          <button onClick={() => registrar('base', cantBase, setCantBase)} disabled={loading || cantBase === 0}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: cantBase === 0 ? '#ddd' : '#378ADD', color: '#fff', fontSize: 13, fontWeight: 500, cursor: cantBase === 0 ? 'default' : 'pointer' }}>
            {loading ? 'Guardando...' : 'Registrar bases'}
          </button>
        </div>
      )}

      {/* Terminados */}
      <div style={{ fontSize: 12, color: '#666', marginTop: 10, marginBottom: 2 }}>Unidades terminadas (armado a mano)</div>
      <BarraProgreso actual={item.unidades_terminadas} total={item.cantidad_pedida} color="#639922" />
      {maxTerminado > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 11, color: '#888' }}>Agregar terminados ahora:</div>
          <SelectorCantidad value={cantTerminado} onChange={setCantTerminado} max={maxTerminado} />
          <button onClick={() => registrar('terminado', cantTerminado, setCantTerminado)} disabled={loading || cantTerminado === 0}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: cantTerminado === 0 ? '#ddd' : '#639922', color: '#fff', fontSize: 13, fontWeight: 500, cursor: cantTerminado === 0 ? 'default' : 'pointer' }}>
            {loading ? 'Guardando...' : 'Registrar terminados'}
          </button>
        </div>
      )}

      {maxBase === 0 && maxTerminado === 0 && (
        <div style={{ fontSize: 12, color: '#639922', fontWeight: 500, marginTop: 6 }}>✓ Producto completado</div>
      )}
    </div>
  )
}

function TarjetaPedido({ pedido, userId, onActualizar }) {
  const [expandido, setExpandido] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const cfg = ESTADO_CONFIG[pedido.estado] || {}

  const totalPedido = pedido.pedido_items?.reduce((s, i) => s + i.cantidad_pedida, 0) || 0
  const totalTerminado = pedido.pedido_items?.reduce((s, i) => s + i.unidades_terminadas, 0) || 0
  const pct = totalPedido > 0 ? Math.round((totalTerminado / totalPedido) * 100) : 0
  const siguientes = TRANSICIONES_OPERARIA[pedido.estado] || []

  async function cambiarEstado(nuevoEstado) {
    setLoading(true)
    setMensaje('')
    try {
      const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedido.id)
      if (error) throw error
      const etiquetas = { en_proceso: 'en proceso', culminado: 'culminado', listo_enviar: 'listo para enviar' }
      setMensaje(`✓ Pedido marcado como ${etiquetas[nuevoEstado]}`)
      setTimeout(() => setMensaje(''), 3000)
      onActualizar()
    } catch (e) {
      setMensaje('Error al cambiar estado')
    }
    setLoading(false)
  }

  const ESTADO_BTN = {
    en_proceso:   { label: '▶ Iniciar producción',        bg: '#378ADD' },
    culminado:    { label: '✓ Marcar como culminado',     bg: '#639922' },
    listo_enviar: { label: '📦 Listo para enviar',        bg: '#5B4FCF' },
  }

  return (
    <div style={{ background: '#fff', border: expandido ? '1.5px solid #378ADD' : '0.5px solid #e0e0db', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
      <div onClick={() => setExpandido(!expandido)} style={{ padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{pedido.codigo} · {pedido.clientes?.nombre}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{pedido.clientes?.entidad}{pedido.fecha_entrega ? ` · Entrega: ${new Date(pedido.fecha_entrega).toLocaleDateString('es-CO')}` : ''}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
            {cfg.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, background: '#f0efea', borderRadius: 4, height: 7 }}>
            <div style={{ background: pct >= 100 ? '#639922' : '#378ADD', borderRadius: 4, height: 7, width: `${pct}%`, transition: 'width .4s' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: pct >= 100 ? '#27500A' : '#0C447C', minWidth: 36 }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
          {expandido ? '▲ cerrar' : '▼ ver detalle'}
        </div>
      </div>

      {expandido && (
        <div style={{ borderTop: '0.5px solid #e8e8e3', padding: '12px 14px' }}>
          {mensaje && (
            <div style={{ background: mensaje.startsWith('✓') ? '#EAF3DE' : '#FCEBEB', color: mensaje.startsWith('✓') ? '#27500A' : '#791F1F', borderRadius: 8, padding: '7px 12px', fontSize: 13, marginBottom: 12 }}>
              {mensaje}
            </div>
          )}

          {/* Botones de cambio de estado (sin cancelar) */}
          {siguientes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {siguientes.map(est => {
                const btn = ESTADO_BTN[est]
                return (
                  <button key={est} onClick={() => cambiarEstado(est)} disabled={loading}
                    style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', background: loading ? '#aaa' : btn.bg, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 6 }}>
                    {loading ? 'Actualizando...' : btn.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Items de producción */}
          {pedido.pedido_items?.map(item => (
            <ItemProduccion key={item.id} item={item} userId={userId} onActualizar={onActualizar} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function VistaOperaria({ usuario }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  async function cargarPedidos() {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`*, clientes(nombre, entidad), pedido_items(*, productos(nombre, tipo, variante))`)
        .in('estado', ['pendiente', 'en_proceso', 'culminado', 'listo_enviar'])
        .order('created_at', { ascending: false })
      if (error) throw error
      setPedidos(data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    cargarPedidos()
    const channel = supabase.channel('operaria-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' }, cargarPedidos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, cargarPedidos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando pedidos...</div>

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 12px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 12px' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Hola, {usuario?.nombre}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Pedidos activos</div>
        </div>
        <div style={{ background: '#E6F1FB', color: '#0C447C', fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500 }}>
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', background: '#f5f5f3', borderRadius: 12 }}>
          No hay pedidos activos en este momento
        </div>
      ) : (
        pedidos.map(p => <TarjetaPedido key={p.id} pedido={p} userId={usuario?.id} onActualizar={cargarPedidos} />)
      )}
    </div>
  )
}
