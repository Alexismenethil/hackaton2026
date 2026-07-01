# Radar Escolar

Dashboard para docentes que detecta estudiantes en riesgo de bajo rendimiento o desercion a partir de su seguimiento semanal y genera una recomendacion de intervencion personalizada y explicable. La solucion fue construida para el Hackathon EPIS XXI, y este README esta pensado tambien como documento de sustentacion tecnica para jurado.

La demo usa nombres ficticios y contexto socioeducativo simulado. El riesgo se calcula solo con senales academicas y de asistencia; el contexto se usa unicamente para adaptar el apoyo recomendado.

Ver tambien [PLAN.md](/Users/macbook/Documents/Personal/hackaton2026/PLAN.md).

## Propuesta

Radar Escolar ayuda al docente a responder tres preguntas:

1. Que estudiantes necesitan revision prioritaria.
2. Que senal concreta disparo la alerta.
3. Que accion se puede tomar esta semana sin estigmatizar al estudiante.

## Stack

- Frontend: Next.js 14 (App Router) + React 18 + Tailwind CSS, en `/Users/macbook/Documents/Personal/hackaton2026/frontend`.
- Backend: Express + Node.js, en `/Users/macbook/Documents/Personal/hackaton2026/backend`.
- Base de datos: PostgreSQL, con cliente `pg` directo.
- IA: `Ollama` local con `qwen2.5:7b` como camino principal offline, y plantilla local como fallback final. `Gemini` queda como opción secundaria solo si se habilita explícitamente.

## Arquitectura

### Vista general

```mermaid
flowchart LR
    A["Docente / Jurado"] --> B["Frontend Next.js"]
    B --> C["API Express"]
    C --> D["Motor de riesgo deterministico"]
    C --> E["Cliente IA con fallback"]
    C --> F["PostgreSQL"]
    E --> H["Ollama local (qwen2.5:7b)"]
    E --> I["Plantilla local"]
    E --> G["Gemini (opcional)"]
```

### Arquitectura frontend

- Usa App Router de Next.js con renderizado del lado del servidor para las vistas principales.
- `/` muestra el tablero resumen con conteos de riesgo y tarjetas de estudiantes.
- `/estudiantes/[id]` muestra el detalle: perfil, evolucion semanal, senales detectadas, contexto de apoyo y recomendacion.
- El acceso al backend esta centralizado en [`frontend/lib/api.ts`](/Users/macbook/Documents/Personal/hackaton2026/frontend/lib/api.ts), que define los tipos de datos usados por la UI.
- El frontend no calcula el riesgo principal; consume el riesgo ya resuelto por el backend para mantener una sola fuente de verdad.

### Arquitectura backend

- [`backend/server.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/server.js) expone la API REST y el `healthcheck`.
- [`backend/routes/estudiantes.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/routes/estudiantes.js) concentra los endpoints de consulta y recomendacion.
- [`backend/lib/riskEngine.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/lib/riskEngine.js) implementa la regla de riesgo deterministica.
- [`backend/lib/aiClient.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/lib/aiClient.js) encapsula la generacion de recomendaciones con estrategia offline-first configurable.
- [`backend/prompts/radarSystemPrompt.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/prompts/radarSystemPrompt.js) define las restricciones eticas y de seguridad de uso para la IA.
- [`backend/db/seed.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/db/seed.js) genera un dataset reproducible para la demo.

### Flujo de datos

1. El frontend solicita lista o detalle de estudiantes al backend.
2. El backend consulta PostgreSQL y agrupa historial por estudiante.
3. El motor de riesgo compara primeras 2 semanas vs ultimas 2 semanas.
4. Si el usuario solicita recomendacion, el backend arma un prompt estructurado.
5. La recomendacion se intenta primero con `Ollama qwen2.5:7b`, y si no está disponible cae a una plantilla local sin depender de internet.
6. La UI muestra la recomendacion junto con la fuente que respondio: `gemini`, `ollama` o `plantilla-local`.

## Base de datos

### Motor y enfoque

- Motor: PostgreSQL.
- Acceso: cliente `pg` sin ORM.
- Modelo: 2 tablas relacionales.
- Carga de demo: seed deterministico para que el jurado vea siempre el mismo escenario.

### Modelo logico

- `estudiantes`: datos generales y contexto de apoyo.
- `seguimiento_semanal`: serie temporal academica por semana.
- Relacion: `estudiantes.id 1:N seguimiento_semanal.estudiante_id`.

### Esquema

El esquema operativo esta en [`backend/db/schema.sql`](/Users/macbook/Documents/Personal/hackaton2026/backend/db/schema.sql) y se deja un espejo de lectura rapida en [`db/schema.sql`](/Users/macbook/Documents/Personal/hackaton2026/db/schema.sql).

## Diccionario de datos

### Tabla `estudiantes`

| Campo | Tipo | Descripcion | Uso en el sistema |
|---|---|---|---|
| `id` | `SERIAL` | Identificador del estudiante | PK y relacion con seguimiento |
| `nombre_ficticio` | `VARCHAR(100)` | Nombre ficticio para demo | Presentacion en UI |
| `grado` | `VARCHAR(20)` | Grado academico | Segmentacion visual |
| `seccion` | `VARCHAR(10)` | Seccion del aula | Segmentacion visual |
| `clasificacion_socioeconomica` | `VARCHAR(20)` | `no_pobre`, `pobre`, `pobre_extremo` | Solo adapta la recomendacion; no calcula riesgo |
| `internet_en_casa` | `BOOLEAN` | Disponibilidad de internet | Adapta el tipo de apoyo |
| `lengua_materna` | `VARCHAR(50)` | Idioma predominante | Ayuda a sugerir acompanamiento pertinente |
| `distancia_a_escuela_km` | `NUMERIC(5,2)` | Distancia aproximada al centro educativo | Contexto logistico |
| `observacion_docente` | `TEXT` | Nota cualitativa del docente | Contexto adicional para la recomendacion |
| `situacion_laboral_familiar` | `VARCHAR(120)` | Situacion economica/laboral del hogar | Contexto de apoyo |
| `costo_estudio_mensual` | `NUMERIC(7,2)` | Estimacion de gasto mensual | Contexto de barreras |
| `estudiante_trabaja` | `BOOLEAN` | Si el estudiante realiza actividad laboral | Ajuste de intervencion |
| `problemas_salud_antecedentes` | `TEXT` | Antecedentes reportados, no diagnosticos | Coordinacion respetuosa, no uso medico |
| `es_foraneo` | `BOOLEAN` | Si vive fuera del entorno local inmediato | Ajuste de seguimiento |

### Tabla `seguimiento_semanal`

| Campo | Tipo | Descripcion | Uso en el sistema |
|---|---|---|---|
| `id` | `SERIAL` | Identificador del registro semanal | PK |
| `estudiante_id` | `INTEGER` | Referencia a `estudiantes.id` | FK |
| `semana` | `INTEGER` | Numero de semana observada | Orden temporal |
| `asistencia_pct` | `NUMERIC(5,2)` | Porcentaje de asistencia | Variable de riesgo |
| `promedio_notas` | `NUMERIC(4,2)` | Promedio academico en escala 0-20 | Variable de riesgo |
| `comprension_lectora` | `NUMERIC(4,2)` | Resultado de comprension en escala 0-20 | Variable de riesgo |
| `participacion_score` | `INTEGER` | Participacion en escala 1-5 | Variable de riesgo |
| `tareas_entregadas_pct` | `NUMERIC(5,2)` | Porcentaje de tareas entregadas | Variable de riesgo |

### Criterio de sensibilidad de datos

- Datos mostrados en la demo: ficticios o simulados.
- Datos sensibles o potencialmente sensibles: contexto socioeconomico, salud, lengua, trabajo y procedencia.
- Regla de negocio clave: estos campos no elevan ni justifican el nivel de riesgo; solo ayudan a personalizar el apoyo.

## Regla de riesgo

La clasificacion es deterministica y explicable. No usa ML.

- Compara el promedio de las primeras 2 semanas contra el promedio de las ultimas 2 semanas.
- Evalua 5 senales: asistencia, notas, comprension lectora, participacion y tareas entregadas.
- Nivel interno: `Alto` si hay 2 o mas senales, `Medio` si hay 1, `Bajo` si no hay senales activas.

| Senal | Umbral de alerta |
|---|---|
| Asistencia | Caida mayor a 15 puntos porcentuales |
| Notas | Caida mayor a 2 puntos |
| Comprension lectora | Caida mayor a 2 puntos |
| Participacion | Caida mayor a 1.5 puntos |
| Tareas entregadas | Caida mayor a 20 puntos porcentuales |

El backend tambien identifica la semana de mayor caida para citar el dato que justifica la recomendacion, por ejemplo `[Semana 6]`.

## API principal

| Metodo | Ruta | Descripcion |
|---|---|---|
| `GET` | `/api/health` | Verifica que el backend este operativo |
| `GET` | `/api/estudiantes` | Devuelve tablero resumen por estudiante |
| `GET` | `/api/estudiantes/:id` | Devuelve perfil, historial y riesgo |
| `POST` | `/api/estudiantes/:id/recomendacion` | Genera recomendacion con fallback |

## IA y explicabilidad

### Estrategia recomendada para la demo

Modo por defecto: `offline`

1. Ollama local (`qwen2.5:7b`)
2. Plantilla local deterministica

Modo opcional: `hybrid`

1. Ollama local (`qwen2.5:7b`)
2. Gemini (`gemini-2.5-flash`)
3. Plantilla local deterministica

Modo opcional: `cloud-first`

1. Gemini (`gemini-2.5-flash`)
2. Ollama local (`qwen2.5:7b`)
3. Plantilla local deterministica

Esto evita que la demo se rompa por falta de conectividad, caida del modelo o respuesta invalida. En la configuración por defecto no se intenta salir a internet.

### Restricciones eticas del prompt

La recomendacion esta gobernada por reglas explicitas:

- El riesgo se calcula solo con indicadores academicos y de asistencia.
- Pobreza, lengua, salud, trabajo, distancia o procedencia no son causa de riesgo.
- La IA no diagnostica, no culpabiliza y no etiqueta al estudiante.
- Si hay antecedentes de salud, solo sugiere coordinacion institucional o familiar.
- Si hay senales activas, debe citar la semana que sustenta la accion.

## Seguridad

### Seguridad implementada en la demo

- Configuracion por variables de entorno: `AI_MODE`, `DATABASE_URL`, `NEXT_PUBLIC_API_URL` y opcionalmente `GEMINI_API_KEY`.
- Consultas parametrizadas en PostgreSQL en los endpoints que reciben `id`.
- Separacion entre frontend y backend: la API key de Gemini no vive en el cliente.
- Nombres ficticios y dataset simulado para evitar exposicion de datos reales.
- Guardrails en el prompt para impedir uso discriminatorio de variables sensibles.
- Camino principal local para no depender de servicios externos durante la evaluacion.

### Brechas conocidas de esta version

- No hay autenticacion ni autorizacion; se asume un unico docente en contexto demo.
- `cors()` esta abierto y deberia restringirse por origen en produccion.
- No hay rate limiting ni proteccion anti abuso sobre la ruta de recomendacion.
- No hay auditoria de accesos ni trazabilidad de acciones por usuario.
- La cache de recomendaciones esta en memoria y se pierde al reiniciar el servidor.

### Endurecimiento recomendado para produccion

1. Autenticacion con sesiones o JWT y roles por docente/directivo.
2. Politica CORS cerrada por dominio.
3. Rate limiting y cuotas por usuario para endpoints de IA.
4. Cifrado de secretos, rotacion de claves y vault de configuracion.
5. Logs de auditoria, monitoreo y alertas.
6. Politicas de minimizacion y retencion de datos personales.

## Requisitos

- Node.js 18+
- Docker
- Ollama local con `qwen2.5:7b` para el modo offline

## Arranque

### 1. Base de datos

```bash
docker run --name radar-db -e POSTGRES_PASSWORD=hackathon -p 5432:5432 -d postgres
```

Si el contenedor ya existe:

```bash
docker start radar-db
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
docker exec -i radar-db psql -U postgres -d postgres < db/schema.sql
npm run seed
npm run dev
```

Backend disponible en `http://localhost:3001`.

Para uso sin internet, inicia Ollama en tu máquina y descarga el modelo una vez:

```bash
ollama serve
ollama pull qwen2.5:7b
```

La configuración por defecto del backend ya prioriza este flujo con `AI_MODE=offline`.

Si quieres actualizar solo el contexto extendido:

```bash
docker exec -i radar-db psql -U postgres -d postgres < db/hackathon_context_update.sql
npm run seed
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend disponible en `http://localhost:3000`.

## Archivos utiles para evaluacion

- [`README.md`](/Users/macbook/Documents/Personal/hackaton2026/README.md): resumen tecnico y funcional.
- [`PLAN.md`](/Users/macbook/Documents/Personal/hackaton2026/PLAN.md): decisiones de producto y construccion.
- [`db/schema.sql`](/Users/macbook/Documents/Personal/hackaton2026/db/schema.sql): espejo del esquema SQL para lectura rapida.
- [`db/evaluacion.sql`](/Users/macbook/Documents/Personal/hackaton2026/db/evaluacion.sql): consulta resumen por estudiante.
- [`backend/lib/riskEngine.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/lib/riskEngine.js): regla explicable de riesgo.
- [`backend/prompts/radarSystemPrompt.js`](/Users/macbook/Documents/Personal/hackaton2026/backend/prompts/radarSystemPrompt.js): restricciones eticas de IA.

## Alcance no incluido en esta demo

- Sin autenticacion real.
- Sin bitacora persistente de observaciones; el componente existe como mock visual.
- Sin agenda real para la accion de orientacion.
- Sin despliegue productivo ni observabilidad operativa completa.
