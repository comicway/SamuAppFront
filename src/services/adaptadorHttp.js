import { ErrorPrediccion, MENSAJES_ERROR } from './errores'

const CODIGO_POR_ESTADO = {
  400: 'invalid-argument',
  401: 'unauthenticated',
  403: 'permission-denied',
  412: 'failed-precondition',
  429: 'resource-exhausted',
  500: 'internal',
  504: 'deadline-exceeded',
}

function construirUrl() {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  const ruta = String(import.meta.env.VITE_API_PREDICT_PATH ?? '/api/v1/predictions').trim()
  return `${base}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
}

/**
 * Adaptador HTTP preparado para el contrato §4.9. NO está conectado por defecto.
 * Se activa con VITE_ADAPTADOR_PREDICCION=http y VITE_API_BASE_URL.
 *
 * El cuerpo enviado es { data, notas?, siniestroRef? }. §4.9 define data y notas;
 * la ubicación de siniestroRef queda pendiente de confirmación (ver README).
 */
export async function adaptadorHttp(payload) {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()

  if (!base) {
    throw new ErrorPrediccion(
      'El adaptador HTTP está seleccionado, pero falta VITE_API_BASE_URL. Configura la variable o vuelve al adaptador mock.',
      { codigo: 'failed-precondition' },
    )
  }

  const cuerpo = { data: payload.data }
  if (payload.notas) cuerpo.notas = payload.notas
  if (payload.siniestroRef) cuerpo.siniestroRef = payload.siniestroRef

  let respuesta
  try {
    respuesta = await fetch(construirUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
  } catch (causa) {
    throw new ErrorPrediccion(MENSAJES_ERROR.unavailable, {
      codigo: 'unavailable',
      causa,
    })
  }

  if (!respuesta.ok) {
    const codigo = CODIGO_POR_ESTADO[respuesta.status] ?? 'internal'
    let detalle = ''
    try {
      const json = await respuesta.json()
      detalle = json?.error?.message ?? json?.message ?? ''
    } catch {
      detalle = ''
    }

    throw new ErrorPrediccion(detalle || MENSAJES_ERROR[codigo], { codigo })
  }

  try {
    return await respuesta.json()
  } catch (causa) {
    throw new ErrorPrediccion('La respuesta del servicio no es JSON válido.', {
      codigo: 'internal',
      causa,
    })
  }
}
