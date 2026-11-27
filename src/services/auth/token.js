/**
 * Token de identidad vigente.
 *
 * Es la costura entre la sesion y los adaptadores HTTP: el adaptador de
 * prediccion pide el token aqui y lo adjunta en la cabecera
 * `Authorization: Bearer <token>`. La sesion vive en un unico lugar, de modo
 * que el token nunca queda desincronizado con la interfaz.
 */

let token = null

/**
 * Fija el token de identidad vigente.
 *
 * @param {string | null} valor
 */
export function establecerToken(valor) {
  token = valor || null
}

/**
 * Devuelve el token de identidad vigente.
 *
 * @returns {string | null}
 */
export function obtenerToken() {
  return token
}

/**
 * Vacia el token vigente.
 */
export function limpiarToken() {
  token = null
}
