// src/pages/VistaOperaria.jsx — VERSION 3
// - Sin registro de bases ni terminados
// - Con campo de comentarios por pedido
// - Puede marcar: en_proceso, culminado, listo_enviar (sin cancelar)

import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const ESTADO_CONFIG = {
  pendiente:    { label: 'Pendiente',      bg: '#FAEEDA', color: '#633806' },
  en_proceso:   { label: 'En proceso',     bg: '#E6F1FB', color: '#0C447C' },
  culminado:    { label: 'Culminado',      bg: '#EAF3DE', color: '#27500A' },
  listo_enviar: { label: 'Listo p/enviar', bg: '#EEEDFE', color: '#3C3489' },
  enviado:      { label: 'Enviado',        bg: '#E1F5EE', color: '#085041' },
}

const TRANSICIONES = {
  pendiente:    ['en_proceso'],
  en_proceso:   ['culminado'],
  culminado:    ['listo_enviar'],
  listo_enviar: [],
  enviado:      [],
}

const ESTADO_BTN = {
  en_proceso:   { label: '▶ Iniciar producción',    bg: '#378ADD' },
  culminado:    { label: '✓ Marcar como culminado', bg: '#639922' },
  listo_enviar: { label: '📦 Listo para enviar',    bg: '#5B4FCF' },
}

function TarjetaPedido({ pedido, userId, onActualizar }) {
  const [expandido, setExpandido]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [comentario, setComentario] = useState('')
  const [guardandoCom, setGuardandoCom] = useState(false)
  const [mensaje, setMensaje]       = useState('')
  const [comentarios, setComentarios] = useState([])

  const cfg       = ESTADO_CONFIG[pedido.estado] || {}
  const siguientes = TRANSICIONES[pedido.estado] || []

  // Cargar comentarios del pedido
  async function cargarComentarios() {
    const { data } = await supabase
      .from('comentarios_pedido')
      .select('*, usuarios(nombre)')
      .eq('pedido_id', pedido.id)
      .order('created_at', { ascending: false })
    setComentarios(data || [])
  }

  useEffect(() => {
    if (expandido) cargarComentarios()
  }, [expandido])

  async function cambiarEstado(nuevoEstado) {
    setLoading(true)
    setMensaje('')
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedido.id)
      if (error) throw error
      const etiquetas = { en_proceso: 'en proceso', culminado: 'culminado', listo_enviar: 'listo para enviar' }
      setMensaje(`✓ Pedido marcado como ${etiquetas[nuevoEstado]}`)
      setTimeout(() => setMensaje(''), 3000)
      onActualizar()
    } catch (e) {
      setMensaje('Error al cambiar estado, intenta de nuevo')
    }
    setLoading(false)
  }

  async function enviarComentario() {
    if (!comentario.trim()) return
    setGuardandoCom(true)
    try {
      const { error } = await supabase
        .from('comentarios_pedido')
        .insert({ pedido_id: pedido.id, usuario_id: userId, texto: comentario.trim() })
      if (error) throw error
      setComentario('')
      cargarComentarios()
    } catch (e) {
      setMensaje('Error al guardar el comentario')
    }
    setGuardandoCom(false)
  }

  const totalPedido    = pedido.pedido_items?.reduce((s, i) => s + i.cantidad_pedida, 0) || 0
  const totalItems     = pedido.pedido_items?.length || 0

  return (
    <div style={{ background: '#fff', border: expandido ? '1.5px solid #378ADD' : '0.5px solid #e0e0db', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>

      {/* Cabecera — siempre visible */}
      <div onClick={() => setExpandido(!expandido)} style={{ padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{pedido.codigo} · {pedido.clientes?.nombre}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
              {pedido.clientes?.entidad}
              {pedido.fecha_entrega ? ` · Entrega: ${new Date(pedido.fecha_entrega).toLocaleDateString('es-CO')}` : ''}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              {totalItems} producto{totalItems !== 1 ? 's' : ''} · {totalPedido} unidades
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
            {cfg.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
          {expandido ? '▲ cerrar' : '▼ ver detalle'}
        </div>
      </div>

      {/* Detalle expandido */}
      {expandido && (
        <div style={{ borderTop: '0.5px solid #e8e8e3', padding: '14px 14px' }}>

          {mensaje && (
            <div style={{ background: mensaje.startsWith('✓') ? '#EAF3DE' : '#FCEBEB', color: mensaje.startsWith('✓') ? '#27500A' : '#791F1F', borderRadius: 8, padding: '7px 12px', fontSize: 13, marginBottom: 12 }}>
              {mensaje}
            </div>
          )}

          {/* Productos del pedido (solo lectura) */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>Productos del pedido</div>
            {pedido.pedido_items?.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8f8f6', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#333' }}>{item.productos?.nombre}</span>
                <span style={{ fontWeight: 500, color: '#0C447C' }}>{item.cantidad_pedida} und.</span>
              </div>
            ))}
          </div>

          {/* Botones de cambio de estado */}
          {siguientes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {siguientes.map(est => {
                const btn = ESTADO_BTN[est]
                return (
                  <button key={est} onClick={() => cambiarEstado(est)} disabled={loading}
                    style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: loading ? '#aaa' : btn.bg, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 6 }}>
                    {loading ? 'Actualizando...' : btn.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Sección de comentarios */}
          <div style={{ borderTop: '0.5px solid #e8e8e3', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 10 }}>
              💬 Comentarios del pedido
            </div>

            {/* Historial de comentarios */}
            {comentarios.length === 0 ? (
              <div style={{ fontSize: 12, color: '#bbb', textAlign: 'center', padding: '10px 0', marginBottom: 10 }}>
                Sin comentarios aún
              </div>
            ) : (
              <div style={{ marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
                {comentarios.map(c => (
                  <div key={c.id} style={{ background: '#f5f5f3', borderRadius: 8, padding: '8px 10px', marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
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

            {/* Escribir comentario */}
            <textarea
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              placeholder="Escribe un comentario sobre el pedido..."
              rows={3}
              style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={enviarComentario}
              disabled={guardandoCom || !comentario.trim()}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: !comentario.trim() ? '#ddd' : '#555', color: '#fff', fontSize: 13, fontWeight: 500, cursor: comentario.trim() ? 'pointer' : 'default', marginTop: 6 }}>
              {guardandoCom ? 'Guardando...' : 'Enviar comentario'}
            </button>
          </div>

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
    const channel = supabase.channel('operaria-v3')
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
