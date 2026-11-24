import { numero1, porcentaje } from '../utils/formato'

const ORDEN_NIVELES = ['ESTANDAR', 'REFORZADO', 'ALERTA_HOSPITAL', 'CRITICO']

const FRANJAS_PROBABILIDAD = ['< 10 %', '10–30 %', '30–60 %', '> 60 %']
const FRANJAS_VICTIMAS = ['< 0,3', '0,3–1,0', '1,0–3,0', '> 3,0']

function nivelPorProbabilidad(pFatal) {
  if (pFatal < 0.1) return 0
  if (pFatal < 0.3) return 1
  if (pFatal <= 0.6) return 2
  return 3
}

function nivelPorVictimas(victimasGraves) {
  if (victimasGraves < 0.3) return 0
  if (victimasGraves < 1.0) return 1
  if (victimasGraves <= 3.0) return 2
  return 3
}

/**
 * Cálculo de respaldo con RN-01 a RN-08. Solo se usa cuando la respuesta
 * del servicio no trae "recomendacion". No es un modelo: son reglas de despacho.
 *
 * RN-01: ambulancias = max(1, floor(VG * 1,5))
 * RN-02: helicóptero = VG > 1,0
 * RN-03: alerta hospitalaria = VG > 0,5
 * RN-04..07: franjas de P(fatal) y VG para el nivel de alerta
 * RN-08: mínimo una ambulancia
 *
 * Supuesto documentado: si P(fatal) y VG caen en franjas distintas, se toma
 * la franja más severa (criterio conservador), porque RN-04..07 usan "y".
 */
export function calcularRecomendacion({ pFatal, victimasGravesPred }) {
  const p = Number(pFatal)
  const vg = Number(victimasGravesPred)

  if (!Number.isFinite(p) || !Number.isFinite(vg)) return null

  const ambulancias = Math.max(1, Math.floor(vg * 1.5)) // RN-01 + RN-08
  const helicoptero = vg > 1.0 // RN-02
  const alertaHospital = vg > 0.5 // RN-03

  const nivelP = nivelPorProbabilidad(p)
  const nivelVG = nivelPorVictimas(vg)
  const indiceNivel = Math.max(nivelP, nivelVG)
  const nivelAlerta = ORDEN_NIVELES[indiceNivel]

  // RN-05 exige paramédico en el despacho reforzado; los niveles superiores
  // heredan ese recurso por ser más severos.
  const paramedico = indiceNivel >= 1

  let fundamento =
    `P(fatal) ${porcentaje(p)} (franja ${FRANJAS_PROBABILIDAD[nivelP]}) y ` +
    `${numero1(vg)} víctimas graves estimadas (franja ${FRANJAS_VICTIMAS[nivelVG]}). ` +
    `Ambulancias = max(1, floor(${numero1(vg)} × 1,5)) = ${ambulancias}.`

  if (nivelP !== nivelVG) {
    fundamento +=
      ' P(fatal) y las víctimas graves caen en franjas distintas: se aplicó la más severa.'
  }

  return {
    ambulancias,
    paramedico,
    helicoptero,
    alertaHospital,
    nivelAlerta,
    fundamento,
  }
}
