import { Chip } from './ui'
import { IconoUsuario } from './Iconos'
import { etiquetaRol } from '../domain/sesion'

/**
 * Indicador de la sesion vigente.
 *
 * Muestra quien esta operando y con que rol, y permite cerrar la sesion.
 *
 * @param {{sesion: object, onCerrar: () => void}} props
 */
export default function SesionIndicador({ sesion, onCerrar }) {
  if (!sesion) return null

  const nombre = sesion.nombre || sesion.correo || sesion.uid

  return (
    <div className="flex items-center gap-2">
      <span className="md-sesion" title={sesion.correo || sesion.uid}>
        <span className="md-sesion__icono" aria-hidden="true">
          <IconoUsuario width={16} height={16} />
        </span>
        <span className="md-sesion__texto">
          <span className="md-sesion__nombre">{nombre}</span>
          <span className="md-sesion__rol">{etiquetaRol(sesion.rol)}</span>
        </span>
      </span>

      {sesion.modo === 'demo' ? <Chip tono="demo">MODO DEMO</Chip> : null}

      <button type="button" className="md-btn md-btn--text" onClick={onCerrar}>
        Salir
      </button>
    </div>
  )
}
