import { ErrorPrediccion, MENSAJES_ERROR } from './errores'
import { obtenerToken } from './auth/token'
import { emitir, EVENTO_SESION_EXPIRADA } from './eventos'

const CODIGO_POR_ESTADO = {
  400: 'invalid-argument',
  401: 'unauthenticated',
  403: 'permission-denied',
  412: 'failed-precondition',
  429: 'resource-exhausted',
  500: 'internal',
  504: 'deadline-exceeded',
}

/** Tiempo maximo de espera de la respuesta, en milisegundos. */
const TIEMPO_MAXIMO_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000)

function construirUrl() {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  const ruta = String(import.meta.env.VITE_API_PREDICT_PATH ?? '/api/v1/predictions').trim()
  return `${base}${ruta.startsWith('/') ? ruta : `/${ruta}`}`
}

/**
 * Adaptador HTTP preparado para el contrato §4.9.
 *
 * Se activa con VITE_ADAPTADOR_PREDICCION=http y VITE_API_BASE_URL.
 *
 * El cuerpo enviado es { data, notas?, siniestroRef? }. La ubicacion de
 * siniestroRef queda pendiente de confirmacion (ver README).
 *
 * La cabecera `Authorization: Bearer <token>` se adjunta automaticamente
 * cuando hay una sesion vigente (§4.9). Si el servicio responde 401, el token
 * dejo de ser valido: se emite `EVENTO_SESION_EXPIRADA` para que la interfaz
 * vuelva al inicio de sesion sin perder el formulario capturado (CA-01.6).
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

  const cabeceras = { 'Content-Type': 'application/json' }
  const token = obtenerToken()
  if (token) cabeceras.Authorization = `Bearer ${token}`

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS)

  let respuesta
  try {
    respuesta = await fetch(construirUrl(), {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify(cuerpo),
      signal: controlador.signal,
    })
  } catch (causa) {
    if (causa?.name === 'AbortError') {
      throw new ErrorPrediccion(
        'El servicio de predicción no respondió dentro del tiempo esperado. Intenta nuevamente.',
        { codigo: 'deadline-exceeded', causa },
      )
    }
    throw new ErrorPrediccion(MENSAJES_ERROR.unavailable, {
      codigo: 'unavailable',
      causa,
    })
  } finally {
    clearTimeout(temporizador)
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

    if (codigo === 'unauthenticated') {
      emitir(EVENTO_SESION_EXPIRADA, { motivo: 'token-rechazado' })
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
