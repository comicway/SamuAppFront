export class ErrorPrediccion extends Error {
  constructor(mensaje, { codigo = 'internal', causa = null } = {}) {
    super(mensaje)
    this.name = 'ErrorPrediccion'
    this.codigo = codigo
    this.causa = causa
  }
}

// Mensajes alineados con la tabla de errores de §4.9.
export const MENSAJES_ERROR = {
  unauthenticated:
    'La sesión no es válida o venció. Vuelve a iniciar sesión; el formulario se conserva.',
  'permission-denied': 'Tu rol no tiene permiso para realizar esta predicción.',
  'invalid-argument': 'El servicio rechazó el payload por no cumplir el esquema o los rangos.',
  'failed-precondition': 'Los artefactos del modelo no están disponibles o están corruptos.',
  'resource-exhausted': 'Se alcanzó el límite de instancias. Reintenta en unos segundos.',
  'deadline-exceeded': 'La inferencia excedió el tiempo máximo. Reintenta.',
  internal: 'Ocurrió un error no controlado en el servicio de predicción.',
  unavailable: 'No fue posible contactar el servicio de predicción.',
}
