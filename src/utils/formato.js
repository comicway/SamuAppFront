const FORMATO_UN_DECIMAL = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function numero1(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? FORMATO_UN_DECIMAL.format(numero) : 'No informado'
}

export function porcentaje(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero)) return 'No informado'
  return `${FORMATO_UN_DECIMAL.format(numero * 100)} %`
}

export function valorTexto(valor) {
  if (valor === null || valor === undefined || valor === '') return 'No informado'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : 'No informado'
  if (typeof valor === 'string') return valor
  return JSON.stringify(valor)
}

export function valorBooleano(valor) {
  if (valor === true) return 'Sí'
  if (valor === false) return 'No'
  return 'No informado'
}

export function valorEntero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? String(Math.trunc(numero)) : 'No informado'
}
