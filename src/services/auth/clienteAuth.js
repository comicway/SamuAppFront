/**
 * Fachada del subsistema de identidad (HU-01).
 *
 * Concentra las tres piezas del subsistema y deja una sola puerta de entrada
 * para la interfaz:
 *
 * * `proveedorBackend` -> el servicio SAMUAPP en modo de desarrollo.
 * * `proveedorFirebase` -> Identity Platform, la via de produccion (§4.10).
 * * `proveedorDemo` -> identidad local, sin red, para trabajar sin servicio.
 *
 * El modo se elige con `VITE_AUTH_MODE`:
 *
 * | Valor      | Comportamiento                                              |
 * | ---------- | ----------------------------------------------------------- |
 * | `off`      | No hay control de acceso: la aplicacion abre directo.        |
 * | `demo`     | Ingreso contra el servicio; si no responde, identidad local.  |
 * | `firebase` | Ingreso contra Firebase Authentication.                      |
 */

import { esSesionExpirada, normalizarCorreo, normalizarRol } from '../../domain/sesion'
import { ErrorAutenticacion } from '../errores'
import { borrarSesion, guardarSesion, leerSesion } from './almacenSesion'
import { iniciarSesionEnServicio, registrarEnServicio } from './proveedorBackend'
import { iniciarSesionEnFirebase, registrarEnFirebase } from './proveedorFirebase'
import { establecerToken, limpiarToken } from './token'

/** Modo de autenticacion configurado. */
export const MODO_AUTH = String(import.meta.env.VITE_AUTH_MODE ?? 'demo')
  .trim()
  .toLowerCase()

/** `true` cuando el control de acceso esta activo. */
export const ES_CONTROL_ACCESO = MODO_AUTH !== 'off'

/** `true` cuando el proveedor de identidad es Firebase Authentication. */
export const ES_MODO_FIREBASE = MODO_AUTH === 'firebase'

/** Identidad local de demostracion: no usa la red y no habilita el servicio real. */
export const SESION_DEMO = {
  token: null,
  uid: 'demo-operador',
  rol: 'operador',
  correo: 'demo@samuapp.local',
  nombre: 'Operador en modo demostración',
  expiraEn: 0,
  modo: 'demo',
}

/**
 * Inicia sesion con el proveedor configurado.
 *
 * @param {{correo: string, contrasena: string}} datos
 * @returns {Promise<object>} la sesion vigente.
 */
export async function iniciarSesion(datos) {
  const correo = normalizarCorreo(datos?.correo)
  const contrasena = String(datos?.contrasena ?? '')

  const sesion = ES_MODO_FIREBASE
    ? await iniciarSesionEnFirebase({ correo, contrasena })
    : await iniciarSesionEnServicio({ correo, contrasena })

  return fijarSesion(sesion)
}

/**
 * Registra un operador nuevo con el proveedor configurado.
 *
 * @param {{nombre: string, correo: string, contrasena: string, rol: string}} datos
 * @returns {Promise<object>} la sesion vigente.
 */
export async function registrarCuenta(datos) {
  const nombre = String(datos?.nombre ?? '').trim()
  const correo = normalizarCorreo(datos?.correo)
  const contrasena = String(datos?.contrasena ?? '')
  const rol = normalizarRol(datos?.rol) || 'operador'

  const sesion = ES_MODO_FIREBASE
    ? await registrarEnFirebase({ nombre, correo, contrasena })
    : await registrarEnServicio({ nombre, correo, contrasena, rol })

  return fijarSesion(sesion)
}

/**
 * Abre la identidad local de demostracion.
 *
 * Solo tiene sentido con el adaptador de prediccion `mock`: sin token no hay
 * forma de llamar al servicio real.
 *
 * @returns {object} la sesion de demostracion.
 */
export function iniciarSesionDemo() {
  return fijarSesion({ ...SESION_DEMO })
}

/**
 * Guarda la sesion y publica el token para los adaptadores HTTP.
 *
 * @param {object} sesion
 * @returns {object} la sesion guardada.
 */
function fijarSesion(sesion) {
  establecerToken(sesion?.token ?? null)
  guardarSesion(sesion)
  return sesion
}

/**
 * Cierra la sesion: borra el token y la sesion guardada.
 */
export function cerrarSesion() {
  limpiarToken()
  borrarSesion()
}

/**
 * Restaura la sesion guardada al recargar la pagina.
 *
 * @returns {object | null} la sesion vigente, o `null` si no hay o vencio.
 */
export function restaurarSesion() {
  const sesion = leerSesion()
  if (!sesion) return null
  if (esSesionExpirada(sesion)) {
    cerrarSesion()
    return null
  }
  establecerToken(sesion.token ?? null)
  return sesion
}

/**
 * Indica si el proveedor configurado esta disponible.
 *
 * @returns {boolean}
 */
export function proveedorDisponible() {
  if (ES_MODO_FIREBASE) {
    return Boolean(String(import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim())
  }
  return Boolean(String(import.meta.env.VITE_API_BASE_URL ?? '').trim())
}

/**
 * Traduce un fallo del proveedor a un mensaje presentable.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function mensajeDeError(error) {
  if (error instanceof ErrorAutenticacion) return error.message
  if (error instanceof Error && error.message) return error.message
  return 'No fue posible iniciar sesión. Intenta nuevamente.'
}
