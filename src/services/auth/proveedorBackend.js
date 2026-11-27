/**
 * Proveedor de identidad contra el servicio SAMUAPP.
 *
 * Consume los dos endpoints de identidad que expone el backend:
 *
 * * `POST /api/v1/auth/sesion` -> inicia sesion y devuelve el token.
 * * `POST /api/v1/auth/registro` -> crea la cuenta y devuelve el token.
 *
 * Ambos existen solo cuando el servicio corre con `SAMUAPP_AUTH_MODE=dev`.
 * En produccion el token lo emite Firebase Authentication (ver
 * `proveedorFirebase.js`).
 */

import { ErrorAutenticacion, MENSAJES_ACCESO } from '../errores'

const CODIGO_POR_ESTADO = {
  400: 'invalid-argument',
  401: 'unauthenticated',
  403: 'permission-denied',
  412: 'failed-precondition',
  429: 'resource-exhausted',
  500: 'internal',
  503: 'unavailable',
  504: 'deadline-exceeded',
}

/**
 * Construye la URL de un endpoint del servicio a partir del entorno.
 *
 * @param {string} ruta
 * @returns {string}
 */
function construirUrl(ruta) {
  const base = String(import.meta.env.VITE_API_BASE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  const camino = String(ruta ?? '').trim()
  return `${base}${camino.startsWith('/') ? camino : `/${camino}`}`
}

/**
 * Traduce la respuesta del servicio a una sesion del cliente.
 *
 * @param {object} cuerpo
 * @returns {{token: string, uid: string, rol: string, correo: string, nombre: string | null, expiraEn: number, modo: string}}
 */
function aSesion(cuerpo) {
  if (!cuerpo || typeof cuerpo.token !== 'string' || !cuerpo.token) {
    throw new ErrorAutenticacion(
      'El servicio de identidad no devolvió un token de sesión.',
      { codigo: 'internal' },
    )
  }

  return {
    token: cuerpo.token,
    uid: String(cuerpo.uid ?? ''),
    rol: String(cuerpo.rol ?? 'operador'),
    correo: String(cuerpo.correo ?? ''),
    nombre: cuerpo.nombre ? String(cuerpo.nombre) : null,
    expiraEn: Number(cuerpo.expiraEn ?? 0),
    modo: String(cuerpo.modo ?? 'dev'),
  }
}

/**
 * Ejecuta una peticion de identidad y traduce los errores del contrato.
 *
 * @param {string} ruta
 * @param {object} cuerpo
 * @returns {Promise<object>} la sesion emitida por el servicio.
 */
async function pedirSesion(ruta, cuerpo) {
  const url = construirUrl(ruta)
  if (!url.startsWith('http')) {
    throw new ErrorAutenticacion(
      'El inicio de sesión necesita la URL del servicio. Configura VITE_API_BASE_URL o vuelve al modo demostración.',
      { codigo: 'failed-precondition' },
    )
  }

  let respuesta
  try {
    respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })
  } catch (causa) {
    throw new ErrorAutenticacion(MENSAJES_ACCESO.unavailable, {
      codigo: 'unavailable',
      causa,
    })
  }

  if (!respuesta.ok) {
    const codigo = CODIGO_POR_ESTADO[respuesta.status] ?? 'internal'
    let detalle = ''
    try {
      const json = await respuesta.json()
      detalle = json?.error?.message ?? ''
    } catch {
      detalle = ''
    }

    throw new ErrorAutenticacion(detalle || MENSAJES_ACCESO[codigo], { codigo })
  }

  try {
    return aSesion(await respuesta.json())
  } catch (causa) {
    if (causa instanceof ErrorAutenticacion) throw causa
    throw new ErrorAutenticacion('La respuesta del servicio de identidad no es válida.', {
      codigo: 'internal',
      causa,
    })
  }
}

/**
 * Inicia sesion contra el servicio.
 *
 * @param {{correo: string, contrasena: string}} datos
 * @returns {Promise<object>} la sesion emitida por el servicio.
 */
export function iniciarSesionEnServicio({ correo, contrasena }) {
  const ruta = import.meta.env.VITE_API_AUTH_PATH ?? '/api/v1/auth/sesion'
  return pedirSesion(ruta, { correo, contrasena })
}

/**
 * Registra un operador contra el servicio.
 *
 * @param {{nombre: string, correo: string, contrasena: string, rol: string}} datos
 * @returns {Promise<object>} la sesion emitida por el servicio.
 */
export function registrarEnServicio({ nombre, correo, contrasena, rol }) {
  const ruta = import.meta.env.VITE_API_REGISTER_PATH ?? '/api/v1/auth/registro'
  return pedirSesion(ruta, { nombre, correo, contrasena, rol })
}
