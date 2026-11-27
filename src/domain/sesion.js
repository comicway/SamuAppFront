/**
 * Reglas de la sesion del operador (HU-01).
 *
 * Este modulo es puro: no depende de React, de la red ni del almacenamiento.
 * Todas las reglas de acceso viven aqui para que la interfaz y los
 * adaptadores apliquen exactamente la misma politica (§4.10).
 */

/** Longitud minima de la contrasena (CA-01.3 y §4.10). */
export const CLAVE_MINIMA = 12

/** Longitud maxima de la contrasena, alineada con el esquema del servicio. */
export const CLAVE_MAXIMA = 128

/** Roles del modelo de control de acceso, en orden de menor a mayor nivel. */
export const ROLES = ['operador', 'supervisor', 'admin']

/** Nivel jerarquico de cada rol: el supervisor hereda del operador y el admin del supervisor. */
export const NIVELES_ROL = {
  operador: 1,
  supervisor: 2,
  admin: 3,
}

/** Etiquetas legibles de cada rol. */
export const ETIQUETAS_ROL = {
  operador: 'Operador',
  supervisor: 'Supervisor',
  admin: 'Administrador',
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Normaliza un correo: recorta espacios y pasa a minusculas.
 *
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarCorreo(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
}

/**
 * Normaliza un rol a uno del catalogo.
 *
 * @param {unknown} valor
 * @returns {string} el rol normalizado, o `''` si no es valido.
 */
export function normalizarRol(valor) {
  const texto = String(valor ?? '')
    .trim()
    .toLowerCase()
  return ROLES.includes(texto) ? texto : ''
}

/**
 * Indica si un correo tiene forma valida.
 *
 * @param {unknown} valor
 * @returns {boolean}
 */
export function esCorreoValido(valor) {
  const correo = normalizarCorreo(valor)
  return correo.length > 0 && correo.length <= 254 && CORREO_VALIDO.test(correo)
}

/**
 * Valida las credenciales de ingreso.
 *
 * @param {{correo?: unknown, contrasena?: unknown}} datos
 * @returns {{errores: Record<string, string>, valido: boolean}}
 */
export function validarCredenciales({ correo, contrasena } = {}) {
  const errores = {}

  if (!normalizarCorreo(correo)) {
    errores.correo = 'Ingresa el correo institucional.'
  } else if (!esCorreoValido(correo)) {
    errores.correo = 'El correo no tiene un formato válido.'
  }

  const clave = String(contrasena ?? '')
  if (!clave) {
    errores.contrasena = 'Ingresa tu contraseña.'
  } else if (clave.length < CLAVE_MINIMA) {
    errores.contrasena = `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres.`
  }

  return { errores, valido: Object.keys(errores).length === 0 }
}

/**
 * Valida los datos de registro de un operador nuevo.
 *
 * @param {{nombre?: unknown, correo?: unknown, contrasena?: unknown, rol?: unknown}} datos
 * @returns {{errores: Record<string, string>, valido: boolean}}
 */
export function validarRegistro({ nombre, correo, contrasena, rol } = {}) {
  const errores = {}

  const nombreLimpio = String(nombre ?? '').trim()
  if (!nombreLimpio) {
    errores.nombre = 'Ingresa el nombre del operador.'
  } else if (nombreLimpio.length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres.'
  } else if (nombreLimpio.length > 120) {
    errores.nombre = 'El nombre no puede superar los 120 caracteres.'
  }

  if (!normalizarCorreo(correo)) {
    errores.correo = 'Ingresa el correo institucional.'
  } else if (!esCorreoValido(correo)) {
    errores.correo = 'El correo no tiene un formato válido.'
  }

  const clave = String(contrasena ?? '')
  if (!clave) {
    errores.contrasena = 'Define una contraseña.'
  } else if (clave.length < CLAVE_MINIMA) {
    errores.contrasena = `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres (CA-01.3).`
  } else if (clave.length > CLAVE_MAXIMA) {
    errores.contrasena = `La contraseña no puede superar los ${CLAVE_MAXIMA} caracteres.`
  }

  if (!normalizarRol(rol)) {
    errores.rol = 'Selecciona un rol válido.'
  }

  return { errores, valido: Object.keys(errores).length === 0 }
}

/**
 * Indica si una sesion ya vencio.
 *
 * @param {{expiraEn?: number} | null} sesion
 * @param {number} [ahora] marca de tiempo en milisegundos epoch.
 * @returns {boolean}
 */
export function esSesionExpirada(sesion, ahora = Date.now()) {
  if (!sesion) return true
  const expiraEn = Number(sesion.expiraEn)
  if (!Number.isFinite(expiraEn) || expiraEn <= 0) return false
  return expiraEn <= ahora
}

/**
 * Indica si la sesion tiene al menos el nivel del rol indicado.
 *
 * @param {{rol?: string} | null} sesion
 * @param {string} rolMinimo
 * @returns {boolean}
 */
export function tieneRol(sesion, rolMinimo) {
  if (!sesion) return false
  const nivel = NIVELES_ROL[normalizarRol(sesion.rol)] ?? 0
  const minimo = NIVELES_ROL[normalizarRol(rolMinimo)] ?? 0
  return nivel >= minimo
}

/**
 * Devuelve la etiqueta legible de un rol.
 *
 * @param {unknown} rol
 * @returns {string}
 */
export function etiquetaRol(rol) {
  const clave = normalizarRol(rol)
  return ETIQUETAS_ROL[clave] ?? 'Operador'
}
