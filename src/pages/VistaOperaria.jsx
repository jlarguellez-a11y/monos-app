// src/pages/VistaOperaria.jsx
// Pantalla principal para las empleadas en planta
// Diseñada para usarse en celular o tablet

import { useState, useEffect } from 'react'
import {
  supabase,
  getPedidosActivos,
  registrarProduccion,
  cambiarEstadoPedido,
  getUsuarioActual
} from '../supabaseClient'

// Colores de estado
const ESTADO_CONFIG = {
  pendiente:    { label: 'Pendiente',       bg: '#FAEEDA', color: '#633806' },
  en_proceso:   { label: 'En proceso',      bg: '#E6F1FB', color: '#0C447C' },
  culminado:    { label: 'Culminado',       bg: '#EAF3DE', color: '#27500A' },
  listo_enviar: { label: 'Listo p/enviar',  bg: '#EEEDFE', color: '#3C3489' },
  enviado:      { label: 'Enviado',         bg: '#E1F5EE', color: '#085041' },
  cancelado:    { label: 'Cancelado',       bg: '#FCEBEB', color: '#791F1F' },
}

// ---- Componente de cantidad con botones grandes ----
function SelectorCantidad({ value, onChange, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0' }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 44, height: 44, borderRadius: 10, border: '0.5px solid #ccc',
          background: '#f5f5f3', fontSize: 24, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}
      >−</button>
      <span style={{ flex: 1, textAlign: 'center', fontSize: 32, fontWeight: 500 }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 44, height: 44, borderRadius: 10, border: '0.5px solid #ccc',
          background: '#f5f5f3', fontSize: 24, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}
      >+</button>
    </div>
  )
}

// ---- Barra de progreso ----
function BarraProgreso({ actual, total, color = '#378ADD' }) {
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0
  return (
    <div>
      <div style={{ background: '#f0efea', borderRadius: 4, height: 8, margin: '6px 0 3px' }}>
        <div style={{ background: color, borderRadius: 4, height: 8, width: `${pct}%`, transition: 'width .4s' }} />
      </div>
      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>
        {actual} / {total} ({pct}%)
      </div>
    </div>
  )
}

// ---- Tarjeta de un item dentro del pedido ----
function ItemPedido({ item, userId, onActualizar }) {
  const [cantidadBase, setCantidadBase] = useState(0)
  const [cantidadTerminado, setCantidadTerminado] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const maxBase = item.cantidad_pedida - item.bases_producidas
  const maxTerminado = item.bases_producidas - item.unidades_terminadas

  async function registrar(tipo, cantidad, setCantidad) {
    if (cantidad === 0) return
    setLoading(true)
    try {
      await registrarProduccion({
        pedidoItemId: item.id,
        tipoRegistro: tipo,
        cantidad,
        userId
      })
      setMensaje(`✓ ${cantidad} ${tipo === 'base' ? 'bases' : 'moños'} registrados`)
      setCantidad(0)
      setTimeout(() => setMensaje(''), 3000)
      onActualizar()
    } catch (e) {
      setMensaje('Error al registrar. Intenta de nuevo.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #e0e0db',
      borderRadius: 12,
      padding: 14,
      marginBottom: 10
    }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        {item.productos?.nombre}
      </div>

      {mensaje && (
        <div style={{
          background: '#EAF3DE', color: '#27500A', borderRadius: 8,
          padding: '6px 12px', fontSize: 13, marginBottom: 8
        }}>
          {mensaje}
        </div>
      )}

      <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>Bases producidas</div>
      <BarraProgreso actual={item.bases_producidas} total={item.cantidad_pedida} color="#378ADD" />

      {maxBase > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#555' }}>Registrar bases ahora:</div>
          <SelectorCantidad value={cantidadBase} onChange={setCantidadBase} max={maxBase} />
          <button
            onClick={() => registrar('base', cantidadBase, setCantidadBase)}
            disabled={loading || cantidadBase === 0}
            style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: cantidadBase === 0 ? '#e0e0db' : '#378ADD',
              color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Registrar bases'}
          </button>
        </div>
      )}

      <div style={{ fontSize: 12, color: '#888', marginTop: 10, marginBottom: 2 }}>Moños terminados</div>
      <BarraProgreso actual={item.unidades_terminadas} total={item.cantidad_pedida} color="#639922" />

      {maxTerminado > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#555' }}>Registrar terminados:</div>
          <SelectorCantidad value={cantidadTerminado} onChange={setCantidadTerminado} max={maxTerminado} />
          <button
            onClick={() => registrar('terminado', cantidadTerminado, setCantidadTerminado)}
            disabled={loading || cantidadTerminado === 0}
            style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: cantidadTerminado === 0 ? '#e0e0db' : '#639922',
              color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Registrar moños terminados'}
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Tarjeta de pedido ----
function TarjetaPedido({ pedido, userId, onActualizar }) {
  const [expandido, setExpandido] = useState(false)
  const [loading, setLoading] = useState(false)
  const cfg = ESTADO_CONFIG[pedido.estado] || {}

  const totalPedido = pedido.pedido_items?.reduce((s, i) => s + i.cantidad_pedida, 0) || 0
  const totalTerminado = pedido.pedido_items?.reduce((s, i) => s + i.unidades_terminadas, 0) || 0
  const pctAvance = totalPedido > 0 ? Math.round((totalTerminado / totalPedido) * 100) : 0

  async function marcarEnProceso() {
    if (pedido.estado !== 'pendiente') return
    setLoading(true)
    await cambiarEstadoPedido(pedido.id, 'en_proceso')
    setLoading(false)
    onActualizar()
  }

  async function marcarListoEnviar() {
    setLoading(true)
    await cambiarEstadoPedido(pedido.id, 'listo_enviar')
    setLoading(false)
    onActualizar()
  }

  return (
    <div style={{
      background: '#fff',
      border: expandido ? '1.5px solid #378ADD' : '0.5px solid #e0e0db',
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden'
    }}>
      {/* Cabecera del pedido */}
      <div
        onClick={() => setExpandido(!expandido)}
        style={{ padding: '12px 14px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {pedido.codigo} · {pedido.clientes?.nombre}
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {pedido.clientes?.entidad} {pedido.fecha_entrega ? `· Entrega: ${pedido.fecha_entrega}` : ''}
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20,
            background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap'
          }}>
            {cfg.label}
          </span>
        </div>
        <BarraProgreso actual={totalTerminado} total={totalPedido} color="#378ADD" />
        <div style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 2 }}>
          {expandido ? 'Toca para cerrar ▲' : 'Toca para ver detalle ▼'}
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{ borderTop: '0.5px solid #e0e0db', padding: '12px 14px' }}>
          {pedido.estado === 'pendiente' && (
            <button
              onClick={marcarEnProceso}
              disabled={loading}
              style={{
                width: '100%', padding: 12, borderRadius: 10, border: 'none',
                background: '#378ADD', color: '#fff', fontSize: 14,
                fontWeight: 500, cursor: 'pointer', marginBottom: 12
              }}
            >
              {loading ? 'Actualizando...' : '▶ Iniciar producción de este pedido'}
            </button>
          )}

          {pedido.pedido_items?.map(item => (
            <ItemPedido
              key={item.id}
              item={item}
              userId={userId}
              onActualizar={onActualizar}
            />
          ))}

          {pctAvance === 100 && pedido.estado === 'en_proceso' && (
            <button
              onClick={marcarListoEnviar}
              disabled={loading}
              style={{
                width: '100%', padding: 12, borderRadius: 10, border: 'none',
                background: '#639922', color: '#fff', fontSize: 14,
                fontWeight: 500, cursor: 'pointer', marginTop: 8
              }}
            >
              {loading ? 'Actualizando...' : '✓ Marcar pedido listo para enviar'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Componente principal VistaOperaria ----
export default function VistaOperaria({ usuario }) {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  async function cargarPedidos() {
    try {
      const data = await getPedidosActivos()
      setPedidos(data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarPedidos()
    // Suscripción en tiempo real
    const channel = supabase
      .channel('operaria-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' }, cargarPedidos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando pedidos...</div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 12px 24px' }}>
      {/* Encabezado */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 0 12px'
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Hola, {usuario?.nombre}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Pedidos activos</div>
        </div>
        <div style={{
          background: '#E6F1FB', color: '#0C447C', fontSize: 12,
          padding: '4px 12px', borderRadius: 20, fontWeight: 500
        }}>
          {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px', color: '#888',
          background: '#f5f5f3', borderRadius: 12
        }}>
          No hay pedidos activos en este momento
        </div>
      ) : (
        pedidos.map(p => (
          <TarjetaPedido
            key={p.id}
            pedido={p}
            userId={usuario?.id}
            onActualizar={cargarPedidos}
          />
        ))
      )}
    </div>
  )
}
