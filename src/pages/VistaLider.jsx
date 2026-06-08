// src/pages/VistaLider.jsx — CON CONTABILIDAD
import { useState, useEffect } from 'react'
import { supabase, getPedidos, cambiarEstadoPedido } from '../supabaseClient'
import CrearPedido from './CrearPedido'
import GestionProductos from './GestionProductos'
import Contabilidad from './Contabilidad'

const ESTADOS = ['todos', 'pendiente', 'en_proceso', 'culminado', 'listo_enviar', 'enviado', 'cancelado']
const ESTADO_CONFIG = {
  pendiente:    { label: 'Pendiente',      bg: '#FAEEDA', color: '#633806' },
  en_proceso:   { label: 'En proceso',     bg: '#E6F1FB', color: '#0C447C' },
  culminado:    { label: 'Culminado',      bg: '#EAF3DE', color: '#27500A' },
  listo_enviar: { label: 'Listo p/enviar', bg: '#EEEDFE', color: '#3C3489' },
  enviado:      { label: 'Enviado',        bg: '#E1F5EE', color: '#085041' },
  cancelado:    { label: 'Cancelado',      bg: '#FCEBEB', color: '#791F1F' },
}

function TarjetaPedidoLider({ pedido, onActualizar }) {
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [verComentarios, setVerComentarios]   = useState(false)
  const [comentarios, setComentarios]         = useState([])
  const cfg = ESTADO_CONFIG[pedido.estado] || {}
  const pct = Number(pedido.porcentaje_avance) || 0

  async function cargarComentarios() {
    const { data } = await supabase
      .from('comentarios_pedido')
      .select('*, usuarios(nombre)')
      .eq('pedido_id', pedido.id)
      .order('created_at', { ascending: false })
    setComentarios(data || [])
  }

  useEffect(() => { if (verComentarios) cargarComentarios() }, [verComentarios])

  async function cambiarEstado(nuevoEstado) {
    setCambiandoEstado(true)
    await cambiarEstadoPedido(pedido.id, nuevoEstado)
    setCambiandoEstado(false)
    onActualizar()
  }

  const siguientesEstados = {
    pendiente:    ['en_proceso', 'cancelado'],
    en_proceso:   ['culminado', 'cancelado'],
    culminado:    ['listo_enviar', 'cancelado'],
    listo_enviar: ['enviado'],
    enviado:      [],
    cancelado:    [],
  }[pedido.estado] || []

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{pedido.codigo}</span>
            <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>{pedido.cliente_nombre} · {pedido.cliente_entidad}</span>
            {pedido.cliente_ciudad && <span style={{ fontSize: 12, color: '#aaa', marginLeft: 6 }}>{pedido.cliente_ciudad}</span>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
            {cfg.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ flex: 1, background: '#f0efea', borderRadius: 4, height: 6 }}>
            <div style={{ background: pct >= 100 ? '#639922' : '#378ADD', borderRadius: 4, height: 6, width: `${Math.min(100, pct)}%`, transition: 'width .4s' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: pct >= 100 ? '#27500A' : '#0C447C', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
          {pedido.total_terminadas} de {pedido.total_unidades} unidades
          {pedido.fecha_entrega && <span style={{ marginLeft: 10 }}>· Entrega: {new Date(pedido.fecha_entrega).toLocaleDateString('es-CO')}</span>}
        </div>
        {siguientesEstados.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {siguientesEstados.map(est => {
              const ec = ESTADO_CONFIG[est]
              return (
                <button key={est} onClick={() => cambiarEstado(est)} disabled={cambiandoEstado}
                  style={{ padding: '5px 14px', borderRadius: 8, border: `0.5px solid ${ec.color}`, background: ec.bg, color: ec.color, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  {cambiandoEstado ? '...' : `→ ${ec.label}`}
                </button>
              )
            })}
          </div>
        )}
        <button onClick={() => setVerComentarios(!verComentarios)}
          style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#666', cursor: 'pointer' }}>
          💬 {verComentarios ? 'Ocultar comentarios' : 'Ver comentarios'}
        </button>
      </div>
      {verComentarios && (
        <div style={{ borderTop: '0.5px solid #ececec', padding: '12px 16px', background: '#fafaf8' }}>
          {comentarios.length === 0 ? (
            <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center', padding: '10px 0' }}>Sin comentarios</div>
          ) : comentarios.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', marginBottom: 8, border: '0.5px solid #ececec' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#378ADD' }}>{c.usuarios?.nombre}</span>
                <span style={{ fontSize: 10, color: '#bbb' }}>
                  {new Date(c.created_at).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#333' }}>{c.texto}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VistaLider({ usuario }) {
  const [pedidos, setPedidos] = useState([])
  const [filtro, setFiltro]   = useState('todos')
  const [loading, setLoading] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [vista, setVista]     = useState('lista')

  async function cargarPedidos() {
    try {
      const data = await getPedidos()
      setPedidos(data || [])
      setUltimaActualizacion(new Date())
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    cargarPedidos()
    const channel = supabase.channel('lider-final')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, cargarPedidos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' }, cargarPedidos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (vista === 'crear')        return <CrearPedido usuario={usuario} onVolver={() => setVista('lista')} onPedidoCreado={() => { cargarPedidos(); setVista('lista') }} />
  if (vista === 'productos')    return <GestionProductos onVolver={() => setVista('lista')} />
  if (vista === 'contabilidad') return <Contabilidad onVolver={() => setVista('lista')} usuario={usuario} />

  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtro)
  const totalActivos     = pedidos.filter(p => p.estado === 'en_proceso').length
  const totalListos      = pedidos.filter(p => p.estado === 'listo_enviar').length
  const totalPendientes  = pedidos.filter(p => p.estado === 'pendiente').length

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 32px' }}>

      <div style={{ padding: '16px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Panel de pedidos</div>
          {ultimaActualizacion && <div style={{ fontSize: 11, color: '#aaa' }}>Actualizado: {ultimaActualizacion.toLocaleTimeString('es-CO')} · en tiempo real</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => setVista('contabilidad')}
            style={{ padding: '8px 14px', borderRadius: 10, border: '0.5px solid #ddd', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            📊 Contabilidad
          </button>
          <button onClick={() => setVista('productos')}
            style={{ padding: '8px 14px', borderRadius: 10, border: '0.5px solid #ddd', background: '#fff', color: '#555', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Productos
          </button>
          <button onClick={() => setVista('crear')}
            style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#378ADD', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + Nuevo pedido
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'En produccion',      value: totalActivos,    bg: '#E6F1FB', color: '#0C447C' },
          { label: 'Listos para enviar', value: totalListos,     bg: '#EEEDFE', color: '#3C3489' },
          { label: 'Pendientes',         value: totalPendientes, bg: '#FAEEDA', color: '#633806' },
        ].map(m => (
          <div key={m.label} style={{ background: m.bg, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.color, opacity: .8 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {ESTADOS.map(est => {
          const ec     = ESTADO_CONFIG[est]
          const activo = filtro === est
          return (
            <button key={est} onClick={() => setFiltro(est)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, border: activo ? '1.5px solid #378ADD' : '0.5px solid #ccc', background: activo ? '#E6F1FB' : 'transparent', color: activo ? '#0C447C' : '#888', cursor: 'pointer', fontWeight: activo ? 500 : 400 }}>
              {est === 'todos' ? 'Todos' : ec?.label}
              {est !== 'todos' && <span style={{ marginLeft: 4, opacity: .7 }}>({pedidos.filter(p => p.estado === est).length})</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: '#888', background: '#f5f5f3', borderRadius: 12 }}>
          No hay pedidos con este estado
        </div>
      ) : (
        pedidosFiltrados.map(p => <TarjetaPedidoLider key={p.id} pedido={p} onActualizar={cargarPedidos} />)
      )}
    </div>
  )
}
