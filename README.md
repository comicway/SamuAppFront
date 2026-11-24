# SAMUAPP · Front end de captura y recomendación de despacho

Prototipo **solo front end** para registrar un siniestro vial y mostrar la recomendación de
despacho del SAMU. No incluye backend, Cloud Functions, autenticación, reglas de Firebase ni
persistencia.

- React 18, JavaScript (sin TypeScript).
- Vite.
- Tailwind CSS para layout y espaciado.
- Tokens de color de Material Design 3 en CSS.
- Tipografía Roboto.

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

```bash
npm run build
npm run preview
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta lo necesario.

| Variable | Valores | Efecto |
|---|---|---|
| `VITE_ADAPTADOR_PREDICCION` | `mock` (por defecto), `http` | Selecciona el adaptador de la interfaz `predecirSiniestro`. |
| `VITE_API_BASE_URL` | URL | Base del servicio HTTP. Sin ella, el adaptador HTTP falla de forma explícita. |
| `VITE_API_PREDICT_PATH` | ruta | Por defecto `/api/v1/predictions`. |
| `VITE_MOCK_RETARDO_MS` | entero | Retardo artificial del mock. |
| `VITE_MOCK_SIN_RECOMENDACION` | `true`/`false` | Si es `true`, el mock omite `recomendacion` para probar RN-01..RN-08 en cliente. |

Con `VITE_ADAPTADOR_PREDICCION=mock` el panel muestra siempre la etiqueta visible
**MODO DEMO**.

## Árbol de archivos

```text
.
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md
└── src
    ├── App.jsx
    ├── main.jsx
    ├── components
    │   ├── FormularioSiniestro.jsx
    │   ├── Iconos.jsx
    │   ├── InvolucradoCard.jsx
    │   ├── PanelResultados.jsx
    │   └── ui.jsx
    ├── data
    │   ├── catalogos.js
    │   └── regionesComunas.js
    ├── domain
    │   ├── despacho.js
    │   └── validacion.js
    ├── services
    │   ├── adaptadorHttp.js
    │   ├── adaptadorMock.js
    │   ├── errores.js
    │   └── prediccion.js
    ├── styles
    │   ├── index.css
    │   └── tokens.css
    └── utils
        └── formato.js
```

## Flujo

1. `FormularioSiniestro` valida en cliente (CA-02.2, CA-02.3, CA-02.4 y CA-02.7).
2. Si es válido, construye el payload `{ data, notas?, siniestroRef? }` y llama únicamente a
   `predecirSiniestro(payload)`.
3. `prediccion.js` delega en el adaptador activo (`mock` u `http`).
4. `PanelResultados` muestra la respuesta. Si trae `recomendacion`, la muestra tal cual. Si no
   la trae, aplica RN-01 a RN-08 y marca el resultado como **Calculado en cliente**.
5. ATS, AEB y AEA solo se renderizan si la respuesta los incluye.

### Contrato del payload

```json
{
  "data": {
    "fecha": "2026-11-24",
    "hora": 3,
    "comuna": "Colchane",
    "region": "Tarapacá",
    "urbano": false,
    "involucrados": [{ "sexo": "M", "edad": 34, "tipo": "Camioneta" }]
  },
  "notas": "Volcamiento en ruta",
  "siniestroRef": "Parte N.º 1234"
}
```

`notas` y `siniestroRef` se omiten del cuerpo si están vacíos. La respuesta esperada sigue la
forma de §4.9: `predictionId`, `pFatal`, `victimasGravesPred`, `nivelAlerta`,
`recomendacion`, `modelVersion`, `latencyMs` y `mode` (además de `artifactVersion` si existe).

## Datos de regiones y comunas

- 16 regiones y **345 comunas**, según el conjunto abierto
  [`open-admin-data/chile-administrative-divisions`](https://github.com/open-admin-data/chile-administrative-divisions).
- Se corrigió el registro CUT `01401`, que venía rotulado como **Tocopilla** dentro de
  Tarapacá. Su nombre canónico es **Pozo Almonte**. Tocopilla permanece en Antofagasta
  (CUT `02301`), por lo que el total sigue siendo 345.
- Se excluye **Antártica**, que no es una comuna y no forma parte de las 345.
- La comuna se filtra por región y la validación rechaza una combinación inconsistente aunque
  se manipule el estado.

## Decisiones tomadas

1. **El formulario no calcula el modelo.** Solo llama a `predecirSiniestro`. El cálculo de
   respaldo de RN-01..RN-08 vive en `domain/despacho.js` y se usa únicamente en el panel
   cuando la respuesta no trae `recomendacion`.
2. **Botón de envío deshabilitado mientras haya errores.** La validación corre en cada
   cambio; los errores inline aparecen al tocar el campo o al intentar enviar. Además se
   muestra un resumen con `aria-live` y el número de campos pendientes junto al botón.
3. **El involucrado 1 no se puede quitar.** Los slots 2 a 10 se agregan con un botón y se
   pueden quitar. Todo slot agregado debe completarse: de lo contrario el payload incluiría
   un involucrado incompleto y el backend lo rechazaría.
4. **Al cambiar la región se limpia la comuna.** Evita conservar una comuna de otra región.
5. **La hora y la edad se convierten a número** al construir el payload. `urbano` se convierte
   a booleano.
6. **Los campos opcionales vacíos no se envían.**
7. **El mock es determinista por payload** y devuelve uno de cuatro escenarios de ejemplo.
   Con `VITE_MOCK_SIN_RECOMENDACION=true` omite `recomendacion` para ejercitar el fallback.
8. **La recomendación del servicio se muestra tal cual.** No se recalcula ni se completa si
   viene parcial: los campos ausentes se muestran como «No informado».
9. **Nivel de alerta:** se usan los valores del enum `NivelAlerta` del diagrama de clases
   (`ESTANDAR`, `REFORZADO`, `ALERTA_HOSPITAL`, `CRITICO`). Un valor no catalogado se muestra
   tal cual, con formato legible.
10. **Modo:** se aceptan `modelo`/`MODELO`, `degradado`/`DEGRADADO` y `demo`. El modo demo se
    muestra como **MODO DEMO** en el panel y en la cabecera.
11. **ATS, AEB y AEA** se buscan en la raíz de la respuesta o dentro de `recomendacion`. Si no
    existen, no se renderiza ningún bloque.
12. **Diseño:** tarjetas con elevación, chips, botones MD3, etiquetas flotantes y foco visible.
    Una columna en móvil; dos columnas en escritorio, con el panel sticky.
13. **Sin persistencia local** y sin autenticación: están fuera del alcance de esta tarea.

## Reglas de respaldo en cliente (RN-01..RN-08)

Se aplican solo si `recomendacion` está ausente.

- RN-01: `ambulancias = max(1, floor(VG × 1,5))`.
- RN-02: `helicoptero = VG > 1,0`.
- RN-03: `alertaHospital = VG > 0,5`.
- RN-04..RN-07: franjas de `P(fatal)` y `VG` para el nivel de alerta.
- RN-08: mínimo una ambulancia.
- `paramedico`: verdadero desde el nivel `REFORZADO` en adelante. RN-05 lo exige de forma
  explícita; se asume que los niveles más severos también lo requieren.

Supuesto de fronteras: `P(fatal) < 10 %` → ESTANDAR; `[10 %, 30 %)` → REFORZADO;
`[30 %, 60 %]` → ALERTA_HOSPITAL; `> 60 %` → CRITICO. Para VG: `< 0,3` → ESTANDAR;
`[0,3; 1,0)` → REFORZADO; `[1,0; 3,0]` → ALERTA_HOSPITAL; `> 3,0` → CRITICO.

Si `P(fatal)` y `VG` caen en franjas distintas, se toma la más severa (criterio conservador),
porque RN-04..RN-07 están redactadas con «y». Queda pendiente confirmarlo con el equipo
clínico.

## Pendientes y datos no definidos en la Etapa 3

1. **ATS, AEB y AEA:** no están definidos en el documento de Etapa 3. No se conoce su tipo,
   rango, unidad ni cuándo aplican. La UI solo los muestra si la respuesta los incluye; no se
   inventan valores ni se calculan.
2. **Contradicción RN-02 vs CA-04.2 y el ejemplo de §4.9:** con `VG = 2,1` (o `2,08`), RN-02
   implica `helicoptero = true`, pero CA-04.2 dice «no se indica helicóptero» y el ejemplo de
   §4.9 trae `helicoptero: false`. El cálculo en cliente sigue RN-02; la fuente debe
   corregirse o aclararse.
3. **Serialización de `NivelAlerta`:** el diagrama de clases usa
   `ESTANDAR/REFORZADO/ALERTA_HOSPITAL/CRITICO`; §4.9 solo muestra `ALERTA_HOSPITAL`. Falta
   confirmar si el backend envía códigos, etiquetas o ambos.
4. **Serialización de `Modo`:** el diagrama usa `MODELO/DEGRADADO`; §4.9 usa `"modelo"` en
   minúsculas. Se admite ambos.
5. **Ubicación de `siniestroRef` en el request:** §4.9 define `data` y `notas`, pero no
   `siniestroRef`. Se envía en el sobre; falta confirmación del contrato.
6. **Normalización geográfica:** el contrato usa nombres con tildes («Tarapacá»), mientras que
   el CSV de entrenamiento usa mayúsculas y sin tildes («TARAPACA»). El backend debe
   normalizar antes del target encoding. El front end no altera los nombres.
7. **345 vs 346 comunas:** se excluye Antártica para cuadrar con las 345 del enunciado. Si el
   backend usa 346, hay que agregarla.
8. **Valores canónicos de `tipo`:** el enunciado pide 18 valores con `Camion`, `Furgon`,
   `Minibus` y `TraccionAnimal`, pero §4.9 escribe `Camión`. Falta el listado canónico del
   encoder del modelo.
9. **Fronteras de RN-04..RN-07 y precedencia entre P(fatal) y VG:** no están especificadas
   para casos mixtos. Se documenta el supuesto conservador anterior.
10. **`paramedico` en RN-06/RN-07:** no se enumera explícitamente; se asume heredado.
11. **Límites de longitud** de `notas` y `siniestroRef`: no definidos.
12. **Adaptador HTTP:** el contrato es una Callable Function de Firebase; este adaptador hace
    un `POST` JSON simple. No incluye token de identidad, CORS ni App Check. Está sin
    conectar y solo se activa por variable de entorno.
13. **CA-02.1 (consultar el último siniestro), CA-02.5 (paridad con entrenamiento) y CA-02.6
    (vector de 40 características):** dependen del backend y de persistencia; no son
    verificables solo con este front end.
14. **Autenticación, roles y persistencia:** fuera del alcance por enunciado.

## Cómo probar el fallback de recomendación

```bash
VITE_MOCK_SIN_RECOMENDACION=true npm run dev
```

Completa el formulario y envía. El panel mostrará **Calculado en cliente**, la recomendación
derivada de RN-01..RN-08 y la nota de que no se ejecutó el modelo.

## Cómo probar el adaptador HTTP

```bash
cp .env.example .env
# Edita .env:
# VITE_ADAPTADOR_PREDICCION=http
# VITE_API_BASE_URL=https://tu-servicio.example.com
npm run dev
```

Sin `VITE_API_BASE_URL`, el panel muestra un error explícito de configuración y no inventa
una predicción.
