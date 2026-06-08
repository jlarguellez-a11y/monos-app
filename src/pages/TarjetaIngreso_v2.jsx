// Reemplaza SOLO la función TarjetaIngreso en src/pages/Contabilidad.jsx

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
