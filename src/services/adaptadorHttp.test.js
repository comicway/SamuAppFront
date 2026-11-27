import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adaptadorHttp } from './adaptadorHttp'
import { establecerToken, limpiarToken } from './auth/token'
import { suscribir, EVENTO_SESION_EXPIRADA } from './eventos'

const PAYLOAD = {
  data: {
    fecha: '2026-11-20',
    hora: 3,
    comuna: 'Colchane',
    region: 'Tarapacá',
    urbano: false,
    involucrados: [{ sexo: 'M', edad: 34, tipo: 'Camioneta' }],
  },
}

function respuestaJson(cuerpo, estado = 200) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  }
}

describe('adaptadorHttp', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.samuapp.cl')
    limpiarToken()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    limpiarToken()
  })

  it('adjunta el token de identidad en la cabecera Authorization', async () => {
    const fetchMock = vi.fn(async () => respuestaJson({ predictionId: 'pr_ABCDEFGH' }))
    vi.stubGlobal('fetch', fetchMock)
    establecerToken('dev:operador:op_1')

    await adaptadorHttp(PAYLOAD)

    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.headers.Authorization).toBe('Bearer dev:operador:op_1')
  })

  it('no adjunta Authorization cuando no hay sesion', async () => {
    const fetchMock = vi.fn(async () => respuestaJson({ predictionId: 'pr_ABCDEFGH' }))
    vi.stubGlobal('fetch', fetchMock)

    await adaptadorHttp(PAYLOAD)

    const [, opciones] = fetchMock.mock.calls[0]
    expect(opciones.headers.Authorization).toBeUndefined()
  })

  it('envia el cuerpo con data, notas y siniestroRef', async () => {
    const fetchMock = vi.fn(async () => respuestaJson({ predictionId: 'pr_ABCDEFGH' }))
    vi.stubGlobal('fetch', fetchMock)

    await adaptadorHttp({ ...PAYLOAD, notas: 'Volcamiento', siniestroRef: 'Parte 12' })

    const [, opciones] = fetchMock.mock.calls[0]
    expect(JSON.parse(opciones.body)).toEqual({
      data: PAYLOAD.data,
      notas: 'Volcamiento',
      siniestroRef: 'Parte 12',
    })
  })

  it('traduce un 401 y avisa que la sesion expiro (CA-01.6)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respuestaJson({ error: { code: 'unauthenticated', message: 'Token invalido.' } }, 401)),
    )

    const avisos = []
    const cancelar = suscribir(EVENTO_SESION_EXPIRADA, (detalle) => avisos.push(detalle))

    await expect(adaptadorHttp(PAYLOAD)).rejects.toMatchObject({ codigo: 'unauthenticated' })
    expect(avisos).toHaveLength(1)

    cancelar()
  })

  it('falla de forma explicita si falta VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    await expect(adaptadorHttp(PAYLOAD)).rejects.toMatchObject({ codigo: 'failed-precondition' })
  })

  it('traduce un fallo de red a indisponibilidad', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(adaptadorHttp(PAYLOAD)).rejects.toMatchObject({ codigo: 'unavailable' })
  })

  it('rechaza una respuesta que no es JSON valido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token')
        },
      })),
    )

    await expect(adaptadorHttp(PAYLOAD)).rejects.toMatchObject({ codigo: 'internal' })
  })
})
