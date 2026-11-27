import { beforeEach, describe, expect, it } from 'vitest'
import { borrarSesion, guardarSesion, leerSesion } from './almacenSesion'

const SESION = {
  token: 'dev:operador:op_123',
  uid: 'op_123',
  rol: 'operador',
  correo: 'operador@samuapp.cl',
  nombre: 'Operador',
  expiraEn: 0,
  modo: 'dev',
}

describe('almacenSesion', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('guarda y lee la sesion', () => {
    expect(guardarSesion(SESION)).toBe(true)
    expect(leerSesion()).toEqual(SESION)
  })

  it('devuelve null cuando no hay sesion', () => {
    expect(leerSesion()).toBeNull()
  })

  it('borra la sesion', () => {
    guardarSesion(SESION)
    expect(borrarSesion()).toBe(true)
    expect(leerSesion()).toBeNull()
  })

  it('devuelve null si el contenido guardado esta corrupto', () => {
    window.sessionStorage.setItem('samuapp-sesion', '{no es json')
    expect(leerSesion()).toBeNull()
  })

  it('no guarda nada que no sea un objeto', () => {
    window.sessionStorage.setItem('samuapp-sesion', '"texto"')
    expect(leerSesion()).toBeNull()
  })
})
