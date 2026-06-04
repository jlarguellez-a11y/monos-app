// src/supabaseClient.js
// Este archivo conecta tu app con Supabase
// Las credenciales vienen del archivo .env que tú creas

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// ============================================================
// FUNCIONES DE PEDIDOS
// ============================================================

// Obtener todos los pedidos con resumen (para el líder)
export async function getPedidos() {
  const { data, error } = await supabase
    .from('vista_pedidos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Obtener pedidos activos para una operaria (en_proceso o pendiente)
export async function getPedidosActivos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      clientes(nombre, entidad),
      pedido_items(
        *,
        productos(nombre, tipo, variante)
      )
    `)
    .in('estado', ['pendiente', 'en_proceso'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Cambiar el estado de un pedido
export async function cambiarEstadoPedido(pedidoId, nuevoEstado) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', pedidoId)
    .select()
  if (error) throw error
  return data
}

// Crear un nuevo pedido con sus items
export async function crearPedido({ clienteId, fechaEntrega, notas, items, userId }) {
  // 1. Crear el pedido
  const { data: pedido, error: pe } = await supabase
    .from('pedidos')
    .insert({ cliente_id: clienteId, fecha_entrega: fechaEntrega, notas, created_by: userId })
    .select()
    .single()
  if (pe) throw pe

  // 2. Crear los items del pedido
  const itemsData = items.map(item => ({
    pedido_id: pedido.id,
    producto_id: item.productoId,
    cantidad_pedida: item.cantidad
  }))
  const { error: ie } = await supabase.from('pedido_items').insert(itemsData)
  if (ie) throw ie

  // 3. Cambiar estado a en_proceso si se indica
  return pedido
}

// ============================================================
// FUNCIONES DE PRODUCCIÓN
// ============================================================

// Registrar bases producidas o moños terminados
export async function registrarProduccion({ pedidoItemId, tipoRegistro, cantidad, userId }) {
  const { data, error } = await supabase
    .from('registros_produccion')
    .insert({
      pedido_item_id: pedidoItemId,
      tipo_registro: tipoRegistro, // 'base' o 'terminado'
      cantidad,
      usuario_id: userId
    })
    .select()
  if (error) throw error
  return data
}

// ============================================================
// FUNCIONES DE INVENTARIO
// ============================================================

// Obtener todas las materias primas con alerta de stock bajo
export async function getMateriasPrimas() {
  const { data, error } = await supabase
    .from('materias_primas')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data.map(m => ({
    ...m,
    alerta: m.stock_actual <= m.stock_minimo
  }))
}

// Registrar entrada o salida de materia prima
export async function registrarMovimiento({ materiaId, tipo, cantidad, motivo, userId }) {
  const { data, error } = await supabase
    .from('movimientos_inventario')
    .insert({ materia_id: materiaId, tipo, cantidad, motivo, usuario_id: userId })
    .select()
  if (error) throw error
  return data
}

// ============================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    console.error('Error login:', error.message)
    throw error
  }
  console.log('Login exitoso:', data)
  return data
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUsuarioActual() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_id', user.id)
    .single()
  return data
}

// ============================================================
// SUSCRIPCIÓN EN TIEMPO REAL (para el líder)
// ============================================================

// Llama esta función en el componente del líder para recibir
// actualizaciones en tiempo real sin recargar la página
export function suscribirPedidos(callback) {
  const channel = supabase
    .channel('pedidos-realtime')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'pedidos' },
      callback
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'pedido_items' },
      callback
    )
    .subscribe()

  // Retorna función para cancelar la suscripción al desmontar el componente
  return () => supabase.removeChannel(channel)
}
