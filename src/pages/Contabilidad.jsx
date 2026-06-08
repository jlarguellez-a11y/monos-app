// src/pages/Contabilidad.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const TIPO_EGRESO = {
  salario:          { label: 'Salario empleado',    emoji: '👤' },
  arriendo:         { label: 'Arriendo local',      emoji: '🏠' },
  servicios_publicos:{ label: 'Servicios públicos', emoji: '💡' },
  insumos:          { label: 'Insumos',             emoji: '🧵' },
  consumibles:      { label: 'Consumibles',         emoji: '🛒' },
  otro:             { label: 'Otro',                emoji: '📌' },
}

const ESTADO_INGRESO = {
  pendiente: { label: 'Pendiente', bg: '#FAEEDA', color: '#633806' },
  abonado:   { label: 'Abonado',   bg: '#E6F1FB', color: '#0C447C' },
  pagado:    { label: 'Pagado',    bg: '#EAF3DE', color: '#27500A' },
  cancelado: { label: 'Cancelado', bg: '#FCEBEB', color: '#791F1F' },
}

function formatCOP(n) {
  return '$' + Number(n || 0).toLocaleString('es-CO')
}

// ---- Tarjeta de ingreso ----


function TarjetaIngreso({ ingreso, onActualizar, usuario }) {
  const [expandido, setExpandido]       = useState(false)
  const [abonos, setAbonos]             = useState([])
  const [items, setItems]               = useState([])
  const [montoAbono, setMontoAbono]     = useState('')
  const [notaAbono, setNotaAbono]       = useState('')
  const [guardando, setGuardando]       = useState(false)
  const [editandoMonto, setEditandoMonto]       = useState(false)
  const [editandoDescuento, setEditandoDescuento] = useState(false)
  const [nuevoMonto, setNuevoMonto]     = useState('')
  const [descuentoPct, setDescuentoPct] = useState('')

  const cfg       = ESTADO_INGRESO[ingreso.estado] || {}
  const pendiente = ingreso.monto_total - ingreso.monto_pagado
  const pct       = ingreso.monto_total > 0
    ? Math.round((ingreso.monto_pagado / ingreso.monto_total) * 100)
    : 0

  async function cargarDetalle() {
    const [{ data: ab }, { data: it }] = await Promise.all([
      supabase.from('abonos').select('*').eq('ingreso_id', ingreso.id).order('created_at', { ascending: false }),
      supabase.from('pedido_items')
        .select('cantidad_pedida, productos(nombre, precio_unit, referencia)')
        .eq('pedido_id', ingreso.pedido_id)
    ])
    setAbonos(ab || [])
    setItems(it || [])
  }

  useEffect(() => { if (expandido) cargarDetalle() }, [expandido])

  async function registrarAbono() {
    const monto = parseFloat(montoAbono)
    if (!monto || monto <= 0) return
    setGuardando(true)
    await supabase.from('abonos').insert({
      ingreso_id: ingreso.id, monto,
      nota: notaAbono || null, usuario_id: usuario.id
    })
    setMontoAbono('')
    setNotaAbono('')
    cargarDetalle()
    onActualizar()
    setGuardando(false)
  }

  async function marcarPagado() {
    setGuardando(true)
    const faltante = ingreso.monto_total - ingreso.monto_pagado
    if (faltante > 0) {
      await supabase.from('abonos').insert({
        ingreso_id: ingreso.id, monto: faltante,
        nota: 'Pago completo', usuario_id: usuario.id
      })
    } else {
      await supabase.from('ingresos').update({ estado: 'pagado' }).eq('id', ingreso.id)
    }
    onActualizar()
    setGuardando(false)
  }

  async function actualizarMonto() {
    const monto = parseFloat(nuevoMonto)
    if (!monto || monto <= 0) return
    setGuardando(true)
    const desc   = ingreso.descuento_pct || 0
    const descM  = monto * (desc / 100)
    await supabase.from('ingresos').update({
      monto_total:         monto - descM,
      monto_descuento:     descM,
      monto_con_descuento: monto - descM,
      updated_at:          new Date().toISOString()
    }).eq('id', ingreso.id)
    setEditandoMonto(false)
    setNuevoMonto('')
    onActualizar()
    setGuardando(false)
  }

  async function aplicarDescuento() {
    const pct = parseFloat(descuentoPct)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    setGuardando(true)
    // Calcular monto base (antes del descuento)
    const montoBase  = items.reduce((s, i) => s + (i.cantidad_pedida * (i.productos?.precio_unit || 0)), 0)
    const base       = montoBase > 0 ? montoBase : ingreso.monto_total / (1 - (ingreso.descuento_pct || 0) / 100)
    const descMonto  = base * (pct / 100)
    await supabase.from('ingresos').update({
      descuento_pct:       pct,
      monto_descuento:     descMonto,
      monto_total:         base - descMonto,
      monto_con_descuento: base - descMonto,
      updated_at:          new Date().toISOString()
    }).eq('id', ingreso.id)
    setEditandoDescuento(false)
    setDescuentoPct('')
    onActualizar()
    setGuardando(false)
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>

      {/* Cabecera */}
      <div style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => setExpandido(!expandido)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{ingreso.descripcion}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              {new Date(ingreso.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              {ingreso.descuento_pct > 0 && (
                <span style={{ marginLeft: 8, background: '#FAEEDA', color: '#633806', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>
                  Descuento {ingreso.descuento_pct}%
                </span>
              )}
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
            {cfg.label}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
          <span>Total: <strong style={{ color: '#222' }}>{formatCOP(ingreso.monto_total)}</strong></span>
          <span>Pagado: <strong style={{ color: '#27500A' }}>{formatCOP(ingreso.monto_pagado)}</strong></span>
          <span>Pendiente: <strong style={{ color: '#633806' }}>{formatCOP(pendiente)}</strong></span>
        </div>

        {ingreso.monto_total > 0 && (
          <div style={{ background: '#f0efea', borderRadius: 4, height: 6 }}>
            <div style={{ background: pct >= 100 ? '#639922' : '#378ADD', borderRadius: 4, height: 6, width: `${pct}%`, transition: 'width .4s' }} />
          </div>
        )}
        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 4 }}>
          {expandido ? '▲ cerrar' : '▼ ver detalle'}
        </div>
      </div>

      {expandido && (
        <div style={{ borderTop: '0.5px solid #ececec', padding: '12px 14px', background: '#fafaf8' }}>

          {/* Detalle de productos con precios */}
          {items.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>Detalle del pedido</div>
              {items.map((item, i) => {
                const subtotal = item.cantidad_pedida * (item.productos?.precio_unit || 0)
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fff', borderRadius: 8, marginBottom: 5, border: '0.5px solid #ececec' }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#333' }}>{item.productos?.nombre}</span>
                      <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>x{item.cantidad_pedida}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#222' }}>{formatCOP(subtotal)}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{formatCOP(item.productos?.precio_unit)} c/u</div>
                    </div>
                  </div>
                )
              })}

              {/* Subtotal y descuento */}
              <div style={{ borderTop: '0.5px solid #ececec', marginTop: 6, paddingTop: 8 }}>
                {ingreso.descuento_pct > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 3 }}>
                      <span>Subtotal</span>
                      <span>{formatCOP(ingreso.monto_total + ingreso.monto_descuento)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#633806', marginBottom: 3 }}>
                      <span>Descuento ({ingreso.descuento_pct}%)</span>
                      <span>- {formatCOP(ingreso.monto_descuento)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: '#111' }}>
                  <span>Total</span>
                  <span>{formatCOP(ingreso.monto_total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Acciones: editar precio y descuento */}
          {ingreso.estado !== 'pagado' && ingreso.estado !== 'cancelado' && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <button onClick={() => { setEditandoMonto(!editandoMonto); setEditandoDescuento(false) }}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer' }}>
                ✏️ Editar precio total
              </button>
              <button onClick={() => { setEditandoDescuento(!editandoDescuento); setEditandoMonto(false) }}
                style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', color: '#633806', cursor: 'pointer' }}>
                🏷️ {ingreso.descuento_pct > 0 ? `Descuento: ${ingreso.descuento_pct}%` : 'Agregar descuento'}
              </button>
              {ingreso.estado !== 'pagado' && ingreso.estado !== 'cancelado' && (
              <button
              onClick={async () => {
              if (!window.confirm('¿Eliminar este ingreso? Esta acción no se puede deshacer.')) return
              await supabase.from('ingresos').delete().eq('id', ingreso.id)
              onActualizar()
              }}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#791F1F', cursor: 'pointer' }}>
              🗑 Eliminar ingreso
              </button>
              )}
            </div>
          )}

          {/* Form editar precio */}
          {editandoMonto && (
            <div style={{ background: '#fff', border: '1px solid #378ADD', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#0C447C', fontWeight: 500, marginBottom: 8 }}>Editar precio total</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)}
                  placeholder={`Actual: ${ingreso.monto_total}`}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }} />
                <button onClick={actualizarMonto} disabled={guardando}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#378ADD', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                  Guardar
                </button>
                <button onClick={() => setEditandoMonto(false)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Form descuento */}
          {editandoDescuento && (
            <div style={{ background: '#fff', border: '1px solid #FAEEDA', borderRadius: 10, padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#633806', fontWeight: 500, marginBottom: 8 }}>Aplicar descuento en porcentaje</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" min="0" max="100" value={descuentoPct} onChange={e => setDescuentoPct(e.target.value)}
                  placeholder="Ej: 10"
                  style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }} />
                <span style={{ fontSize: 13, color: '#888' }}>%</span>
                {descuentoPct && !isNaN(parseFloat(descuentoPct)) && (
                  <span style={{ fontSize: 12, color: '#633806' }}>
                    = - {formatCOP(ingreso.monto_total * (parseFloat(descuentoPct) / 100))}
                  </span>
                )}
                <button onClick={aplicarDescuento} disabled={guardando}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#633806', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
                  Aplicar
                </button>
                <button onClick={() => setEditandoDescuento(false)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', fontSize: 12, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
              {ingreso.descuento_pct > 0 && (
                <button onClick={() => { setDescuentoPct('0'); setTimeout(aplicarDescuento, 100) }}
                  style={{ marginTop: 8, fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Quitar descuento actual ({ingreso.descuento_pct}%)
                </button>
              )}
            </div>
          )}

          {/* Historial abonos */}
          {abonos.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 6 }}>Abonos registrados</div>
              {abonos.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: '#fff', borderRadius: 7, marginBottom: 5, border: '0.5px solid #ececec' }}>
                  <span style={{ fontSize: 12, color: '#555' }}>{a.nota || 'Abono'} · {new Date(a.created_at).toLocaleDateString('es-CO')}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#27500A' }}>{formatCOP(a.monto)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Registrar abono */}
          {ingreso.estado !== 'pagado' && ingreso.estado !== 'cancelado' && ingreso.monto_total > 0 && (
            <div style={{ borderTop: '0.5px solid #ececec', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>Registrar abono</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="number" value={montoAbono} onChange={e => setMontoAbono(e.target.value)}
                  placeholder="Monto $"
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }} />
                <input value={notaAbono} onChange={e => setNotaAbono(e.target.value)}
                  placeholder="Nota (opcional)"
                  style={{ flex: 2, padding: '8px 10px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={registrarAbono} disabled={guardando || !montoAbono}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: !montoAbono ? '#ddd' : '#378ADD', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {guardando ? 'Guardando...' : 'Registrar abono'}
                </button>
                <button onClick={marcarPagado} disabled={guardando}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#639922', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  ✓ Marcar pagado
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}


// ---- Componente principal ----
export default function Contabilidad({ onVolver, usuario }) {
  const [tab, setTab]             = useState('ingresos') // ingresos | egresos
  const [ingresos, setIngresos]   = useState([])
  const [egresos, setEgresos]     = useState([])
  const [resumen, setResumen]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')

  // Form egreso
  const [formEgreso, setFormEgreso] = useState({
    tipo: 'salario', descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0]
  })

  async function cargarDatos() {
    const [{ data: ing }, { data: egr }, { data: res }] = await Promise.all([
      supabase.from('ingresos').select('*').order('created_at', { ascending: false }),
      supabase.from('egresos').select('*').order('fecha', { ascending: false }),
      supabase.from('vista_contabilidad_mes').select('*').single()
    ])
    setIngresos(ing || [])
    setEgresos(egr || [])
    setResumen(res)
    setLoading(false)
  }

  useEffect(() => {
    cargarDatos()
    const ch = supabase.channel('contabilidad')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingresos' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'abonos' }, cargarDatos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'egresos' }, cargarDatos)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function guardarEgreso() {
    if (!formEgreso.descripcion.trim() || !formEgreso.monto) return
    setGuardando(true)
    await supabase.from('egresos').insert({
      tipo:        formEgreso.tipo,
      descripcion: formEgreso.descripcion.trim(),
      monto:       parseFloat(formEgreso.monto),
      fecha:       formEgreso.fecha,
      usuario_id:  usuario.id
    })
    setFormEgreso({ tipo: 'salario', descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0] })
    cargarDatos()
    setGuardando(false)
  }

  const ingresosFiltrados = filtroEstado === 'todos'
    ? ingresos
    : ingresos.filter(i => i.estado === filtroEstado)

  const utilidades = (resumen?.ingresos_cobrados || 0) - (resumen?.total_egresos || 0)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 40px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver}
            style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}>
            ← Volver
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Contabilidad</h2>
        </div>
        <div style={{ fontSize: 11, color: '#aaa' }}>
          {new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
      </div>

      {/* Resumen del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#EAF3DE', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#27500A', marginBottom: 4, fontWeight: 500 }}>INGRESOS MES</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#27500A' }}>{formatCOP(resumen?.ingresos_cobrados)}</div>
          <div style={{ fontSize: 10, color: '#639922', marginTop: 2 }}>esperados: {formatCOP(resumen?.ingresos_esperados)}</div>
        </div>
        <div style={{ background: '#FCEBEB', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#791F1F', marginBottom: 4, fontWeight: 500 }}>EGRESOS MES</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#791F1F' }}>{formatCOP(resumen?.total_egresos)}</div>
        </div>
        <div style={{ background: utilidades >= 0 ? '#E6F1FB' : '#FCEBEB', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: utilidades >= 0 ? '#0C447C' : '#791F1F', marginBottom: 4, fontWeight: 500 }}>UTILIDADES</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: utilidades >= 0 ? '#0C447C' : '#791F1F' }}>{formatCOP(utilidades)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #e0e0db', marginBottom: 16 }}>
        {[
          { key: 'ingresos', label: '💰 Ingresos' },
          { key: 'egresos',  label: '💸 Egresos' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #378ADD' : '2px solid transparent', color: tab === t.key ? '#0C447C' : '#888', fontSize: 14, fontWeight: tab === t.key ? 500 : 400, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- TAB INGRESOS ---- */}
      {tab === 'ingresos' && (
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {['todos', 'pendiente', 'abonado', 'pagado', 'cancelado'].map(est => {
              const activo = filtroEstado === est
              const cfg    = ESTADO_INGRESO[est]
              return (
                <button key={est} onClick={() => setFiltroEstado(est)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, border: activo ? '1.5px solid #378ADD' : '0.5px solid #ccc', background: activo ? '#E6F1FB' : 'transparent', color: activo ? '#0C447C' : '#888', cursor: 'pointer' }}>
                  {est === 'todos' ? 'Todos' : cfg?.label}
                  {est !== 'todos' && <span style={{ marginLeft: 4, opacity: .7 }}>({ingresos.filter(i => i.estado === est).length})</span>}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>Cargando...</div>
          ) : filtroEstado === 'cancelado' ? (
            ingresos.filter(i => i.estado === 'cancelado').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#888', background: '#f5f5f3', borderRadius: 12 }}>
                No hay ingresos cancelados
              </div>
            ) : (
              ingresos.filter(i => i.estado === 'cancelado').map(i => (
                <div key={i.id} style={{ background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 10, padding: '11px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#999' }}>{i.descripcion}</div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                      Cancelado · {new Date(i.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#bbb', textDecoration: 'line-through' }}>
                      {formatCOP(i.monto_total)}
                    </span>
                    <button
                      onClick={async () => {
                        if (!window.confirm('¿Eliminar este ingreso cancelado?')) return
                        await supabase.from('ingresos').delete().eq('id', i.id)
                        cargarDatos()
                      }}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#791F1F', fontSize: 12, cursor: 'pointer' }}>
                      🗑 Eliminar
                    </button>
                  </div>
                </div>
              ))
            )
          ) : ingresosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#888', background: '#f5f5f3', borderRadius: 12 }}>
              No hay ingresos registrados
            </div>
          ) : (
            ingresosFiltrados.map(i => (
              <TarjetaIngreso key={i.id} ingreso={i} onActualizar={cargarDatos} usuario={usuario} />
            ))
          )}
        </div>
      )}

      {/* ---- TAB EGRESOS ---- */}
      {tab === 'egresos' && (
        <div>
          {/* Formulario nuevo egreso */}
          <div style={{ background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: '#333' }}>Registrar egreso</div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Tipo de egreso</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(TIPO_EGRESO).map(([key, val]) => (
                  <button key={key} onClick={() => setFormEgreso({ ...formEgreso, tipo: key })}
                    style={{ padding: '6px 12px', borderRadius: 8, border: formEgreso.tipo === key ? '1.5px solid #378ADD' : '0.5px solid #ddd', background: formEgreso.tipo === key ? '#E6F1FB' : '#fff', color: formEgreso.tipo === key ? '#0C447C' : '#666', fontSize: 12, cursor: 'pointer' }}>
                    {val.emoji} {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Descripción *</label>
                <input value={formEgreso.descripcion} onChange={e => setFormEgreso({ ...formEgreso, descripcion: e.target.value })}
                  placeholder={`Ej: ${TIPO_EGRESO[formEgreso.tipo]?.label}`}
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Monto $</label>
                <input type="number" value={formEgreso.monto} onChange={e => setFormEgreso({ ...formEgreso, monto: e.target.value })}
                  placeholder="0"
                  style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Fecha</label>
              <input type="date" value={formEgreso.fecha} onChange={e => setFormEgreso({ ...formEgreso, fecha: e.target.value })}
                style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box' }} />
            </div>

            <button onClick={guardarEgreso} disabled={guardando || !formEgreso.descripcion || !formEgreso.monto}
              style={{ width: '100%', padding: 11, borderRadius: 10, border: 'none', background: !formEgreso.descripcion || !formEgreso.monto ? '#ddd' : '#791F1F', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              {guardando ? 'Guardando...' : 'Registrar egreso'}
            </button>
          </div>

          {/* Lista de egresos */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#888' }}>Cargando...</div>
          ) : egresos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#888', background: '#f5f5f3', borderRadius: 12 }}>
              No hay egresos registrados
            </div>
          ) : (
            egresos.map(e => {
              const tc = TIPO_EGRESO[e.tipo]
              return (
                <div key={e.id} style={{ background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 10, padding: '11px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{tc?.emoji} {e.descripcion}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {tc?.label} · {new Date(e.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#791F1F' }}>{formatCOP(e.monto)}</div>
                    <button
                      onClick={async () => {
                        if (!window.confirm('¿Eliminar este egreso?')) return
                        await supabase.from('egresos').delete().eq('id', e.id)
                        cargarDatos()
                      }}
                      style={{ padding: '4px 10px', borderRadius: 8, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#791F1F', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                      🗑
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
