// Adaptador mock: datos de ejemplo para trabajar sin backend.
// El panel muestra "MODO DEMO" mientras este adaptador esté activo.

const ESCENARIOS = [
  {
    pFatal: 0.072,
    victimasGravesPred: 0.2,
    nivelAlerta: 'ESTANDAR',
    recomendacion: {
      ambulancias: 1,
      paramedico: false,
      helicoptero: false,
      alertaHospital: false,
      fundamento:
        'P(fatal) 7,2 % y 0,2 víctimas graves estimadas: despacho estándar con una ambulancia.',
    },
  },
  {
    // Ejemplo textual del contrato §4.9.
    pFatal: 0.412,
    victimasGravesPred: 2.08,
    nivelAlerta: 'ALERTA_HOSPITAL',
    recomendacion: {
      ambulancias: 3,
      paramedico: true,
      helicoptero: false,
      alertaHospital: true,
      fundamento:
        'P(fatal) 41,2 % (30–60 %) y 2,1 víctimas graves estimadas (1,0–3,0).',
    },
  },
  {
    pFatal: 0.684,
    victimasGravesPred: 3.4,
    nivelAlerta: 'CRITICO',
    recomendacion: {
      ambulancias: 5,
      paramedico: true,
      helicoptero: true,
      alertaHospital: true,
      fundamento:
        'P(fatal) 68,4 % (> 60 %) y 3,4 víctimas graves estimadas (> 3,0): helicóptero y múltiples ambulancias.',
    },
  },
  {
    pFatal: 0.234,
    victimasGravesPred: 0.8,
    nivelAlerta: 'REFORZADO',
    recomendacion: {
      ambulancias: 1,
      paramedico: true,
      helicoptero: false,
      alertaHospital: false,
      fundamento:
        'P(fatal) 23,4 % (10–30 %) y 0,8 víctimas graves estimadas (0,3–1,0): despacho reforzado con paramédico.',
    },
  },
]

function hashTexto(texto) {
  let hash = 2166136261
  for (let indice = 0; indice < texto.length; indice += 1) {
    hash ^= texto.charCodeAt(indice)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function esperar(milisegundos) {
  return new Promise((resolver) => {
    window.setTimeout(resolver, milisegundos)
  })
}

export async function adaptadorMock(payload) {
  const inicio = performance.now()
  const semilla = hashTexto(JSON.stringify(payload))

  const retardoConfigurado = Number(import.meta.env.VITE_MOCK_RETARDO_MS)
  const retardo =
    Number.isFinite(retardoConfigurado) && retardoConfigurado >= 0
      ? retardoConfigurado
      : 300 + (semilla % 250)

  await esperar(retardo)

  const escenario = ESCENARIOS[semilla % ESCENARIOS.length]
  const sinRecomendacion = import.meta.env.VITE_MOCK_SIN_RECOMENDACION === 'true'

  const respuesta = {
    predictionId: `demo_${semilla.toString(36).padStart(6, '0')}`,
    pFatal: escenario.pFatal,
    victimasGravesPred: escenario.victimasGravesPred,
    nivelAlerta: escenario.nivelAlerta,
    modelVersion: 'mock-ejemplo@2026-11-24',
    artifactVersion: 'mock-encodings@2026-11-24',
    latencyMs: Math.round(performance.now() - inicio),
    mode: 'demo',
  }

  // Permite ejercitar el camino "recomendación calculada en cliente".
  if (!sinRecomendacion) {
    respuesta.recomendacion = { ...escenario.recomendacion }
  }

  return respuesta
}
