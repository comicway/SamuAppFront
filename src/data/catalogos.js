// Catálogos cerrados del formulario. No se agregan valores fuera de las fuentes.

export const SEXOS = [
  { valor: 'M', etiqueta: 'Masculino (M)' },
  { valor: 'F', etiqueta: 'Femenino (F)' },
  { valor: 'ND', etiqueta: 'No disponible (ND)' },
]

export const SEXOS_VALORES = SEXOS.map((sexo) => sexo.valor)

// Los 18 valores indicados en el enunciado de la tarea.
// Pendiente: el ejemplo de §4.9 escribe "Camión" con tilde; ver README.
export const TIPOS_VEHICULO = [
  'Auto',
  'Camioneta',
  'Furgon',
  'Jeep',
  'Moto',
  'Motoneta',
  'Bicicleta',
  'Bus',
  'Camion',
  'Tracto',
  'Taxi',
  'Minibus',
  'Ambulancia',
  'Fuga',
  'Tractor',
  'Maquinaria',
  'TraccionAnimal',
  'Otro',
]

export const TIPOS_VEHICULO_VALORES = TIPOS_VEHICULO

export const CARACTERES = [
  { valor: 'true', etiqueta: 'Urbano' },
  { valor: 'false', etiqueta: 'Rural' },
]

// NivelAlerta definido en el diagrama de clases de la Etapa 3.
export const NIVELES_ALERTA = {
  ESTANDAR: { etiqueta: 'Estándar', tono: 'success' },
  REFORZADO: { etiqueta: 'Reforzado', tono: 'secondary' },
  ALERTA_HOSPITAL: { etiqueta: 'Alerta hospitalaria', tono: 'error' },
  CRITICO: { etiqueta: 'Crítico', tono: 'critical' },
}

export function describirNivelAlerta(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return { etiqueta: 'No informado', tono: 'neutral' }
  }

  const clave = String(valor).trim().toUpperCase()
  if (NIVELES_ALERTA[clave]) return NIVELES_ALERTA[clave]

  // Valor no catalogado: se muestra tal cual, solo con formato legible.
  const legible = String(valor)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (letra) => letra.toUpperCase())

  return { etiqueta: legible, tono: 'neutral' }
}

export function describirModo(valor) {
  if (valor === null || valor === undefined || valor === '') return 'No informado'

  const clave = String(valor).trim().toLowerCase()
  if (clave === 'modelo') return 'Modelo'
  if (clave === 'degradado') return 'Degradado'
  if (clave === 'demo') return 'Demo (mock)'
  return String(valor)
}

export const MAX_INVOLUCRADOS = 10
