import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorAutenticacion } from '../errores'
import { iniciarSesionEnServicio, registrarEnServicio } from './proveedorBackend'

const RESPUESTA_OK = {
  token: 'dev:operador:op_1',
  uid: 'op_1',
  rol: 'operador',
  correo: 'operador@samuapp.cl',
  nombre: 'Operador',
  expiraEn: 1800000000000,
  modo: 'dev',
}

function respuestaJson(cuerpo, estado = 200) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  }
}

describe('proveedorBackend', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.samuapp.cl')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('inicia sesion contra /api/v1/auth/sesion', async () => {
    const fetchMock = vi.fn(async () => respuestaJson(RESPUESTA_OK))
    vi.stubGlobal('fetch', fetchMock)

    const sesion = await iniciarSesionEnServicio({
      correo: 'operador@samuapp.cl',
      contrasena: 'Samuapp2026!',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.samuapp.cl/api/v1/auth/sesion')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(opciones.body)).toEqual({
      correo: 'operador@samuapp.cl',
      contrasena: 'Samuapp2026!',
    })
    expect(sesion.token).toBe('dev:operador:op_1')
    expect(sesion.uid).toBe('op_1')
    expect(sesion.rol).toBe('operador')
  })

  it('registra contra /api/v1/auth/registro enviando el rol', async () => {
    const fetchMock = vi.fn(async () => respuestaJson(RESPUESTA_OK))
    vi.stubGlobal('fetch', fetchMock)

    await registrarEnServicio({
      nombre: 'Nuevo Operador',
      correo: 'nuevo@samuapp.cl',
      contrasena: 'Samuapp2026!',
      rol: 'supervisor',
    })

    const [url, opciones] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.samuapp.cl/api/v1/auth/registro')
    expect(JSON.parse(opciones.body)).toEqual({
      nombre: 'Nuevo Operador',
      correo: 'nuevo@samuapp.cl',
      contrasena: 'Samuapp2026!',
      rol: 'supervisor',
    })
  })

  it('traduce un 401 a un error de autenticacion no autenticado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson({ error: { code: 'unauthenticated', message: 'Las credenciales no son validas.' } }, 401),
      ),
    )

    await expect(
      iniciarSesionEnServicio({ correo: 'operador@samuapp.cl', contrasena: 'Samuapp2026!' }),
    ).rejects.toMatchObject({ codigo: 'unauthenticated' })
  })

  it('propaga el mensaje del servicio', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuestaJson(
          { error: { code: 'invalid-argument', message: 'No fue posible completar el registro.' } },
          400,
        ),
      ),
    )

    const error = await registrarEnServicio({
      nombre: 'Nuevo Operador',
      correo: 'operador@samuapp.cl',
      contrasena: 'Samuapp2026!',
      rol: 'operador',
    }).catch((fallo) => fallo)

    expect(error).toBeInstanceOf(ErrorAutenticacion)
    expect(error.message).toBe('No fue posible completar el registro.')
    expect(error.codigo).toBe('invalid-argument')
  })

  it('traduce un fallo de red a indisponibilidad', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    await expect(
      iniciarSesionEnServicio({ correo: 'operador@samuapp.cl', contrasena: 'Samuapp2026!' }),
    ).rejects.toMatchObject({ codigo: 'unavailable' })
  })

  it('falla de forma explicita si falta VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')

    await expect(
      iniciarSesionEnServicio({ correo: 'operador@samuapp.cl', contrasena: 'Samuapp2026!' }),
    ).rejects.toMatchObject({ codigo: 'failed-precondition' })
  })

  it('rechaza una respuesta sin token', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respuestaJson({ uid: 'op_1' })))

    await expect(
      iniciarSesionEnServicio({ correo: 'operador@samuapp.cl', contrasena: 'Samuapp2026!' }),
    ).rejects.toMatchObject({ codigo: 'internal' })
  })
})
