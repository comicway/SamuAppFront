import { adaptadorHttp } from './adaptadorHttp'
import { adaptadorMock } from './adaptadorMock'
import { ErrorPrediccion } from './errores'

const CONFIGURADO = String(import.meta.env.VITE_ADAPTADOR_PREDICCION ?? 'mock')
  .trim()
  .toLowerCase()

export const ADAPTADOR_ACTIVO = CONFIGURADO || 'mock'
export const ES_MODO_DEMO = ADAPTADOR_ACTIVO === 'mock'

/**
 * Interfaz única que consume el formulario.
 * El formulario nunca calcula el modelo ni conoce detalles del adaptador.
 */
export async function predecirSiniestro(payload) {
  if (!payload || typeof payload !== 'object' || !payload.data) {
    throw new ErrorPrediccion(
      'El payload debe tener la forma { data, notas? } del contrato §4.9.',
      { codigo: 'invalid-argument' },
    )
  }

  switch (ADAPTADOR_ACTIVO) {
    case 'mock':
      return adaptadorMock(payload)
    case 'http':
      return adaptadorHttp(payload)
    default:
      throw new ErrorPrediccion(
        `Adaptador de predicción desconocido: «${ADAPTADOR_ACTIVO}». Usa "mock" o "http" en VITE_ADAPTADOR_PREDICCION.`,
        { codigo: 'failed-precondition' },
      )
  }
}
