/**
 * Busqueda de eventos internos de la SPA.
 *
 * Es la via por la que un adaptador de plataforma avisa a la interfaz de un
 * cambio de estado (por ejemplo, que el token vencio) sin que la interfaz
 * tenga que conocer los adaptadores.
 */

const suscriptores = new Map()

/**
 * Suscribe una funcion a un evento.
 *
 * @param {string} evento
 * @param {(detalle?: unknown) => void} manejador
 * @returns {() => void} funcion para cancelar la suscripcion.
 */
export function suscribir(evento, manejador) {
  if (!suscriptores.has(evento)) suscriptores.set(evento, new Set())
  suscriptores.get(evento).add(manejador)
  return () => {
    suscriptores.get(evento)?.delete(manejador)
  }
}

/**
 * Emite un evento.
 *
 * @param {string} evento
 * @param {unknown} [detalle]
 */
export function emitir(evento, detalle) {
  const manejadores = suscriptores.get(evento)
  if (!manejadores) return
  for (const manejador of manejadores) {
    try {
      manejador(detalle)
    } catch {
      // Un suscriptor que falla no debe tumbar al resto.
    }
  }
}

/** Evento que emite el adaptador HTTP cuando el token deja de ser valido (CA-01.6). */
export const EVENTO_SESION_EXPIRADA = 'samuapp:sesion-expirada'
