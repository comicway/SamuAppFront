import { useEffect, useRef } from 'react'
import { calcularRecomendacion } from '../domain/despacho'
import { describirModo, describirNivelAlerta } from '../data/catalogos'
import {
  numero1,
  porcentaje,
  valorBooleano,
  valorEntero,
  valorTexto,
} from '../utils/formato'
import { Chip } from './ui'
import {
  IconoAlerta,
  IconoAmbulancia,
  IconoDocumento,
  IconoHelicoptero,
  IconoHospital,
  IconoInfo,
  IconoParamedico,
  IconoPulso,
} from './Iconos'

function Recurso({ icono, etiqueta, valor }) {
  return (
    <div className="md-recurso">
      <span className="md-recurso__icono">{icono}</span>
      <div>
        <p className="md-recurso__label">{etiqueta}</p>
        <p className="md-recurso__valor">{valor}</p>
      </div>
    </div>
  )
}

function EstadoVacio({ esDemo }) {
  return (
    <div className="md-card">
      <div className="flex flex-col items-start gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]">
          <IconoPulso width={26} height={26} />
        </span>
        <div>
          <h3 className="md-section-title">Sin predicción todavía</h3>
          <p className="md-note mt-1">
            Completa los datos del siniestro y envía el formulario. Aquí verás P(fatal), las
            víctimas graves estimadas y la recomendación de despacho.
          </p>
        </div>
        <ul className="space-y-1 text-sm text-[var(--md-on-surface-variant)]">
          <li>• 8 campos mínimos del modelo.</li>
          <li>• Hasta 10 involucrados; solo el primero es obligatorio.</li>
          <li>• Notas y referencia del siniestro son opcionales.</li>
        </ul>
        {esDemo ? (
          <p className="md-note">
            El adaptador mock está activo: los resultados serán datos de ejemplo.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function PanelResultados({ resultado, cargando, error, esDemo }) {
  const tituloRef = useRef(null)
  const errorRef = useRef(null)

  const pFatalNum = Number(resultado?.pFatal)
  const vgNum = Number(resultado?.victimasGravesPred)
  const pFatalValida = Number.isFinite(pFatalNum)
  const vgValida = Number.isFinite(vgNum)

  const recomendacionIncluida = Boolean(resultado && resultado.recomendacion)
  const recomendacionCalculada =
    !recomendacionIncluida && pFatalValida && vgValida
      ? calcularRecomendacion({ pFatal: pFatalNum, victimasGravesPred: vgNum })
      : null
  const recomendacion = recomendacionIncluida
    ? resultado.recomendacion
    : recomendacionCalculada
  const calculada = !recomendacionIncluida && Boolean(recomendacionCalculada)

  const nivelValor = resultado?.nivelAlerta ?? recomendacion?.nivelAlerta
  const nivelInfo = describirNivelAlerta(nivelValor)
  const modo = resultado?.mode ?? (esDemo ? 'demo' : null)
  const modoDemo = esDemo || String(modo ?? '').toLowerCase() === 'demo'

  const extras = resultado
    ? [
        { clave: 'ATS', valor: resultado.ats ?? resultado.recomendacion?.ats },
        { clave: 'AEB', valor: resultado.aeb ?? resultado.recomendacion?.aeb },
        { clave: 'AEA', valor: resultado.aea ?? resultado.recomendacion?.aea },
      ].filter(({ valor }) => valor !== undefined && valor !== null)
    : []

  useEffect(() => {
    if (resultado) tituloRef.current?.focus()
  }, [resultado])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  return (
    <section className="space-y-4" aria-labelledby="titulo-resultados" aria-busy={cargando}>
      <p className="sr-only" role="status" aria-live="polite">
        {cargando
          ? 'Consultando el servicio de predicción.'
          : resultado
            ? 'Predicción recibida. Revisa los resultados.'
            : error
              ? 'No se pudo obtener la predicción.'
              : ''}
      </p>

      <div className="md-card md-card--elevated" style={{ marginTop: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="md-eyebrow">Panel de resultados</p>
            <h2
              id="titulo-resultados"
              ref={tituloRef}
              tabIndex={-1}
              className="md-focus-heading mt-1 text-xl font-medium"
            >
              Recomendación de despacho
            </h2>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {modoDemo ? <Chip tono="demo">MODO DEMO</Chip> : null}
            {resultado ? <Chip tono={nivelInfo.tono}>{nivelInfo.etiqueta}</Chip> : null}
          </div>
        </div>
      </div>

      {cargando ? (
        <div
          className="md-card flex items-center gap-3"
          role="status"
          aria-live="polite"
        >
          <span className="md-spinner md-spinner--ink" />
          <div>
            <p className="font-medium">Consultando el modelo…</p>
            <p className="md-note">La respuesta incluirá probabilidad, víctimas y despacho.</p>
          </div>
        </div>
      ) : null}

      {!cargando && error ? (
        <div className="md-card" role="alert">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--md-error-container)] text-[var(--md-error)]">
              <IconoAlerta />
            </span>
            <div className="min-w-0">
              <h3
                ref={errorRef}
                tabIndex={-1}
                className="md-focus-heading text-base font-medium text-[var(--md-error)]"
              >
                No se pudo obtener la predicción
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--md-on-surface-variant)]">
                {error?.message || 'Ocurrió un error inesperado.'}
              </p>
              {error?.codigo ? (
                <p className="mt-2">
                  <Chip tono="neutral">Código: {error.codigo}</Chip>
                </p>
              ) : null}
              <p className="md-note mt-2">
                El formulario conserva los datos capturados. Puedes corregir y reintentar el
                envío.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!cargando && !error && !resultado ? <EstadoVacio esDemo={esDemo} /> : null}

      {!cargando && resultado ? (
        <>
          <div className="md-card">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="md-stat md-stat--primary">
                <p className="md-stat__label">P(fatal)</p>
                <p className="md-stat__value">
                  {pFatalValida ? porcentaje(pFatalNum) : 'No informado'}
                </p>
                {pFatalValida ? (
                  <div
                    className="md-meter"
                    role="progressbar"
                    aria-label="Probabilidad de fatalidad"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number((pFatalNum * 100).toFixed(1))}
                    aria-valuetext={porcentaje(pFatalNum)}
                  >
                    <span
                      style={{
                        width: `${Math.min(100, Math.max(0, pFatalNum * 100))}%`,
                      }}
                    />
                  </div>
                ) : (
                  <p className="md-stat__hint">La respuesta no incluye pFatal.</p>
                )}
              </div>

              <div className="md-stat">
                <p className="md-stat__label">Víctimas graves estimadas</p>
                <p className="md-stat__value">{vgValida ? numero1(vgNum) : 'No informado'}</p>
                <p className="md-stat__hint">Predicción del regresor.</p>
              </div>

              <div className="md-stat">
                <p className="md-stat__label">Nivel de alerta</p>
                <p className="md-stat__value text-lg">{nivelInfo.etiqueta}</p>
                <p className="md-stat__hint">
                  {resultado.nivelAlerta
                    ? 'Informado por el servicio.'
                    : calculada
                      ? 'Calculado en cliente con RN-04 a RN-07.'
                      : 'No informado.'}
                </p>
              </div>
            </div>
          </div>

          <div className="md-card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="md-eyebrow">Despacho</p>
                <h3 className="mt-1 md-section-title">Recomendación de despacho</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {calculada ? <Chip tono="warning">Calculado en cliente</Chip> : null}
                {recomendacionIncluida ? (
                  <Chip tono="success">Según el servicio</Chip>
                ) : null}
              </div>
            </div>

            {recomendacion ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Recurso
                    icono={<IconoAmbulancia />}
                    etiqueta="Ambulancias"
                    valor={valorEntero(recomendacion.ambulancias)}
                  />
                  <Recurso
                    icono={<IconoParamedico />}
                    etiqueta="Paramédico"
                    valor={valorBooleano(recomendacion.paramedico)}
                  />
                  <Recurso
                    icono={<IconoHelicoptero />}
                    etiqueta="Helicóptero"
                    valor={valorBooleano(recomendacion.helicoptero)}
                  />
                  <Recurso
                    icono={<IconoHospital />}
                    etiqueta="Alerta hospitalaria"
                    valor={valorBooleano(recomendacion.alertaHospital)}
                  />
                </div>

                <div className="md-fundamento">
                  <p className="md-fundamento__label">Fundamento</p>
                  <p className="text-sm leading-relaxed">
                    {recomendacion.fundamento || 'La respuesta no incluye fundamento.'}
                  </p>
                </div>

                {calculada ? (
                  <p className="md-note">
                    La respuesta no trajo recomendación. Se aplicaron RN-01 a RN-08 en el
                    cliente; no se ejecutó el modelo.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="md-note mt-3">
                {pFatalValida && vgValida
                  ? 'No hay recomendación disponible.'
                  : 'La respuesta no incluye pFatal o victimasGravesPred, por lo que tampoco es posible calcular la recomendación en cliente.'}
              </p>
            )}
          </div>

          {extras.length > 0 ? (
            <div className="md-card">
              <h3 className="md-section-title">Recursos adicionales informados</h3>
              <p className="md-note mt-1">
                ATS, AEB y AEA no están definidos en la Etapa 3. Se muestran solo porque la
                respuesta los incluye.
              </p>
              <dl className="md-meta">
                {extras.map(({ clave, valor }) => (
                  <div key={clave}>
                    <dt>{clave}</dt>
                    <dd>{valorTexto(valor)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <div className="md-card md-card--flat">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="md-eyebrow">Trazabilidad</p>
                <h3 className="mt-1 md-section-title">Datos de la respuesta</h3>
              </div>
              <IconoDocumento className="text-[var(--md-on-surface-variant)]" />
            </div>

            <dl className="md-meta">
              <div>
                <dt>Versión del modelo</dt>
                <dd>{valorTexto(resultado.modelVersion)}</dd>
              </div>
              <div>
                <dt>Latencia</dt>
                <dd>
                  {resultado.latencyMs === null || resultado.latencyMs === undefined
                    ? 'No informado'
                    : `${resultado.latencyMs} ms`}
                </dd>
              </div>
              <div>
                <dt>Modo</dt>
                <dd>{describirModo(modo)}</dd>
              </div>
              {resultado.predictionId ? (
                <div>
                  <dt>Predicción</dt>
                  <dd className="md-meta__mono">{resultado.predictionId}</dd>
                </div>
              ) : null}
              {resultado.artifactVersion ? (
                <div>
                  <dt>Artefactos</dt>
                  <dd className="md-meta__mono">{resultado.artifactVersion}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-[var(--md-on-surface-variant)]">
            <IconoInfo width={16} height={16} className="mt-0.5 shrink-0" />
            <span>
              La recomendación es un apoyo a la decisión del operador. ATS, AEB y AEA quedan
              pendientes de definición y solo se muestran si el servicio los informa.
            </span>
          </p>
        </>
      ) : null}
    </section>
  )
}
