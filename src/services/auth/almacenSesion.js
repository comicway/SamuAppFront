/**
 * Persistencia de la sesion del operador.
 *
 * La sesion vive en `sessionStorage`: se pierde al cerrar la pestaña, que es
 * justo el comportamiento esperado de un turno de despacho. Nunca se guarda
 * en `localStorage`, y el token nunca se escribe en la URL ni en el log.
 */

const CLAVE_ALMACEN = 'samuapp-sesion'

/**
 * Devuelve el almacen de sesion, o `null` si el navegador lo bloquea.
 *
 * @returns {Storage | null}
 */
function almacen() {
  try {
    if (typeof window === 'undefined') return null
    return window.sessionStorage ?? null
  } catch {
    return null
  }
}

/**
 * Guarda la sesion vigente.
 *
 * @param {object} sesion
 * @returns {boolean} `true` si se pudo guardar.
 */
export function guardarSesion(sesion) {
  const destino = almacen()
  if (!destino) return false
  try {
    destino.setItem(CLAVE_ALMACEN, JSON.stringify(sesion))
    return true
  } catch {
    return false
  }
}

/**
 * Lee la sesion guardada.
 *
 * @returns {object | null} la sesion, o `null` si no hay o si esta corrupta.
 */
export function leerSesion() {
  const origen = almacen()
  if (!origen) return null
  try {
    const crudo = origen.getItem(CLAVE_ALMACEN)
    if (!crudo) return null
    const sesion = JSON.parse(crudo)
    return sesion && typeof sesion === 'object' ? sesion : null
  } catch {
    return null
  }
}

/**
 * Borra la sesion guardada.
 *
 * @returns {boolean} `true` si se pudo borrar.
 */
export function borrarSesion() {
  const destino = almacen()
  if (!destino) return false
  try {
    destino.removeItem(CLAVE_ALMACEN)
    return true
  } catch {
    return false
  }
}
