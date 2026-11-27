import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PantallaAcceso from './PantallaAcceso'

const mocks = vi.hoisted(() => ({
  iniciarSesion: vi.fn(),
  registrarCuenta: vi.fn(),
  iniciarSesionDemo: vi.fn(),
}))

vi.mock('../services/auth/clienteAuth', () => ({
  ES_MODO_FIREBASE: false,
  iniciarSesion: mocks.iniciarSesion,
  registrarCuenta: mocks.registrarCuenta,
  iniciarSesionDemo: mocks.iniciarSesionDemo,
  mensajeDeError: (error) => error?.message ?? 'No fue posible iniciar sesión.',
}))

const SESION = {
  token: 'dev:operador:op_1',
  uid: 'op_1',
  rol: 'operador',
  correo: 'operador@samuapp.cl',
  nombre: 'Operador',
  expiraEn: 0,
  modo: 'dev',
}

describe('PantallaAcceso', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mocks.iniciarSesion.mockReset()
    mocks.registrarCuenta.mockReset()
    mocks.iniciarSesionDemo.mockReset()
  })

  it('muestra el formulario de ingreso', () => {
    render(<PantallaAcceso onSesion={vi.fn()} />)

    expect(screen.getByLabelText(/Correo institucional/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar sesión/i })).toBeInTheDocument()
  })

  it('no llama al proveedor si faltan datos y muestra el error', async () => {
    const usuario = userEvent.setup()
    const onSesion = vi.fn()
    render(<PantallaAcceso onSesion={onSesion} />)

    await usuario.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    expect(mocks.iniciarSesion).not.toHaveBeenCalled()
    expect(onSesion).not.toHaveBeenCalled()
    expect(screen.getByText('Ingresa el correo institucional.')).toBeInTheDocument()
  })

  it('rechaza una contraseña de menos de 12 caracteres (CA-01.3)', async () => {
    const usuario = userEvent.setup()
    render(<PantallaAcceso onSesion={vi.fn()} />)

    await usuario.type(screen.getByLabelText(/Correo institucional/i), 'operador@samuapp.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/i), 'Corta123')
    await usuario.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    expect(mocks.iniciarSesion).not.toHaveBeenCalled()
    expect(screen.getByText(/al menos 12 caracteres/i)).toBeInTheDocument()
  })

  it('inicia sesion y entrega la sesion', async () => {
    const usuario = userEvent.setup()
    const onSesion = vi.fn()
    mocks.iniciarSesion.mockResolvedValue(SESION)
    render(<PantallaAcceso onSesion={onSesion} />)

    await usuario.type(screen.getByLabelText(/Correo institucional/i), 'operador@samuapp.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/i), 'Samuapp2026!')
    await usuario.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    await waitFor(() => expect(onSesion).toHaveBeenCalledWith(SESION))
    expect(mocks.iniciarSesion).toHaveBeenCalledWith({
      correo: 'operador@samuapp.cl',
      contrasena: 'Samuapp2026!',
    })
  })

  it('muestra el mensaje del proveedor cuando el ingreso falla', async () => {
    const usuario = userEvent.setup()
    mocks.iniciarSesion.mockRejectedValue(new Error('Las credenciales no son válidas.'))
    render(<PantallaAcceso onSesion={vi.fn()} />)

    await usuario.type(screen.getByLabelText(/Correo institucional/i), 'operador@samuapp.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/i), 'Samuapp2026!')
    await usuario.click(screen.getByRole('button', { name: /Iniciar sesión/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Las credenciales no son válidas.')
  })

  it('permite cambiar la visibilidad de la contraseña', async () => {
    const usuario = userEvent.setup()
    render(<PantallaAcceso onSesion={vi.fn()} />)

    const campo = screen.getByLabelText(/^Contraseña/i)
    expect(campo).toHaveAttribute('type', 'password')

    await usuario.click(screen.getByRole('button', { name: /Mostrar contraseña/i }))
    expect(campo).toHaveAttribute('type', 'text')
  })

  it('pide nombre y rol en la pestana de registro', async () => {
    const usuario = userEvent.setup()
    const onSesion = vi.fn()
    mocks.registrarCuenta.mockResolvedValue(SESION)
    render(<PantallaAcceso onSesion={onSesion} />)

    await usuario.click(screen.getByRole('tab', { name: /Crear cuenta/i }))

    expect(screen.getByLabelText(/Nombre del operador/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Rol/i)).toBeInTheDocument()

    await usuario.type(screen.getByLabelText(/Nombre del operador/i), 'Nuevo Operador')
    await usuario.type(screen.getByLabelText(/Correo institucional/i), 'nuevo@samuapp.cl')
    await usuario.type(screen.getByLabelText(/^Contraseña/i), 'Samuapp2026!')
    await usuario.click(screen.getByRole('button', { name: /Crear cuenta e ingresar/i }))

    await waitFor(() => expect(onSesion).toHaveBeenCalledWith(SESION))
    expect(mocks.registrarCuenta).toHaveBeenCalledWith({
      nombre: 'Nuevo Operador',
      correo: 'nuevo@samuapp.cl',
      contrasena: 'Samuapp2026!',
      rol: 'operador',
    })
  })

  it('ofrece la identidad local de demostracion', async () => {
    const usuario = userEvent.setup()
    const onSesion = vi.fn()
    mocks.iniciarSesionDemo.mockReturnValue({ ...SESION, modo: 'demo', token: null })
    render(<PantallaAcceso onSesion={onSesion} />)

    await usuario.click(screen.getByRole('button', { name: /Continuar en modo demostración/i }))

    expect(mocks.iniciarSesionDemo).toHaveBeenCalled()
    expect(onSesion).toHaveBeenCalled()
  })
})
