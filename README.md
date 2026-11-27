# SAMUAPP · Front end de captura y acceso

Aplicación web para registrar un siniestro vial, iniciar sesión y mostrar la
recomendación de despacho del SAMU. Consume la interfaz de predicción del
servicio SAMUAPP; no calcula el modelo.

- React 18, JavaScript (sin TypeScript).
- Vite.
- Tailwind CSS para layout y espaciado.
- Tokens de color de Material Design 3 en CSS.
- Tipografía Roboto.
- Vitest para las pruebas y ESLint para el análisis estático.

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

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite. |
| `npm run build` | Compila el sitio estático en `dist/`. |
| `npm run preview` | Sirve localmente lo compilado en `dist/`. |
| `npm test` | Ejecuta la suite de pruebas (Vitest). |
| `npm run test:watch` | Pruebas en modo interactivo. |
| `npm run test:coverage` | Pruebas con informe de cobertura. |
| `npm run lint` | Análisis estático (ESLint). |
| `npm run lint:fix` | Análisis estático con correcciones automáticas. |
| `npm run verificar` | `lint` + `test` + `build`: la puerta de calidad de la CI. |

## Variables de entorno

Copia `.env.example` a `.env` y ajusta lo necesario.

| Variable | Valores | Efecto |
|---|---|---|
| `VITE_AUTH_MODE` | `off`, `demo` (por defecto), `firebase` | Selecciona el subsistema de identidad. |
| `VITE_ADAPTADOR_PREDICCION` | `mock` (por defecto), `http` | Selecciona el adaptador de la interfaz `predecirSiniestro`. |
| `VITE_API_BASE_URL` | URL | Base del servicio HTTP. Sin ella, el adaptador HTTP falla de forma explícita. |
| `VITE_API_PREDICT_PATH` | ruta | Por defecto `/api/v1/predictions`. |
| `VITE_API_AUTH_PATH` | ruta | Por defecto `/api/v1/auth/sesion`. |
| `VITE_API_REGISTER_PATH` | ruta | Por defecto `/api/v1/auth/registro`. |
| `VITE_API_TIMEOUT_MS` | entero | Espera máxima de la respuesta del servicio. Por defecto `10000`. |
| `VITE_MOCK_RETARDO_MS` | entero | Retardo artificial del mock. |
| `VITE_MOCK_SIN_RECOMENDACION` | `true`/`false` | Si es `true`, el mock omite `recomendacion` para probar RN-01..RN-08 en cliente. |
| `VITE_FIREBASE_API_KEY` | clave | Clave de API de Firebase Authentication. No es un secreto: viaja en el bundle del navegador. |
| `VITE_FIREBASE_PROJECT_ID` | proyecto | Identificador del proyecto de Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | dominio | Dominio de autenticación de Firebase. |
| `VITE_FIREBASE_REGION` | región | Región del proyecto. Por defecto `southamerica-west1`. |

Con `VITE_ADAPTADOR_PREDICCION=mock` el panel muestra siempre la etiqueta visible
**MODO DEMO**.

## Acceso al sistema (HU-01)

El control de acceso sigue el modelo de roles de §4.10: `operador`,
`supervisor` y `admin`. El token de identidad viaja en la cabecera
`Authorization: Bearer <token>` y el `uid` lo toma **siempre** el servidor a
partir del token verificado, nunca el formulario.

El modo se elige con `VITE_AUTH_MODE`:

| Modo | Comportamiento |
|---|---|
| `off` | No hay control de acceso: la aplicación abre directo. Es el modo en que vivía el prototipo. |
| `demo` | El ingreso se hace contra el servicio (`POST /api/v1/auth/sesion`). Si el servicio no responde, la pantalla ofrece la identidad local de demostración, que solo es válida con el adaptador `mock`. |
| `firebase` | El ingreso se hace contra Firebase Authentication (Identity Platform), que es la vía de producción. El rol llega como *custom claim* del token; el usuario no puede elegirlo. |

La sesión se guarda en `sessionStorage`: se pierde al cerrar la pestaña, que
es el comportamiento esperado de un turno de despacho. El token nunca se
escribe en la URL ni en el log.

Si el servicio responde `401` porque el token venció, la aplicación vuelve al
inicio de sesión **sin desmontar el formulario**: no se pierde lo que el
operador ya capturó (CA-01.6).

### Credenciales de demostración

Con el servicio en modo desarrollo (`SAMUAPP_AUTH_MODE=dev`) se siembran tres
cuentas de prueba:

| Correo | Rol | Contraseña |
|---|---|---|
| `operador@samuapp.cl` | Operador | `Samuapp2026!` |
| `supervisor@samuapp.cl` | Supervisor | `Samuapp2026!` |
| `admin@samuapp.cl` | Administrador | `Samuapp2026!` |

El registro de una cuenta nueva desde la aplicación usa el mismo servicio y
exige una contraseña de **mínimo 12 caracteres** (CA-01.3).

## Árbol de archivos

```text
.
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── public
│   └── _redirects
├── render.yaml
├── tailwind.config.js
├── vite.config.js
├── vitest.config.js
├── vitest.setup.js
├── README.md
└── src
    ├── App.jsx
    ├── main.jsx
    ├── components
    │   ├── FormularioSiniestro.jsx
    │   ├── Iconos.jsx
    │   ├── InvolucradoCard.jsx
    │   ├── PanelResultados.jsx
    │   ├── PantallaAcceso.jsx
    │   ├── SesionIndicador.jsx
    │   └── ui.jsx
    ├── data
    │   ├── catalogos.js
    │   └── regionesComunas.js
    ├── domain
    │   ├── despacho.js
    │   ├── sesion.js
    │   └── validacion.js
    ├── services
    │   ├── auth
    │   │   ├── almacenSesion.js
    │   │   ├── clienteAuth.js
    │   │   ├── proveedorBackend.js
    │   │   ├── proveedorFirebase.js
    │   │   └── token.js
    │   ├── adaptadorHttp.js
    │   ├── adaptadorMock.js
    │   ├── errores.js
    │   ├── eventos.js
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
3. `prediccion.js` delega en el adaptador activo (`mock` u `http`). El adaptador HTTP adjunta
   el token de identidad en la cabecera `Authorization: Bearer`.
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
13. **La identidad vive en `services/auth/`.** `domain/sesion.js` contiene las reglas puras
    (validación, expiración, jerarquía de roles) sin dependencias de React ni de plataforma.
14. **El token se adjunta en un solo lugar.** `services/auth/token.js` es la costura entre la
    sesión y los adaptadores: el token no queda desincronizado con la interfaz.
15. **Con Firebase, el rol no lo elige el usuario.** Se toma del *custom claim* del token, que
    es lo que impide el escalamiento de privilegios.
16. **La identidad local de demostración solo existe con el adaptador `mock`.** Sin token no
    hay forma de llamar al servicio real, y la interfaz no ofrece un camino que prometa lo
    contrario.

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
12. **App Check y cuota por `uid`:** §4.10 los exige, pero su implementación depende del
    proyecto de Firebase; no están en esta versión.
13. **Persistencia del histórico:** el backend ya la tiene (SQLite); la vista de histórico en
    la SPA todavía no.
14. **Verificación de correo y recuperación de contraseña:** las aporta Firebase
    Authentication; el modo de desarrollo no las implementa.

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

## Cómo probar el acceso al sistema

Con el servicio corriendo en modo desarrollo:

```bash
# En el repositorio del backend:
SAMUAPP_AUTH_MODE=dev python -m uvicorn adapters.api.main:app --port 8000
```

```bash
# En este repositorio:
cp .env.example .env
# Edita .env:
# VITE_AUTH_MODE=demo
# VITE_ADAPTADOR_PREDICCION=http
# VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

Ingresa con `operador@samuapp.cl` / `Samuapp2026!`. El token que devuelve el servicio se
adjunta a la petición de predicción, y el panel muestra el usuario y su rol en la cabecera.

## Despliegue

`render.yaml` describe el sitio estático: Render compila con `npm ci && npm run build` y
sirve `dist/`, reescribiendo todas las rutas a `index.html` para el enrutado del cliente.

Las variables `VITE_*` se incorporan al bundle **durante la construcción**: Render las
inyecta en el entorno del build. Para cambiar la URL del servicio hay que reconstruir el
sitio, no solo reiniciarlo.

El archivo `public/_redirects` es la equivalente para hosted como Netlify o Cloudflare
Pages; en Render la reescritura la hace el blueprint.
