import { describe, expect, it } from 'vitest'
import {
  CLAVE_MINIMA,
  etiquetaRol,
  esCorreoValido,
  esSesionExpirada,
  normalizarCorreo,
  normalizarRol,
  tieneRol,
  validarCredenciales,
  validarRegistro,
} from './sesion'

describe('normalizarCorreo', () => {
  it('recorta espacios y pasa a minusculas', () => {
    expect(normalizarCorreo('  Operador@SAMUAPP.CL ')).toBe('operador@samuapp.cl')
  })

  it('tolera valores nulos', () => {
    expect(normalizarCorreo(null)).toBe('')
    expect(normalizarCorreo(undefined)).toBe('')
  })
})

describe('esCorreoValido', () => {
  it('acepta un correo institucional con dominio', () => {
    expect(esCorreoValido('operador@samuapp.cl')).toBe(true)
  })

  it('rechaza formatos incompletos', () => {
    expect(esCorreoValido('operador')).toBe(false)
    expect(esCorreoValido('operador@')).toBe(false)
    expect(esCorreoValido('@samuapp.cl')).toBe(false)
    expect(esCorreoValido('operador@samuapp')).toBe(false)
    expect(esCorreoValido('opera dor@samuapp.cl')).toBe(false)
  })
})

describe('normalizarRol', () => {
  it('acepta los tres roles del modelo de acceso', () => {
    expect(normalizarRol('Operador')).toBe('operador')
    expect(normalizarRol('SUPERVISOR')).toBe('supervisor')
    expect(normalizarRol(' admin ')).toBe('admin')
  })

  it('devuelve cadena vacia para un rol desconocido', () => {
    expect(normalizarRol('root')).toBe('')
    expect(normalizarRol(null)).toBe('')
  })
})

describe('validarCredenciales', () => {
  it('acepta correo y contraseña validos', () => {
    const resultado = validarCredenciales({
      correo: 'operador@samuapp.cl',
      contrasena: 'Samuapp2026!',
    })
    expect(resultado.valido).toBe(true)
    expect(resultado.errores).toEqual({})
  })

  it('exige correo', () => {
    const resultado = validarCredenciales({ correo: '', contrasena: 'Samuapp2026!' })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.correo).toBeTruthy()
  })

  it('exige el minimo de 12 caracteres en la contraseña (CA-01.3)', () => {
    const resultado = validarCredenciales({
      correo: 'operador@samuapp.cl',
      contrasena: 'Corta123',
    })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.contrasena).toContain(String(CLAVE_MINIMA))
  })
})

describe('validarRegistro', () => {
  const base = {
    nombre: 'Nuevo Operador',
    correo: 'nuevo@samuapp.cl',
    contrasena: 'Samuapp2026!',
    rol: 'operador',
  }

  it('acepta los datos completos', () => {
    expect(validarRegistro(base).valido).toBe(true)
  })

  it('exige nombre, correo, contraseña y rol', () => {
    const resultado = validarRegistro({})
    expect(resultado.valido).toBe(false)
    expect(Object.keys(resultado.errores).sort()).toEqual([
      'contrasena',
      'correo',
      'nombre',
      'rol',
    ])
  })

  it('rechaza un rol fuera del catalogo', () => {
    const resultado = validarRegistro({ ...base, rol: 'root' })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.rol).toBeTruthy()
  })

  it('rechaza una contraseña de menos de 12 caracteres', () => {
    const resultado = validarRegistro({ ...base, contrasena: 'Corta123' })
    expect(resultado.valido).toBe(false)
    expect(resultado.errores.contrasena).toContain(String(CLAVE_MINIMA))
  })
})

describe('esSesionExpirada', () => {
  const ahora = 1_800_000_000_000

  it('es falsa cuando la sesion no tiene expiracion', () => {
    expect(esSesionExpirada({ expiraEn: 0 }, ahora)).toBe(false)
  })

  it('es verdadera cuando la expiracion ya paso', () => {
    expect(esSesionExpirada({ expiraEn: ahora - 1 }, ahora)).toBe(true)
  })

  it('es falsa mientras la expiracion no llega', () => {
    expect(esSesionExpirada({ expiraEn: ahora + 60_000 }, ahora)).toBe(false)
  })

  it('es verdadera cuando no hay sesion', () => {
    expect(esSesionExpirada(null, ahora)).toBe(true)
  })
})

describe('tieneRol', () => {
  const supervisor = { rol: 'supervisor' }

  it('aplica la jerarquia de roles', () => {
    expect(tieneRol(supervisor, 'operador')).toBe(true)
    expect(tieneRol(supervisor, 'supervisor')).toBe(true)
    expect(tieneRol(supervisor, 'admin')).toBe(false)
    expect(tieneRol({ rol: 'admin' }, 'operador')).toBe(true)
  })

  it('es falsa sin sesion', () => {
    expect(tieneRol(null, 'operador')).toBe(false)
  })
})

describe('etiquetaRol', () => {
  it('devuelve la etiqueta legible', () => {
    expect(etiquetaRol('admin')).toBe('Administrador')
    expect(etiquetaRol('desconocido')).toBe('Operador')
  })
})
