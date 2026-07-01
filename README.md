# Radar Escolar

Dashboard para docentes que detecta estudiantes en riesgo de bajo
rendimiento/deserción a partir de su historial de seguimiento semanal, y
genera una recomendación de intervención personalizada y explicable,
citando el dato exacto que la motiva (`[Semana N]`).
La demo también incorpora contexto simulado de apoyo (CSE tipo SISFOH,
conectividad, lengua materna, distancia, situación laboral, costo de estudio,
trabajo, salud y condición de foráneo) para adaptar la intervención sin usarlo
como causa del riesgo.

Hecho para el Hackathon EPIS XXI (reto de Educación). Ver [PLAN.md](PLAN.md)
para el detalle de decisiones y orden de construcción.

## Stack

- **Frontend**: Next.js (App Router) + Tailwind, `frontend/`.
- **Backend**: Express (Node), `backend/` — llamadas a Gemini con fallback a
  Ollama y, si tampoco está disponible, a una plantilla local determinística.
- **Base de datos**: PostgreSQL en Docker, cliente `pg` directo (sin ORM).

## Requisitos

- Node.js 18+
- Docker (para Postgres)
- Opcional: [Ollama](https://ollama.com) corriendo localmente con el modelo
  `qwen2.5:7b` para probar el segundo nivel del fallback de IA.

## Arranque

### 1. Base de datos

```bash
docker run --name radar-db -e POSTGRES_PASSWORD=hackathon -p 5432:5432 -d postgres
```

Si el contenedor ya existe de una corrida anterior: `docker start radar-db`.

### 2. Backend

```bash
cd backend
cp .env.example .env   # agrega tu GEMINI_API_KEY si la tienes
npm install
docker exec -i radar-db psql -U postgres -d postgres < db/schema.sql
npm run seed            # siembra 18 estudiantes x 8 semanas
npm run dev              # http://localhost:3001
```

Si ya tenías una base anterior, puedes aplicar solo la actualización de
contexto:

```bash
docker exec -i radar-db psql -U postgres -d postgres < db/hackathon_context_update.sql
npm run seed
```

Para evaluación rápida también dejé una carpeta raíz `db/` con:

- `db/schema.sql`: esquema espejo para ubicarlo rápido.
- `db/evaluacion.sql`: consulta resumen por estudiante para revisar la demo.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:3000
```

Abre `http://localhost:3000`.

## Regla de riesgo

Determinística, sin ML: compara el promedio de las primeras 2 semanas contra
las últimas 2, para asistencia, notas, comprensión lectora, participación y
entrega de tareas (`backend/lib/riskEngine.js`).

| Señal | Umbral |
|---|---|
| Asistencia | cae más de 15 puntos porcentuales |
| Notas (0-20) | cae más de 2 puntos |
| Comprensión lectora (0-20) | cae más de 2 puntos |
| Participación (1-5) | cae más de 1.5 puntos |
| Tareas entregadas | cae más de 20 puntos porcentuales |

Riesgo interno: **Alto** (2+ señales), **Medio** (1 señal), **Bajo** (ninguna).
El frontend nunca muestra estas etiquetas directamente — usa lenguaje no
punitivo (`frontend/lib/riskLabels.ts`):

| Interno | En pantalla |
|---|---|
| Bajo | Sin novedad |
| Medio | Vale la pena revisar |
| Alto | Necesita atención prioritaria |

## Recomendación de IA — fallback en 3 niveles

`POST /api/estudiantes/:id/recomendacion` funciona para los 3 niveles de
riesgo (seguimiento preventivo breve en Bajo, intervención concreta en
Medio/Alto) y nunca rompe la demo:

1. **Gemini** (`gemini-2.5-flash`) — si `GEMINI_API_KEY` no está configurada o
   falla por cualquier motivo, pasa al siguiente nivel.
2. **Ollama local** (`qwen2.5:7b`) — si no está instalado, no está corriendo,
   o no hay internet, pasa al siguiente nivel.
3. **Plantilla local** (`backend/lib/recommendationTemplate.js`) — no depende
   de red ni de ningún modelo; siempre puede responder.

La respuesta incluye `fuente: "gemini" | "ollama" | "plantilla-local"` para
que quede visible en la demo cuál nivel respondió. Las recomendaciones se
cachean en memoria por estudiante (se pierden al reiniciar el backend).

Para forzar la caída de un nivel y probar el fallback en vivo (variables en
`backend/.env`):

```bash
FORCE_GEMINI_FAILURE=true npm run dev   # fuerza el salto a Ollama
FORCE_GEMINI_FAILURE=true FORCE_OLLAMA_FAILURE=true npm run dev   # fuerza la plantilla local
```

## Restricciones no negociables (system prompt)

El riesgo se calcula solo a partir de comportamiento medible (asistencia,
notas, comprensión lectora, participación y tareas) — nunca a partir de
pobreza, salud, procedencia, lengua o trabajo. El contexto solo adapta la
recomendación: material impreso si no hay internet, apoyo bilingüe si aplica,
seguimiento flexible por distancia, coordinación con familia/tutoría si hay
antecedentes de salud, etc. Ver `backend/prompts/radarSystemPrompt.js`.

## Alcance no incluido en esta demo

- **Bitácora de observaciones**: mock estático en el frontend
  (`frontend/components/detail/ObservationLog.tsx`); el campo
  `observacion_docente` sí viene de la base simulada.
- Sin autenticación (un solo docente implícito).
- El botón "Agendar cita de orientación" es un stub visual, no agenda nada real.
