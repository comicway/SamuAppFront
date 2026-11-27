/**
 * Proveedor de identidad contra Firebase Authentication.
 *
 * Es la via de produccion (§4.10): el token lo emite Identity Platform y la
 * SPA lo adjunta en la cabecera `Authorization: Bearer <token>`. El servicio
 * lo verifica en cada peticion y toma el `uid` del token verificado.
 *
 * Se usa la API REST de Identity Platform (`accounts:signInWithPassword` y
 * `accounts:signUp`) en lugar del SDK: son las mismas llamadas que hace el
 * SDK bajo el capote y asi la SPA no arrastra una dependencia mas.
 *
 * La clave de API (`VITE_FIREBASE_API_KEY`) no es un secreto: viaja en el
 * bundle del navegador en toda aplicacion Firebase. Lo que si es secreto, la
 * credencial de servicio, nunca llega al cliente.
 */

import { ErrorAutenticacion, MENSAJES_ACCESO } from '../errores'

const BASE_IDENTIDAD = 'https://identitytoolkit.googleapis.com/v1/accounts'

/**
 * Traduce los codigos de error de Identity Platform a la taxonomia del
 * contrato §4.9.
 *
 * @param {string} codigo
 * @returns {string}
 */
function traducirCodigo(codigo) {
  switch (codigo) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'USER_DISABLED':
      return 'unauthenticated'
    case 'EMAIL_EXISTS':
      return 'invalid-argument'
    case 'INVALID_EMAIL':
    case 'WEAK_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return 'invalid-argument'
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
    case 'OPERATION_NOT_ALLOWED':
      return 'failed-precondition'
    default:
      return 'internal'
  }
}

/**
 * Devuelve la clave de API configurada.
 *
 * @returns {string}
 */
function claveApi() {
  return String(import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim()
}

/**
 * Decodifica el contenido de un JWT sin verificar su firma.
 *
 * La verificacion ocurre en el servidor, que es la unica fuente de verdad.
 * Aqui solo se leen los claims que la interfaz necesita mostrar.
 *
 * @param {string} token
 * @returns {object | null}
 */
export function decodificarClaims(token) {
  const partes = String(token ?? '').split('.')
  if (partes.length < 2) return null
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const relleno = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : ''
    const binario = atob(base64 + relleno)
    const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0))
    const texto = new TextDecoder().decode(bytes)
    const claims = JSON.parse(texto)
    return claims && typeof claims === 'object' ? claims : null
  } catch {
    return null
  }
}

/**
 * Convierte la respuesta de Identity Platform en una sesion del cliente.
 *
 * @param {object} cuerpo
 * @param {{nombre?: string | null}} [extra]
 * @returns {object}
 */
function aSesion(cuerpo, extra = {}) {
  const token = String(cuerpo?.idToken ?? '')
  if (!token) {
    throw new ErrorAutenticacion('Firebase no devolvió un token de sesión.', {
      codigo: 'internal',
    })
  }

  const claims = decodificarClaims(token) ?? {}
  const expiraEn = Number(claims.exp ?? 0) * 1000

  return {
    token,
    uid: String(claims.user_id ?? cuerpo?.localId ?? ''),
    rol: String(claims.rol ?? claims.role ?? 'operador'),
    correo: String(claims.email ?? cuerpo?.email ?? ''),
    nombre: extra.nombre ?? (claims.name ? String(claims.name) : null),
    expiraEn: expiraEn > 0 ? expiraEn : 0,
    modo: 'firebase',
  }
}

/**
 * Llama a un endpoint de Identity Platform.
 *
 * @param {string} operacion
 * @param {object} cuerpo
 * @returns {Promise<object>}
 */
async function llamar(operacion, cuerpo) {
  const clave = claveApi()
  if (!clave) {
    throw new ErrorAutenticacion(
      'Falta VITE_FIREBASE_API_KEY. Configura la clave de API de tu proyecto de Firebase.',
      { codigo: 'failed-precondition' },
    )
  }

  let respuesta
  try {
    respuesta = await fetch(`${BASE_IDENTIDAD}/${operacion}?key=${encodeURIComponent(clave)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cuerpo, returnSecureToken: true }),
    })
  } catch (causa) {
    throw new ErrorAutenticacion(MENSAJES_ACCESO.unavailable, {
      codigo: 'unavailable',
      causa,
    })
  }

  if (!respuesta.ok) {
    let codigoRemoto = ''
    let mensajeRemoto = ''
    try {
      const json = await respuesta.json()
      codigoRemoto = String(json?.error?.message ?? '')
      mensajeRemoto = String(json?.error?.error?.message ?? '')
    } catch {
      codigoRemoto = ''
    }

    const codigo = traducirCodigo(codigoRemoto.split(' : ')[0])
    if (codigo === 'unauthenticated') {
      throw new ErrorAutenticacion(MENSAJES_ACCESO.unauthenticated, { codigo })
    }
    if (codigo === 'invalid-argument') {
      throw new ErrorAutenticacion(
        mensajeRemoto === 'WEAK_PASSWORD'
          ? `La contraseña debe tener al menos 12 caracteres (CA-01.3).`
          : MENSAJES_ACCESO['invalid-argument'],
        { codigo },
      )
    }
    throw new ErrorAutenticacion(MENSAJES_ACCESO[codigo] ?? MENSAJES_ACCESO.internal, {
      codigo,
    })
  }

  return respuesta.json()
}

/**
 * Inicia sesion con correo y contrasena.
 *
 * @param {{correo: string, contrasena: string}} datos
 * @returns {Promise<object>} la sesion emitida por Firebase.
 */
export async function iniciarSesionEnFirebase({ correo, contrasena }) {
  const cuerpo = await llamar('signInWithPassword', {
    email: String(correo ?? '').trim().toLowerCase(),
    password: String(contrasena ?? ''),
  })
  return aSesion(cuerpo)
}

/**
 * Registra un operador nuevo.
 *
 * @param {{nombre: string, correo: string, contrasena: string}} datos
 * @returns {Promise<object>} la sesion emitida por Firebase.
 */
export async function registrarEnFirebase({ nombre, correo, contrasena }) {
  const cuerpo = await llamar('signUp', {
    email: String(correo ?? '').trim().toLowerCase(),
    password: String(contrasena ?? ''),
    displayName: String(nombre ?? '').trim(),
  })
  return aSesion(cuerpo, { nombre: String(nombre ?? '').trim() })
}
