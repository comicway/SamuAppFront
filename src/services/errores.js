export class ErrorPrediccion extends Error {
  constructor(mensaje, { codigo = 'internal', causa = null } = {}) {
    super(mensaje)
    this.name = 'ErrorPrediccion'
    this.codigo = codigo
    this.causa = causa
  }
}

/**
 * Error del subsistema de identidad.
 *
 * Comparte la taxonomia de codigos del contrato §4.9, de modo que la
 * interfaz puede tratar igual un fallo de autenticacion y uno de prediccion.
 */
export class ErrorAutenticacion extends Error {
  constructor(mensaje, { codigo = 'internal', causa = null } = {}) {
    super(mensaje)
    this.name = 'ErrorAutenticacion'
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

// Mensajes propios del subsistema de identidad (HU-01).
export const MENSAJES_ACCESO = {
  'invalid-argument': 'Los datos ingresados no son válidos. Revisa el formulario.',
  unauthenticated: 'Las credenciales no son válidas.',
  'permission-denied': 'Tu rol no tiene permiso para esta operación.',
  'failed-precondition':
    'El inicio de sesión está delegado a Firebase Authentication en esta configuración.',
  unavailable: 'No fue posible contactar el servicio de identidad.',
  internal: 'Ocurrió un error no controlado durante el inicio de sesión.',
}
