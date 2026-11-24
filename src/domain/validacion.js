import { comunasDeRegion, NOMBRES_REGIONES } from '../data/regionesComunas'
import {
  MAX_INVOLUCRADOS,
  SEXOS_VALORES,
  TIPOS_VEHICULO_VALORES,
} from '../data/catalogos'

export const HORA_MIN = 0
export const HORA_MAX = 23
export const EDAD_MIN = 0
export const EDAD_MAX = 99

export function hoyISO() {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function esFechaISOValida(fecha) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!coincidencia) return false

  const [, anio, mes, dia] = coincidencia
  const fechaObjeto = new Date(Number(anio), Number(mes) - 1, Number(dia))

  return (
    fechaObjeto.getFullYear() === Number(anio) &&
    fechaObjeto.getMonth() === Number(mes) - 1 &&
    fechaObjeto.getDate() === Number(dia)
  )
}

export function esHoraValida(hora) {
  if (hora === '' || hora === null || hora === undefined) return false
  const numero = Number(hora)
  return Number.isInteger(numero) && numero >= HORA_MIN && numero <= HORA_MAX
}

export function esEdadValida(edad) {
  if (edad === '' || edad === null || edad === undefined) return false
  const numero = Number(edad)
  return Number.isInteger(numero) && numero >= EDAD_MIN && numero <= EDAD_MAX
}

/**
 * Valida el formulario completo según CA-02.2, CA-02.3, CA-02.4 y CA-02.7.
 * Devuelve un objeto de errores indexado por ruta de campo.
 * Las claves de involucrados usan el id estable del slot, no el índice,
 * para que los errores no salten de tarjeta al quitar un involucrado.
 */
export function validarSiniestro(formulario) {
  const errores = {}

  const fecha = String(formulario.fecha ?? '').trim()
  if (!fecha) {
    errores.fecha = 'La fecha es obligatoria.'
  } else if (!esFechaISOValida(fecha)) {
    errores.fecha = 'Ingresa una fecha válida (AAAA-MM-DD).'
  } else if (fecha > hoyISO()) {
    errores.fecha = 'La fecha no puede ser futura.'
  }

  const hora = formulario.hora
  if (hora === '' || hora === null || hora === undefined) {
    errores.hora = 'La hora es obligatoria.'
  } else if (!esHoraValida(hora)) {
    errores.hora = `La hora debe ser un entero entre ${HORA_MIN} y ${HORA_MAX}.`
  }

  const region = String(formulario.region ?? '').trim()
  if (!region) {
    errores.region = 'Selecciona una región.'
  } else if (!NOMBRES_REGIONES.includes(region)) {
    errores.region = 'Selecciona una región válida de la lista.'
  }

  const comuna = String(formulario.comuna ?? '').trim()
  if (!comuna) {
    errores.comuna = region
      ? 'Selecciona una comuna de la región elegida.'
      : 'Selecciona primero una región y luego una comuna.'
  } else if (region && NOMBRES_REGIONES.includes(region)) {
    const comunasValidas = comunasDeRegion(region)
    if (!comunasValidas.includes(comuna)) {
      errores.comuna = `La comuna «${comuna}» no pertenece a la región «${region}». Elige una comuna de esa región.`
    }
  }

  if (formulario.urbano !== 'true' && formulario.urbano !== 'false') {
    errores.urbano = 'Indica si el siniestro es urbano o rural.'
  }

  const involucrados = formulario.involucrados
  if (!Array.isArray(involucrados) || involucrados.length === 0) {
    errores.involucrados = 'Registra al menos un involucrado con sexo, edad y tipo de vehículo.'
  } else {
    if (involucrados.length > MAX_INVOLUCRADOS) {
      errores.involucrados = `Puedes registrar como máximo ${MAX_INVOLUCRADOS} involucrados.`
    }

    involucrados.forEach((involucrado, indice) => {
      const prefijo = `involucrados.${involucrado.id}.`
      const numero = indice + 1

      if (!involucrado.sexo) {
        errores[`${prefijo}sexo`] = `Involucrado ${numero}: selecciona el sexo.`
      } else if (!SEXOS_VALORES.includes(involucrado.sexo)) {
        errores[`${prefijo}sexo`] = `Involucrado ${numero}: el sexo debe ser M, F o ND.`
      }

      if (involucrado.edad === '' || involucrado.edad === null || involucrado.edad === undefined) {
        errores[`${prefijo}edad`] = `Involucrado ${numero}: ingresa la edad (${EDAD_MIN} a ${EDAD_MAX}).`
      } else if (!esEdadValida(involucrado.edad)) {
        errores[`${prefijo}edad`] = `Involucrado ${numero}: la edad debe ser un entero entre ${EDAD_MIN} y ${EDAD_MAX}.`
      }

      if (!involucrado.tipo) {
        errores[`${prefijo}tipo`] = `Involucrado ${numero}: selecciona el tipo de vehículo.`
      } else if (!TIPOS_VEHICULO_VALORES.includes(involucrado.tipo)) {
        errores[`${prefijo}tipo`] = `Involucrado ${numero}: selecciona un tipo de vehículo de la lista.`
      }
    })
  }

  return {
    errores,
    valido: Object.keys(errores).length === 0,
  }
}

export function construirPayload(formulario) {
  const notas = String(formulario.notas ?? '').trim()
  const siniestroRef = String(formulario.siniestroRef ?? '').trim()

  const payload = {
    data: {
      fecha: formulario.fecha,
      hora: Number(formulario.hora),
      comuna: formulario.comuna,
      region: formulario.region,
      urbano: formulario.urbano === 'true',
      involucrados: formulario.involucrados.map((involucrado) => ({
        sexo: involucrado.sexo,
        edad: Number(involucrado.edad),
        tipo: involucrado.tipo,
      })),
    },
  }

  // notas y siniestroRef son opcionales: si están vacíos no se envían.
  if (notas) payload.notas = notas
  if (siniestroRef) payload.siniestroRef = siniestroRef

  return payload
}
