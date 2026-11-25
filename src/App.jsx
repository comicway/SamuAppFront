import { useEffect, useRef, useState } from 'react'
import FormularioSiniestro from './components/FormularioSiniestro'
import PanelResultados from './components/PanelResultados'
import { Chip } from './components/ui'
import { IconoAmbulancia, IconoLuna, IconoSol } from './components/Iconos'
import { ES_MODO_DEMO } from './services/prediccion'

const CLAVE_TEMA = 'samuapp-tema'
const TEMA_CLARO = 'light'
const TEMA_OSCURO = 'dark'

function leerTemaInicial() {
  if (typeof window === 'undefined') return TEMA_CLARO
  try {
    const guardado = window.localStorage.getItem(CLAVE_TEMA)
    if (guardado === TEMA_CLARO || guardado === TEMA_OSCURO) return guardado
  } catch {
    // Sin almacenamiento disponible se usa la preferencia del sistema.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? TEMA_OSCURO : TEMA_CLARO
}

export default function App() {
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [tema, setTema] = useState(leerTemaInicial)
  const panelRef = useRef(null)
  const esOscuro = tema === TEMA_OSCURO

  function manejarInicio() {
    setResultado(null)
    setError(null)
  }

  function manejarResultado(respuesta) {
    setResultado(respuesta)
    setError(null)
  }

  function manejarError(fallo) {
    setResultado(null)
    setError(fallo)
  }

  function limpiarResultados() {
    setResultado(null)
    setError(null)
  }

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    try {
      window.localStorage.setItem(CLAVE_TEMA, tema)
    } catch {
      // Si el almacenamiento está bloqueado, el tema sigue funcionando en memoria.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', esOscuro ? '#12130d' : '#ECE819')
  }, [tema, esOscuro])

  useEffect(() => {
    if (!resultado && !error) return
    if (!window.matchMedia('(max-width: 1023px)').matches) return

    const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panelRef.current?.scrollIntoView({
      behavior: movimientoReducido ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [resultado, error])

  return (
    <div className="min-h-screen">
      <header className="app-bar">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="brand-mark shrink-0">
              <IconoAmbulancia width={26} height={26} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--md-primary-ink)]">
                SAMU · Despacho asistido
              </p>
              <h1 className="text-base font-medium leading-tight sm:text-xl">
                Predicción de siniestros viales
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Chip tono="neutral" className="hidden sm:inline-flex">
              Solo front end
            </Chip>
            {ES_MODO_DEMO ? <Chip tono="demo">MODO DEMO</Chip> : null}
            <button
              type="button"
              role="switch"
              aria-checked={esOscuro}
              aria-label="Tema oscuro"
              title={esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="md-theme-switch"
              onClick={() => setTema(esOscuro ? TEMA_CLARO : TEMA_OSCURO)}
            >
              <span className="md-theme-switch__icon" aria-hidden="true">
                <IconoSol />
              </span>
              <span className="md-theme-switch__icon" aria-hidden="true">
                <IconoLuna />
              </span>
              <span className="md-theme-switch__thumb" aria-hidden="true">
                {esOscuro ? <IconoLuna /> : <IconoSol />}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 max-w-3xl">
          <p className="md-eyebrow">HU-02 · Captura y predicción</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--md-on-surface-variant)] sm:text-base">
            Registra el siniestro con los 8 campos mínimos del modelo y obtén la probabilidad
            de fatalidad, las víctimas graves estimadas y la recomendación de despacho. La
            aplicación no calcula el modelo: solo consume la interfaz de predicción.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <FormularioSiniestro
            onResultado={manejarResultado}
            onError={manejarError}
            onInicio={manejarInicio}
            onLimpiar={limpiarResultados}
            onCargandoChange={setCargando}
          />

          <div
            ref={panelRef}
            className="scroll-mt-24 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
          >
            <PanelResultados
              resultado={resultado}
              cargando={cargando}
              error={error}
              esDemo={ES_MODO_DEMO}
            />
          </div>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-8 pt-2 sm:px-6">
        <div className="border-t border-[var(--md-outline-variant)] pt-4 text-xs leading-relaxed text-[var(--md-on-surface-variant)]">
          <p>
            Prototipo front end de SAMUAPP. No incluye backend, autenticación ni persistencia.
          </p>
          <p className="mt-1">
            Referencias: §3.3 HU-02, §3.4 RN-01 a RN-08, §4.9 y §5.4.2.1 de la Etapa 3.
          </p>
        </div>
      </footer>
    </div>
  )
}
