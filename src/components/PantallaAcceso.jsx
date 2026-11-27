import { useState } from 'react'
import { Button, SelectField, TextField } from './ui'
import { IconoAmbulancia, IconoOjo, IconoOjoCerrado } from './Iconos'
import {
  CLAVE_MINIMA,
  ETIQUETAS_ROL,
  ROLES,
  validarCredenciales,
  validarRegistro,
} from '../domain/sesion'
import { ES_MODO_DEMO as ADAPTADOR_ES_MOCK } from '../services/prediccion'
import {
  ES_MODO_FIREBASE,
  iniciarSesion,
  iniciarSesionDemo,
  mensajeDeError,
  registrarCuenta,
} from '../services/auth/clienteAuth'

/** Credenciales de demostracion que siembra el servicio en modo de desarrollo. */
const CREDENCIALES_DEMO = [
  { correo: 'operador@samuapp.cl', rol: 'Operador' },
  { correo: 'supervisor@samuapp.cl', rol: 'Supervisor' },
  { correo: 'admin@samuapp.cl', rol: 'Administrador' },
]

const CONTRASENA_DEMO = 'Samuapp2026!'

/**
 * Pantalla de acceso al sistema (HU-01).
 *
 * Cubre los dos caminos de entrada del operador: iniciar sesion y crear la
 * cuenta. En la pestana de registro el rol solo se elige cuando la identidad
 * la emite el propio servicio (modo de desarrollo); con Firebase el rol llega
 * como *custom claim* y el usuario no puede elegirlo.
 *
 * @param {{variante?: 'inicial' | 'reautenticacion', onSesion: (sesion: object) => void, onCancelar?: () => void}} props
 */
export default function PantallaAcceso({ variante = 'inicial', onSesion, onCancelar }) {
  const [pestana, setPestana] = useState('ingresar')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState('operador')
  const [verContrasena, setVerContrasena] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [tocado, setTocado] = useState(false)

  const esRegistro = pestana === 'registro'
  const longitudClave = contrasena.length
  const claveCumple = longitudClave >= CLAVE_MINIMA

  function cambiarPestana(destino) {
    setPestana(destino)
    setErrores({})
    setErrorGeneral('')
    setTocado(false)
  }

  function validar() {
    const resultado = esRegistro
      ? validarRegistro({ nombre, correo, contrasena, rol })
      : validarCredenciales({ correo, contrasena })
    setErrores(resultado.errores)
    return resultado.valido
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setTocado(true)
    setErrorGeneral('')

    if (!validar()) return

    setEnviando(true)
    try {
      const sesion = esRegistro
        ? await registrarCuenta({ nombre, correo, contrasena, rol })
        : await iniciarSesion({ correo, contrasena })
      onSesion(sesion)
    } catch (error) {
      setErrorGeneral(mensajeDeError(error))
    } finally {
      setEnviando(false)
    }
  }

  function manejarDemo() {
    setErrorGeneral('')
    onSesion(iniciarSesionDemo())
  }

  const errorVisible = (campo) => (tocado ? errores[campo] : '')

  return (
    <div className="md-acceso">
      <div className="md-acceso__marca">
        <span className="brand-mark" aria-hidden="true">
          <IconoAmbulancia width={26} height={26} />
        </span>
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--md-primary-ink)]">
            SAMU · Despacho asistido
          </p>
          <h1 className="text-lg font-medium leading-tight">Acceso al sistema</h1>
        </div>
      </div>

      <div className="md-segmented mb-5" role="tablist" aria-label="Acceso al sistema">
        <button
          type="button"
          role="tab"
          aria-selected={!esRegistro}
          className={`md-segment ${!esRegistro ? 'is-selected' : ''}`}
          onClick={() => cambiarPestana('ingresar')}
        >
          <span>Ingresar</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={esRegistro}
          className={`md-segment ${esRegistro ? 'is-selected' : ''}`}
          onClick={() => cambiarPestana('registro')}
        >
          <span>Crear cuenta</span>
        </button>
      </div>

      <form onSubmit={manejarEnvio} noValidate>
        {esRegistro ? (
          <div className="flex flex-col gap-4">
            <TextField
              id="acceso-nombre"
              label="Nombre del operador"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              onBlur={() => setTocado(true)}
              error={errorVisible('nombre')}
              autoComplete="name"
              maxLength={120}
              required
            />

            <TextField
              id="acceso-correo"
              label="Correo institucional"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              onBlur={() => setTocado(true)}
              error={errorVisible('correo')}
              autoComplete="email"
              maxLength={254}
              required
            />

            {!ES_MODO_FIREBASE ? (
              <SelectField
                id="acceso-rol"
                label="Rol"
                value={rol}
                onChange={(evento) => setRol(evento.target.value)}
                helper="El servicio asigna el rol en esta versión de demostración."
              >
                {ROLES.map((valor) => (
                  <option key={valor} value={valor}>
                    {ETIQUETAS_ROL[valor]}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
        ) : null}

        <div className={esRegistro ? 'mt-4 flex flex-col gap-4' : 'flex flex-col gap-4'}>
          {!esRegistro ? (
            <TextField
              id="acceso-correo"
              label="Correo institucional"
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              onBlur={() => setTocado(true)}
              error={errorVisible('correo')}
              autoComplete="email"
              maxLength={254}
              required
            />
          ) : null}

          <TextField
            id="acceso-contrasena"
            label="Contraseña"
            type={verContrasena ? 'text' : 'password'}
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            onBlur={() => setTocado(true)}
            error={errorVisible('contrasena')}
            helper={`${longitudClave} caracteres · mínimo ${CLAVE_MINIMA} (CA-01.3)`}
            autoComplete={esRegistro ? 'new-password' : 'current-password'}
            maxLength={128}
            required
            suffix={
              <button
                type="button"
                className="md-field__accion"
                onClick={() => setVerContrasena((visible) => !visible)}
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verContrasena ? <IconoOjoCerrado /> : <IconoOjo />}
              </button>
            }
          />

          {esRegistro && !claveCumple && contrasena ? (
            <p className="md-text-info" aria-live="polite">
              Faltan {CLAVE_MINIMA - longitudClave} caracteres para cumplir el mínimo de
              seguridad.
            </p>
          ) : null}
        </div>

        {errorGeneral ? (
          <p className="md-alert md-alert--error mt-4" role="alert">
            {errorGeneral}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="filled"
          className="md-btn--full mt-5"
          disabled={enviando}
        >
          {enviando
            ? 'Verificando…'
            : esRegistro
              ? 'Crear cuenta e ingresar'
              : 'Iniciar sesión'}
        </Button>

        {onCancelar ? (
          <Button type="button" variant="text" className="md-btn--full mt-2" onClick={onCancelar}>
            Continuar sin iniciar sesión
          </Button>
        ) : null}
      </form>

      {!esRegistro && !ES_MODO_FIREBASE ? (
        <div className="md-alert md-alert--info mt-5">
          <div>
            <p className="font-medium">Credenciales de demostración</p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {CREDENCIALES_DEMO.map((item) => (
                <li key={item.correo}>
                  <span className="font-mono">{item.correo}</span> · {item.rol} · contraseña{' '}
                  <span className="font-mono">{CONTRASENA_DEMO}</span>
                </li>
              ))}
            </ul>
            {ADAPTADOR_ES_MOCK ? (
              <Button type="button" variant="text" className="mt-1" onClick={manejarDemo}>
                Continuar en modo demostración
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {variante === 'reautenticacion' ? (
        <p className="md-text-info mt-4">
          La sesión venció. Vuelve a iniciar sesión para guardar el siniestro: el formulario
          conserva lo que ya capturaste.
        </p>
      ) : null}
    </div>
  )
}
