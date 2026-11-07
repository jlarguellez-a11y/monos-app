// src/pages/Facturas.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import LOGO_B64 from '../logoBase64'

const INFO_EMPRESA = {
  nombre: 'CONFECCIONES HERNÁNDEZ',
  propietario: 'Linda Maria Hernández Hernández - NIT 1135169001',
  direccion: 'Cra 10 #6e-57, Pereira, Risaralda, CP.660017',
  tel: 'Tel +57 3027013061',
  email: 'lyndaher18@gmail.com',
}

function formatCOP(n) {
  return '$ ' + Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })
}

// ---- VISTA PREVIA / IMPRESIÓN DE FACTURA ----
function VistaFactura({ factura, items, cliente, onCerrar }) {
  const printRef = useRef()

  function imprimir() {
    const contenido = printRef.current.innerHTML
    const ventana = window.open('', '_blank')
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo N° ${factura.numero}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
          .factura { width: 210mm; margin: 0 auto; padding: 10mm; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${contenido}
      </body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => { ventana.print(); ventana.close() }, 500)
  }

  const totalLineas = items.length
  const cantidadTotal = items.reduce((s, i) => s + i.cantidad, 0)
  const subtotal = items.reduce((s, i) => s + (i.precio_unit * i.cantidad), 0)
  const descuentoMonto = subtotal * ((factura.descuento_pct || 0) / 100)
  const total = subtotal - descuentoMonto
  const filasVacias = Math.max(0, 15 - items.length)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, overflow: 'auto', padding: '20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'flex-end' }}>
          <button onClick={imprimir}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#378ADD', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            🖨️ Imprimir / Exportar PDF
          </button>
          <button onClick={onCerrar}
            style={{ padding: '10px 20px', borderRadius: 8, border: '0.5px solid #ddd', background: '#fff', fontSize: 14, cursor: 'pointer' }}>
            ✕ Cerrar
          </button>
        </div>

        <div ref={printRef} style={{ background: '#fff', padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: 11 }}>
          <div className="factura">
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, borderBottom: '2px solid #000', paddingBottom: 10 }}>
              <img src={LOGO_B64} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
              <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 3 }}>{INFO_EMPRESA.nombre}</div>
                <div style={{ fontSize: 10, marginBottom: 2 }}>{INFO_EMPRESA.propietario}</div>
                <div style={{ fontSize: 10, marginBottom: 2 }}>{INFO_EMPRESA.direccion}</div>
                <div style={{ fontSize: 10, marginBottom: 2 }}>{INFO_EMPRESA.tel}</div>
                <div style={{ fontSize: 10, color: '#0000EE', textDecoration: 'underline' }}>{INFO_EMPRESA.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold' }}>RECIBO N°</div>
                <div style={{ fontSize: 32, fontWeight: 'bold' }}>{factura.numero}</div>
              </div>
            </div>

            {/* DATOS CLIENTE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, border: '1px solid #000' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f0f0f0', border: '0.5px solid #ccc', width: 80, fontSize: 10 }}>SEÑORES</td>
                  <td style={{ padding: '3px 6px', border: '0.5px solid #ccc', fontSize: 10, width: '45%' }}>{cliente?.nombre}</td>
                  <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f0f0f0', border: '0.5px solid #ccc', fontSize: 10 }}>FECHA DEL DOCUMENTO (DD/MM/AA)</td>
                  <td style={{ padding: '3px 6px', border: '0.5px solid #ccc', fontSize: 10, textAlign: 'center' }}>
                    {new Date(factura.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f0f0f0', border: '0.5px solid #ccc', fontSize: 10 }}>DIRECCIÓN</td>
                  <td colSpan={3} style={{ padding: '3px 6px', border: '0.5px solid #ccc', fontSize: 10 }}>{cliente?.direccion}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 6px', fontWeight: 'bold', background: '#f0f0f0', border: '0.5px solid #ccc', fontSize: 10 }}>TELÉFONO</td>
                  <td style={{ padding: '3px 6px', border: '0.5px solid #ccc', fontSize: 10 }}>{cliente?.telefono}</td>
                  <td style={{ padding: '3px 6px', border: '0.5px solid #ccc', fontSize: 10 }}>
                    <strong>CIUDAD</strong> {cliente?.ciudad} &nbsp;&nbsp; <strong>NIT</strong> {cliente?.nit}
                  </td>
                  <td style={{ padding: '3px 6px', border: '0.5px solid #ccc', fontSize: 10 }}></td>
                </tr>
              </tbody>
            </table>

            {/* TABLA DE ITEMS */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr style={{ background: '#e0e0e0' }}>
                  <th style={{ border: '1px solid #000', padding: '4px 6px', fontSize: 10, width: 70 }}>Referencia</th>
                  <th style={{ border: '1px solid #000', padding: '4px 6px', fontSize: 10 }}>Ítem</th>
                  <th style={{ border: '1px solid #000', padding: '4px 6px', fontSize: 10, width: 90, textAlign: 'right' }}>Precio</th>
                  <th style={{ border: '1px solid #000', padding: '4px 6px', fontSize: 10, width: 70, textAlign: 'center' }}>Cantidad</th>
                  <th style={{ border: '1px solid #000', padding: '4px 6px', fontSize: 10, width: 90, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', fontSize: 10 }}>{item.referencia}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', fontSize: 10, fontWeight: 'bold' }}>{item.nombre}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', fontSize: 10, textAlign: 'right' }}>{formatCOP(item.precio_unit)}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', fontSize: 10, textAlign: 'center' }}>{item.cantidad}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', fontSize: 10, textAlign: 'right' }}>{formatCOP(item.precio_unit * item.cantidad)}</td>
                  </tr>
                ))}
                {Array.from({ length: filasVacias }).map((_, i) => (
                  <tr key={`empty-${i}`} style={{ height: 18 }}>
                    <td style={{ border: '1px solid #ccc' }}></td>
                    <td style={{ border: '1px solid #ccc' }}></td>
                    <td style={{ border: '1px solid #ccc' }}></td>
                    <td style={{ border: '1px solid #ccc' }}></td>
                    <td style={{ border: '1px solid #ccc' }}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* FOOTER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ width: '55%', fontSize: 9, color: '#333', paddingRight: 10 }}>
                <p style={{ marginBottom: 6 }}>Declaro haber leído y aceptado las Políticas de Garantía de CONFECCIONES HERNÁNDEZ. - No practicar retención de industria y comercio según acuerdo 41 de 2012. - El diseño final y especificaciones de todo proyecto son total responsabilidad del integrador-instalador.</p>
                <p>Este recibo se asimila en todos sus efectos a una letra de cambio de conformidad con el Art. 774 del código de comercio. Autorizo que en caso de incumplimiento de esta obligación sea reportado a las centrales de riesgo, se cobraran intereses por mora.</p>
              </div>
              <div style={{ width: '42%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 8px', fontSize: 10 }}>Subtotal</td>
                      <td style={{ padding: '3px 8px', fontSize: 10, textAlign: 'right', borderLeft: '1px solid #ccc' }}>{formatCOP(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', fontSize: 10 }}>Descuento {factura.descuento_pct || 0}%</td>
                      <td style={{ padding: '3px 8px', fontSize: 10, textAlign: 'right', borderLeft: '1px solid #ccc' }}>{descuentoMonto > 0 ? '- ' + formatCOP(descuentoMonto) : '-'}</td>
                    </tr>
                    <tr style={{ background: '#d0d0d0' }}>
                      <td style={{ padding: '3px 8px', fontSize: 11, fontWeight: 'bold' }}>Total</td>
                      <td style={{ padding: '3px 8px', fontSize: 11, fontWeight: 'bold', textAlign: 'right', borderLeft: '1px solid #ccc' }}>{formatCOP(total)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', fontSize: 10, fontWeight: 'bold' }}>Total de líneas:</td>
                      <td style={{ padding: '3px 8px', fontSize: 10, textAlign: 'right', borderLeft: '1px solid #ccc' }}>{totalLineas}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 8px', fontSize: 10, fontWeight: 'bold' }}>Cantidad total:</td>
                      <td style={{ padding: '3px 8px', fontSize: 10, textAlign: 'right', borderLeft: '1px solid #ccc' }}>{cantidadTotal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- FORMULARIO CREAR/EDITAR FACTURA ----
function FormFactura({ factura, onGuardar, onCancelar, usuario }) {
  const [clientes, setClientes]         = useState([])
  const [productos, setProductos]       = useState([])
  const [clienteId, setClienteId]       = useState(factura?.cliente_id || '')
  const [numeroFactura, setNumeroFactura] = useState(factura?.numero || '')
  const [fecha, setFecha]               = useState(factura?.fecha || new Date().toISOString().split('T')[0])
  const [descuentoPct, setDescuentoPct] = useState(factura?.descuento_pct || 0)
  const [items, setItems]               = useState([{ productoId: '', referencia: '', nombre: '', precio_unit: '', cantidad: 1 }])
  const [guardando, setGuardando]       = useState(false)
  const [mensaje, setMensaje]           = useState(null)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [agregarNuevoCliente, setAgregarNuevoCliente] = useState(false)
  const [nuevoClienteForm, setNuevoClienteForm] = useState({ nombre: '', nit: '', telefono: '', direccion: '', ciudad: '' })

  useEffect(() => {
    async function cargar() {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('productos').select('*').eq('activo', true).order('nombre')
      ])
      setClientes(c || [])
      setProductos(p || [])

      // Factura nueva: proponer el siguiente número (mayor existente + 1)
      if (!factura?.id) {
        const { data: ultima } = await supabase
          .from('facturas')
          .select('numero')
          .order('numero', { ascending: false })
          .limit(1)
        setNumeroFactura(ultima && ultima.length > 0 ? ultima[0].numero + 1 : 550)
      }
    }
    cargar()

    // Si es edición, cargar items existentes
    if (factura?.id) {
      supabase.from('factura_items').select('*').eq('factura_id', factura.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setItems(data.map(i => ({
              id: i.id,
              productoId: i.producto_id || '',
              referencia: i.referencia,
              nombre: i.nombre,
              precio_unit: i.precio_unit,
              cantidad: i.cantidad
            })))
          }
        })
    }
  }, [])

  function seleccionarProducto(index, productoId) {
    const prod = productos.find(p => p.id === productoId)
    const nuevos = [...items]
    nuevos[index] = {
      ...nuevos[index],
      productoId,
      referencia: prod?.referencia || '',
      nombre: prod?.nombre || '',
      precio_unit: prod?.precio_unit || 0,
    }
    setItems(nuevos)
  }

  function actualizarItem(index, campo, valor) {
    const nuevos = [...items]
    nuevos[index][campo] = valor
    setItems(nuevos)
  }

  function agregarLinea() {
    setItems([...items, { productoId: '', referencia: '', nombre: '', precio_unit: '', cantidad: 1 }])
  }

  function quitarLinea(index) {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotal       = items.reduce((s, i) => s + ((parseFloat(i.precio_unit) || 0) * (parseInt(i.cantidad) || 0)), 0)
  const descuentoMonto = subtotal * ((parseFloat(descuentoPct) || 0) / 100)
  const total          = subtotal - descuentoMonto

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (c.nit || '').toLowerCase().includes(busquedaCliente.toLowerCase())
  )

  async function guardarNuevoCliente() {
    if (!nuevoClienteForm.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'Escribe el nombre del cliente' })
      return
    }
    const { data, error } = await supabase.from('clientes')
      .insert({
        nombre: nuevoClienteForm.nombre.trim(),
        nit: nuevoClienteForm.nit || null,
        telefono: nuevoClienteForm.telefono || null,
        direccion: nuevoClienteForm.direccion || null,
        ciudad: nuevoClienteForm.ciudad || null
      })
      .select().single()
    if (error || !data) {
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el cliente' })
      return
    }
    setClientes(prev => [...prev, data].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')))
    setClienteId(data.id)
    setAgregarNuevoCliente(false)
    setNuevoClienteForm({ nombre: '', nit: '', telefono: '', direccion: '', ciudad: '' })
    setMensaje({ tipo: 'exito', texto: 'Cliente guardado y seleccionado' })
  }

  async function guardar() {
    if (!clienteId) { setMensaje({ tipo: 'error', texto: 'Selecciona un cliente' }); return }
    const itemsValidos = items.filter(i => i.nombre && i.cantidad > 0 && i.precio_unit > 0)
    if (itemsValidos.length === 0) { setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto' }); return }

    setGuardando(true)
    setMensaje(null)
    try {
      let facturaId = factura?.id

      if (facturaId) {
        // Actualizar factura existente (incluye el número editado)
        const numeroEditado = parseInt(numeroFactura) || factura.numero
        const { error: errUpdate } = await supabase.from('facturas').update({
          numero: numeroEditado,
          cliente_id: clienteId, fecha, descuento_pct: parseFloat(descuentoPct) || 0,
          subtotal, descuento_monto: descuentoMonto, total, updated_at: new Date().toISOString()
        }).eq('id', facturaId)
        if (errUpdate) throw errUpdate
        // Solo si el update salió bien, se reemplazan los items
        await supabase.from('factura_items').delete().eq('factura_id', facturaId)
      } else {
        // Crear factura nueva con número explícito
        let numeroFinal = parseInt(numeroFactura)
        if (!numeroFinal) {
          const { data: ultima } = await supabase
            .from('facturas')
            .select('numero')
            .order('numero', { ascending: false })
            .limit(1)
          numeroFinal = ultima && ultima.length > 0 ? ultima[0].numero + 1 : 550
        }
        const { data: nuevaFactura, error } = await supabase.from('facturas').insert({
          numero: numeroFinal,
          cliente_id: clienteId, fecha,
          descuento_pct: parseFloat(descuentoPct) || 0,
          subtotal, descuento_monto: descuentoMonto, total,
          created_by: usuario.id, estado: 'emitida'
        }).select().single()
        if (error) throw error
        facturaId = nuevaFactura.id
      }

      // Insertar items
      const { error: errItems } = await supabase.from('factura_items').insert(
        itemsValidos.map(i => ({
          factura_id: facturaId,
          producto_id: i.productoId || null,
          referencia: i.referencia,
          nombre: i.nombre,
          precio_unit: parseFloat(i.precio_unit),
          cantidad: parseInt(i.cantidad)
        }))
      )
      if (errItems) throw errItems

      onGuardar()
    } catch (e) {
      console.error(e)
      setMensaje({
        tipo: 'error',
        texto: e.code === '23505' ? 'Ese número de factura ya existe, usa otro' : 'Error al guardar la factura'
      })
    }
    setGuardando(false)
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 20px' }}>
        <button onClick={onCancelar}
          style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}>
          ← Volver
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{factura?.id ? 'Editar factura' : 'Nueva factura'}</h2>
      </div>

      {mensaje && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: mensaje.tipo === 'exito' ? '#EAF3DE' : '#FCEBEB', color: mensaje.tipo === 'exito' ? '#27500A' : '#791F1F' }}>
          {mensaje.texto}
        </div>
      )}

      {/* CLIENTE */}
      <div style={s.seccion}>
        <div style={s.titulo}>Cliente</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {[false, true].map(esNuevo => (
            <button key={String(esNuevo)} onClick={() => setAgregarNuevoCliente(esNuevo)}
              style={{ padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: agregarNuevoCliente === esNuevo ? '#E6F1FB' : 'transparent',
                color: agregarNuevoCliente === esNuevo ? '#0C447C' : '#888',
                border: agregarNuevoCliente === esNuevo ? '1.5px solid #378ADD' : '0.5px solid #ddd' }}>
              {esNuevo ? '+ Nuevo cliente' : 'Cliente existente'}
            </button>
          ))}
        </div>

        {!agregarNuevoCliente ? (
          <>
            <input
              style={{ ...s.input, marginBottom: 8 }}
              placeholder="Buscar por nombre o NIT..."
              value={busquedaCliente}
              onChange={e => { setBusquedaCliente(e.target.value); setClienteId('') }}
            />

            {busquedaCliente.trim().length > 0 && (
              <div style={{ border: '0.5px solid #ddd', borderRadius: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 8, background: '#fff' }}>
                {clientesFiltrados.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 13, color: '#aaa', textAlign: 'center' }}>
                    Sin resultados para "{busquedaCliente}"
                  </div>
                ) : clientesFiltrados.map(c => (
                  <div key={c.id}
                    onClick={() => { setClienteId(c.id); setBusquedaCliente('') }}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '0.5px solid #f0f0f0', background: clienteId === c.id ? '#E6F1FB' : '#fff', fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{c.nombre?.trim()}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {c.nit && c.nit !== 'No Registra' ? `NIT: ${c.nit}` : 'Sin NIT'} · {c.ciudad}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {busquedaCliente.trim().length === 0 && (
              <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={s.input}>
                <option value="">Selecciona un cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre?.trim()}{c.nit && c.nit !== 'No Registra' ? ` — NIT: ${c.nit}` : ''}{c.ciudad ? ` (${c.ciudad})` : ''}
                  </option>
                ))}
              </select>
            )}

            {clienteId && (() => {
              const c = clientes.find(x => x.id === clienteId)
              return c ? (
                <div style={{ marginTop: 10, background: '#f8f8f6', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{c.nombre?.trim()}</div>
                    <div><strong>Dir:</strong> {c.direccion || '—'}</div>
                    <div><strong>Ciudad:</strong> {c.ciudad || '—'} &nbsp; <strong>Tel:</strong> {c.telefono || '—'} &nbsp; <strong>NIT:</strong> {c.nit || '—'}</div>
                  </div>
                  <button onClick={() => setClienteId('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#aaa', padding: '0 4px' }}>
                    ✕
                  </button>
                </div>
              ) : null
            })()}
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Nombre *</label>
              <input style={s.input} placeholder="Nombre completo"
                value={nuevoClienteForm.nombre}
                onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nombre: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>NIT / Cédula</label>
              <input style={s.input} placeholder="Ej: 71634504"
                value={nuevoClienteForm.nit}
                onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, nit: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Teléfono</label>
              <input style={s.input} placeholder="Ej: 3128618577"
                value={nuevoClienteForm.telefono}
                onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, telefono: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Dirección</label>
              <input style={s.input} placeholder="Ej: Cra 6 # 28 - 10"
                value={nuevoClienteForm.direccion}
                onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, direccion: e.target.value })} />
            </div>
            <div>
              <label style={s.label}>Ciudad</label>
              <input style={s.input} placeholder="Ej: Montería - Córdoba"
                value={nuevoClienteForm.ciudad}
                onChange={e => setNuevoClienteForm({ ...nuevoClienteForm, ciudad: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={guardarNuevoCliente}
                style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#378ADD', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Guardar cliente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NÚMERO, FECHA Y DESCUENTO */}
      <div style={s.seccion}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={s.label}>N° de factura</label>
            <input type="number" style={s.input} placeholder="Automático"
              value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Fecha del documento</label>
            <input type="date" style={s.input} value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div>
            <label style={s.label}>Descuento general (%)</label>
            <input type="number" min="0" max="100" style={s.input} placeholder="0"
              value={descuentoPct} onChange={e => setDescuentoPct(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div style={s.seccion}>
        <div style={s.titulo}>Productos / Líneas de la factura</div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 80px 80px 32px', gap: 6, marginBottom: 6 }}>
          {['Ref.', 'Producto', 'Precio', 'Cant.', 'Total', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 11, fontWeight: 500, color: '#888' }}>{h}</div>
          ))}
        </div>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 80px 80px 32px', gap: 6, marginBottom: 8 }}>
            <input value={item.referencia} onChange={e => actualizarItem(index, 'referencia', e.target.value)}
              placeholder="REF" style={{ ...s.input, fontFamily: 'monospace', fontSize: 11 }} />
            <select value={item.productoId}
              onChange={e => seleccionarProducto(index, e.target.value)}
              style={s.input}>
              <option value="">Seleccionar...</option>
              {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <input type="number" value={item.precio_unit}
              onChange={e => actualizarItem(index, 'precio_unit', e.target.value)}
              placeholder="0" style={{ ...s.input, textAlign: 'right' }} />
            <input type="number" min="1" value={item.cantidad}
              onChange={e => actualizarItem(index, 'cantidad', e.target.value)}
              style={{ ...s.input, textAlign: 'center' }} />
            <div style={{ ...s.input, textAlign: 'right', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 12 }}>
              {formatCOP((parseFloat(item.precio_unit) || 0) * (parseInt(item.cantidad) || 0))}
            </div>
            <button onClick={() => quitarLinea(index)}
              style={{ width: 32, height: 36, borderRadius: 6, border: '0.5px solid #ddd', background: '#FCEBEB', color: '#791F1F', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
              ×
            </button>
          </div>
        ))}
        <button onClick={agregarLinea}
          style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px dashed #aaa', background: 'transparent', color: '#555', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
          + Agregar línea
        </button>
      </div>

      {/* RESUMEN */}
      <div style={{ background: '#f8f8f6', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#666' }}>Subtotal</span>
          <span>{formatCOP(subtotal)}</span>
        </div>
        {descuentoPct > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: '#633806' }}>
            <span>Descuento {descuentoPct}%</span>
            <span>- {formatCOP(descuentoMonto)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, borderTop: '0.5px solid #ddd', paddingTop: 8 }}>
          <span>Total</span>
          <span style={{ color: '#0C447C' }}>{formatCOP(total)}</span>
        </div>
      </div>

      <button onClick={guardar} disabled={guardando}
        style={{ width: '100%', padding: 14, borderRadius: 10, border: 'none', background: guardando ? '#aaa' : '#378ADD', color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
        {guardando ? 'Guardando...' : (factura?.id ? 'Guardar cambios' : 'Crear factura')}
      </button>
    </div>
  )
}

// ---- COMPONENTE PRINCIPAL ----
export default function Facturas({ onVolver, usuario }) {
  const [facturas, setFacturas]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [vista, setVista]                 = useState('lista')
  const [facturaEditar, setFacturaEditar] = useState(null)
  const [facturaVer, setFacturaVer]       = useState(null)
  const [itemsVer, setItemsVer]           = useState([])
  const [clienteVer, setClienteVer]       = useState(null)
  const [busqueda, setBusqueda]           = useState('')

  async function cargarFacturas() {
    const { data } = await supabase
      .from('facturas')
      .select('*, clientes(nombre, nit, ciudad)')
      .order('numero', { ascending: false })
    setFacturas(data || [])
    setLoading(false)
  }

  useEffect(() => { cargarFacturas() }, [])

  async function verFactura(factura) {
    const [{ data: items }, { data: cliente }] = await Promise.all([
      supabase.from('factura_items').select('*').eq('factura_id', factura.id).order('created_at'),
      supabase.from('clientes').select('*').eq('id', factura.cliente_id).single()
    ])
    setFacturaVer(factura)
    setItemsVer(items || [])
    setClienteVer(cliente)
  }

  async function eliminarFactura(factura) {
    if (!window.confirm(`¿Eliminar la factura N° ${factura.numero}?`)) return
    await supabase.from('facturas').delete().eq('id', factura.id)
    cargarFacturas()
  }

  const facturasFiltradas = facturas.filter(f =>
    String(f.numero).includes(busqueda) ||
    f.clientes?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (vista === 'nueva' || vista === 'editar') {
    return (
      <FormFactura
        factura={facturaEditar}
        usuario={usuario}
        onCancelar={() => { setVista('lista'); setFacturaEditar(null) }}
        onGuardar={() => { cargarFacturas(); setVista('lista'); setFacturaEditar(null) }}
      />
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px 40px' }}>
      {facturaVer && (
        <VistaFactura
          factura={facturaVer}
          items={itemsVer}
          cliente={clienteVer}
          onCerrar={() => setFacturaVer(null)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver}
            style={{ background: 'none', border: '0.5px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555' }}>
            ← Volver
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Facturas</h2>
        </div>
        <button onClick={() => { setFacturaEditar(null); setVista('nueva') }}
          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#378ADD', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          + Nueva factura
        </button>
      </div>

      <input style={{ ...s.input, marginBottom: 14 }} placeholder="Buscar por número o cliente..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Cargando...</div>
      ) : facturasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 20px', color: '#888', background: '#f5f5f3', borderRadius: 12 }}>
          No hay facturas registradas
        </div>
      ) : (
        facturasFiltradas.map(f => (
          <div key={f.id} style={{ background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#0C447C' }}>N° {f.numero}</span>
                <span style={{ fontSize: 13, color: '#888', marginLeft: 10 }}>{f.clientes?.nombre}</span>
                <span style={{ fontSize: 11, color: '#aaa', marginLeft: 8 }}>{f.clientes?.ciudad}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{formatCOP(f.total)}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>
                  {new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => verFactura(f)}
                style={{ padding: '5px 14px', borderRadius: 8, border: '0.5px solid #378ADD', background: '#E6F1FB', color: '#0C447C', fontSize: 12, cursor: 'pointer' }}>
                👁 Ver / Imprimir
              </button>
              <button onClick={() => { setFacturaEditar(f); setVista('editar') }}
                style={{ padding: '5px 14px', borderRadius: 8, border: '0.5px solid #ddd', background: '#f5f5f3', color: '#555', fontSize: 12, cursor: 'pointer' }}>
                ✏️ Editar
              </button>
              <button onClick={() => eliminarFactura(f)}
                style={{ padding: '5px 14px', borderRadius: 8, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#791F1F', fontSize: 12, cursor: 'pointer' }}>
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const s = {
  seccion: { background: '#fff', border: '0.5px solid #e0e0db', borderRadius: 12, padding: '14px 16px', marginBottom: 14 },
  titulo:  { fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 12 },
  label:   { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 },
  input:   { width: '100%', padding: '9px 11px', borderRadius: 8, border: '0.5px solid #ddd', fontSize: 13, boxSizing: 'border-box', background: '#fff' }
}
