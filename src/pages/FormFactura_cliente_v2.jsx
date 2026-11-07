// Reemplaza SOLO la sección {/* CLIENTE */} en FormFactura
// Busca con Ctrl+F: {/* CLIENTE */}
// y reemplaza desde ese comentario hasta el cierre </div> de esa sección

      {/* CLIENTE */}
      <div style={s.seccion}>
        <div style={s.titulo}>Cliente</div>

        {/* Tabs: cliente existente o nuevo */}
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
            {/* Buscador en tiempo real */}
            <input
              style={{ ...s.input, marginBottom: 8 }}
              placeholder="Buscar por nombre o NIT..."
              value={busquedaCliente}
              onChange={e => {
                setBusquedaCliente(e.target.value)
                setClienteId('') // limpiar selección al buscar
              }}
            />

            {/* Lista filtrada */}
            {busquedaCliente.trim().length > 0 && (
              <div style={{ border: '0.5px solid #ddd', borderRadius: 8, maxHeight: 220, overflowY: 'auto', marginBottom: 8, background: '#fff' }}>
                {clientesFiltrados.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: 13, color: '#aaa', textAlign: 'center' }}>
                    Sin resultados para "{busquedaCliente}"
                  </div>
                ) : clientesFiltrados.map(c => (
                  <div key={c.id}
                    onClick={() => { setClienteId(c.id); setBusquedaCliente('') }}
                    style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '0.5px solid #f0f0f0',
                      background: clienteId === c.id ? '#E6F1FB' : '#fff',
                      fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{c.nombre?.trim()}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {c.nit && c.nit !== 'No Registra' ? `NIT: ${c.nit}` : 'Sin NIT'} · {c.ciudad}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Si no hay búsqueda activa, mostrar select normal */}
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

            {/* Vista previa del cliente seleccionado */}
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
          /* Formulario nuevo cliente */
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
              <button onClick={async () => {
                if (!nuevoClienteForm.nombre.trim()) return
                const { data, error } = await supabase.from('clientes')
                  .insert({ nombre: nuevoClienteForm.nombre.trim(), nit: nuevoClienteForm.nit || null, telefono: nuevoClienteForm.telefono || null, direccion: nuevoClienteForm.direccion || null, ciudad: nuevoClienteForm.ciudad || null })
                  .select().single()
                if (!error && data) {
                  setClientes(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
                  setClienteId(data.id)
                  setAgregarNuevoCliente(false)
                  setNuevoClienteForm({ nombre: '', nit: '', telefono: '', direccion: '', ciudad: '' })
                }
              }}
                style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#378ADD', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Guardar cliente
              </button>
            </div>
          </div>
        )}
      </div>
