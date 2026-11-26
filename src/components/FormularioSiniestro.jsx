import { useMemo, useState } from 'react'
import {
  comunasDeRegion,
  NOMBRES_REGIONES,
  REGIONES,
  TOTAL_COMUNAS,
} from '../data/regionesComunas'
import { CARACTERES, MAX_INVOLUCRADOS } from '../data/catalogos'
import { construirPayload, hoyISO, validarSiniestro } from '../domain/validacion'
import { predecirSiniestro } from '../services/prediccion'
import {
  Button,
  Chip,
  SegmentedField,
  SelectField,
  TextField,
  TextareaField,
} from './ui'
import {
  IconoAlerta,
  IconoCheck,
  IconoInfo,
  IconoMas,
  IconoPulso,
} from './Iconos'
import InvolucradoCard from './InvolucradoCard'

let secuenciaInvolucrado = 0

function crearInvolucrado() {
  secuenciaInvolucrado += 1
  return {
    id: `inv-${secuenciaInvolucrado}`,
    sexo: '',
    edad: '',
    tipo: '',
  }
}

function formularioInicial() {
  return {
    fecha: '',
    hora: '',
    region: '',
    comuna: '',
    urbano: '',
    involucrados: [crearInvolucrado()],
    notas: '',
    siniestroRef: '',
  }
}

export default function FormularioSiniestro({
  onResultado,
  onError,
  onInicio,
  onLimpiar,
  onCargandoChange,
}) {
  const [formulario, setFormulario] = useState(formularioInicial)
  const [tocados, setTocados] = useState(() => new Set())
  const [haIntentado, setHaIntentado] = useState(false)
  const [cargando, setCargando] = useState(false)

  const { errores, valido } = useMemo(() => validarSiniestro(formulario), [formulario])
  const comunasDisponibles = useMemo(
    () => comunasDeRegion(formulario.region),
    [formulario.region],
  )

  const numeroErrores = Object.keys(errores).length
  const erroresVisibles = Object.entries(errores).filter(
    ([campo]) => tocados.has(campo) || haIntentado,
  )

  function marcarTocado(campo) {
    setTocados((previos) => {
      if (previos.has(campo)) return previos
      const siguientes = new Set(previos)
      siguientes.add(campo)
      return siguientes
    })
  }

  function marcarVarios(campos) {
    setTocados((previos) => {
      const siguientes = new Set(previos)
      campos.forEach((campo) => siguientes.add(campo))
      return siguientes
    })
  }

  function errorVisible(campo) {
    return tocados.has(campo) || haIntentado ? errores[campo] : undefined
  }

  function actualizar(campo, valor) {
    setFormulario((previo) => {
      const siguiente = { ...previo, [campo]: valor }
      // Al cambiar de región, la comuna anterior deja de ser válida.
      if (campo === 'region') siguiente.comuna = ''
      return siguiente
    })
  }

  function manejarRegion(evento) {
    actualizar('region', evento.target.value)
    marcarTocado('region')
    marcarTocado('comuna')
  }

  function cambiarInvolucrado(id, campo, valor) {
    setFormulario((previo) => ({
      ...previo,
      involucrados: previo.involucrados.map((involucrado) =>
        involucrado.id === id ? { ...involucrado, [campo]: valor } : involucrado,
      ),
    }))
  }

  function agregarInvolucrado() {
    if (formulario.involucrados.length >= MAX_INVOLUCRADOS) return

    const nuevo = crearInvolucrado()
    setFormulario((previo) => ({
      ...previo,
      involucrados: [...previo.involucrados, nuevo],
    }))

    marcarVarios(
      ['sexo', 'edad', 'tipo'].map((campo) => `involucrados.${nuevo.id}.${campo}`),
    )
  }

  function quitarInvolucrado(id) {
    setFormulario((previo) => {
      if (previo.involucrados.length <= 1) return previo
      return {
        ...previo,
        involucrados: previo.involucrados.filter((involucrado) => involucrado.id !== id),
      }
    })

    setTocados((previos) => {
      const siguientes = new Set(previos)
      ;['sexo', 'edad', 'tipo'].forEach((campo) => {
        siguientes.delete(`involucrados.${id}.${campo}`)
      })
      return siguientes
    })
  }

  function limpiarFormulario() {
    setFormulario(formularioInicial())
    setTocados(new Set())
    setHaIntentado(false)
    onLimpiar?.()
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setHaIntentado(true)

    if (!valido || cargando) return

    setCargando(true)
    onCargandoChange?.(true)
    onInicio?.()

    try {
      const respuesta = await predecirSiniestro(construirPayload(formulario))
      onResultado?.(respuesta)
    } catch (error) {
      onError?.(error)
    } finally {
      setCargando(false)
      onCargandoChange?.(false)
    }
  }

  const mensajeEstado = cargando
    ? 'Consultando el servicio de predicción…'
    : valido
      ? 'Formulario completo. Puedes predecir el despacho.'
      : `Faltan ${numeroErrores} ${
          numeroErrores === 1 ? 'campo' : 'campos'
        } por completar o corregir para habilitar el envío.`

  return (
    <form
      onSubmit={manejarEnvio}
      noValidate
      aria-labelledby="titulo-formulario"
      className="space-y-4"
    >
      <div className="md-card md-card--elevated">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="md-eyebrow">Captura del siniestro</p>
            <h2 id="titulo-formulario" className="mt-1 text-xl font-medium">
              Datos del siniestro
            </h2>
            <p className="md-text-info">
              Los campos con <span className="md-field__required">*</span> son obligatorios.
              Fecha, hora, comuna, región, carácter urbano y al menos un involucrado son el
              mínimo del modelo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip tono="primary">{REGIONES.length} regiones</Chip>
            <Chip tono="neutral">{TOTAL_COMUNAS} comunas</Chip>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="fecha"
            label="Fecha del siniestro"
            type="date"
            forceFloat
            max={hoyISO()}
            value={formulario.fecha}
            onChange={(evento) => actualizar('fecha', evento.target.value)}
            onBlur={() => marcarTocado('fecha')}
            error={errorVisible('fecha')}
            helper="Obligatoria. No puede ser futura."
            required
          />

          <TextField
            id="hora"
            label="Hora (0–23)"
            type="number"
            min={0}
            max={23}
            step={1}
            inputMode="numeric"
            value={formulario.hora}
            onChange={(evento) => actualizar('hora', evento.target.value)}
            onBlur={() => marcarTocado('hora')}
            error={errorVisible('hora')}
            helper="Formato 24 h. Entero de 0 a 23."
            required
          />

          <SelectField
            id="region"
            label="Región"
            value={formulario.region}
            onChange={manejarRegion}
            onBlur={() => marcarTocado('region')}
            error={errorVisible('region')}
            helper={`${REGIONES.length} regiones disponibles.`}
            placeholder="Selecciona una región"
            required
          >
            {NOMBRES_REGIONES.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </SelectField>

          <SelectField
            id="comuna"
            label="Comuna"
            value={formulario.comuna}
            onChange={(evento) => {
              actualizar('comuna', evento.target.value)
              marcarTocado('comuna')
            }}
            onBlur={() => marcarTocado('comuna')}
            error={errorVisible('comuna')}
            helper={
              formulario.region
                ? `${comunasDisponibles.length} comunas en ${formulario.region}.`
                : `Se filtra por región. Hay ${TOTAL_COMUNAS} comunas en total.`
            }
            placeholder={
              formulario.region ? 'Selecciona una comuna' : 'Selecciona primero una región'
            }
            disabled={!formulario.region}
            required
          >
            {comunasDisponibles.map((comuna) => (
              <option key={comuna} value={comuna}>
                {comuna}
              </option>
            ))}
          </SelectField>

          <div className="sm:col-span-2">
            <SegmentedField
              id="urbano"
              label="Carácter del siniestro"
              value={formulario.urbano}
              onChange={(evento) => actualizar('urbano', evento.target.value)}
              onBlur={() => marcarTocado('urbano')}
              error={errorVisible('urbano')}
              helper="Urbano o rural según el lugar del hecho."
              opciones={CARACTERES}
              required
            />
          </div>
        </div>
      </div>

      <div className="md-card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="md-eyebrow">Personas involucradas</p>
            <h2 className="mt-1 md-section-title">Involucrados</h2>
            <p className="md-text-info">
              El involucrado 1 es obligatorio. Puedes agregar hasta {MAX_INVOLUCRADOS};
              cada slot agregado debe completarse.
            </p>
          </div>
          <Chip tono={formulario.involucrados.length === MAX_INVOLUCRADOS ? 'warning' : 'neutral'}>
            {formulario.involucrados.length} / {MAX_INVOLUCRADOS}
          </Chip>
        </div>

        <div className="space-y-3">
          {formulario.involucrados.map((involucrado, indice) => (
            <InvolucradoCard
              key={involucrado.id}
              indice={indice}
              involucrado={involucrado}
              errores={{
                sexo: errorVisible(`involucrados.${involucrado.id}.sexo`),
                edad: errorVisible(`involucrados.${involucrado.id}.edad`),
                tipo: errorVisible(`involucrados.${involucrado.id}.tipo`),
              }}
              onCambiar={(campo, valor) => cambiarInvolucrado(involucrado.id, campo, valor)}
              onBlur={(campo) => marcarTocado(`involucrados.${involucrado.id}.${campo}`)}
              onQuitar={() => quitarInvolucrado(involucrado.id)}
              puedeQuitar={indice > 0}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="md-text-info">
            Máximo {MAX_INVOLUCRADOS} involucrados (CA-02.2). El primer slot no se puede
            quitar.
          </p>
          <Button
            variant="tonal"
            onClick={agregarInvolucrado}
            disabled={formulario.involucrados.length >= MAX_INVOLUCRADOS || cargando}
            icon={<IconoMas />}
          >
            Agregar involucrado
          </Button>
        </div>
      </div>

      <div className="md-card">
        <div className="mb-4">
          <p className="md-eyebrow">Auditoría</p>
          <h2 className="mt-1 md-section-title">Registro opcional</h2>
          <p className="md-text-info">
            Estos campos no intervienen en la predicción ni impiden el envío.
          </p>
        </div>

        <div className="grid gap-4">
          <TextareaField
            id="notas"
            label="Notas (opcional)"
            value={formulario.notas}
            onChange={(evento) => actualizar('notas', evento.target.value)}
            onBlur={() => marcarTocado('notas')}
            helper="Texto libre para trazabilidad y auditoría."
          />

          <TextField
            id="siniestroRef"
            label="Referencia del siniestro (opcional)"
            value={formulario.siniestroRef}
            onChange={(evento) => actualizar('siniestroRef', evento.target.value)}
            onBlur={() => marcarTocado('siniestroRef')}
            helper="Por ejemplo, el parte de Carabineros."
          />
        </div>
      </div>

      {erroresVisibles.length > 0 ? (
        <div className="md-alert md-alert--error" role="status" aria-live="polite" aria-atomic="true">
          <IconoAlerta className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {numeroErrores} {numeroErrores === 1 ? 'campo por revisar' : 'campos por revisar'}
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {erroresVisibles.map(([campo, mensaje]) => (
                <li key={campo}>{mensaje}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <p
            id="estado-envio"
            className={`flex items-start gap-2 text-sm ${
              valido ? 'text-[var(--md-success)]' : 'text-[var(--md-on-surface-variant)]'
            }`}
            aria-live="polite"
          >
            {valido ? (
              <IconoCheck className="mt-0.5 shrink-0" />
            ) : (
              <IconoInfo className="mt-0.5 shrink-0" />
            )}
            {mensajeEstado}
          </p>
        </div>

        <div className="flex flex-row items-center gap-3">
          <Button variant="outline" onClick={limpiarFormulario} disabled={cargando} className="md-btn--half">
            Limpiar
          </Button>
          <Button
            type="submit"
            variant="filled"
            disabled={!valido || cargando}
            aria-describedby="estado-envio"
            icon={cargando ? <span className="md-spinner" /> : <IconoPulso />}
            className="md-btn--half"
          >
            {cargando ? 'Consultando…' : 'Predecir despacho'}
          </Button>
        </div>
      </div>
    </form>
  )
}
