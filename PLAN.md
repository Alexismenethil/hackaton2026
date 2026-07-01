# Radar Escolar — Plan de construcción (Hackathon EPIS XXI, bloque 3h)

Referencia de convenciones: `asitente-de-estudio-preview` (TutorPDF) de anoche —
mismo patrón `lib/aiClient.js` (Gemini primario, Ollama fallback en errores
transitorios), mismo layout `backend/` + `frontend/` a nivel de raíz.

## Decisiones abiertas (aprobadas)
- [x] Bitácora de observaciones = mock estático en frontend (no hay tabla en el
      esquema fijo, no se persiste).
- [x] Recomendación de IA se genera on-demand y se cachea en memoria
      (Map en backend, no en DB — se pierde al reiniciar el server).
- [x] Se suma `recharts` como dependencia nueva del frontend (no estaba en
      TutorPDF) para el sparkline y el gráfico de evolución.

## Ajustes pedidos tras la aprobación (todos aplicados)
- [x] Niveles internos Bajo/Medio/Alto sin cambios; el frontend muestra
      "Sin novedad" / "Vale la pena revisar" / "Necesita atención prioritaria".
- [x] `POST /:id/recomendacion` funciona para los 3 niveles: seguimiento
      preventivo breve en Bajo, intervención detallada en Medio/Alto.
- [x] Fallback de IA en 3 niveles: Gemini → Ollama → plantilla local
      determinística (sin red, sin modelo) que nunca puede fallar.
- [x] Verificado en vivo: sin `GEMINI_API_KEY` válida cae a Ollama; forzando
      también el fallo de Ollama (`FORCE_OLLAMA_FAILURE=true`) cae a la
      plantilla local. La demo no se rompe en ningún escalón.
- [x] Esquema ampliado para hackatón: CSE simulada tipo SISFOH, conectividad,
      lengua, distancia, situación laboral, costo de estudio, trabajo,
      antecedentes de salud y condición de foráneo. Estos campos adaptan la
      recomendación, pero no suben ni justifican el riesgo.
- [x] Seguimiento semanal ampliado con comprensión lectora y tareas entregadas.
- [x] SQL de reporte/migración disponible en `backend/db/hackathon_context_update.sql`.

## Estructura de archivos

```
hackaton2026/
├── PLAN.md
├── README.md
├── backend/
│   ├── .env.example        # GEMINI_API_KEY, PORT, DATABASE_URL
│   ├── package.json
│   ├── server.js           # express + cors + rutas + error handler
│   ├── db/
│   │   ├── schema.sql      # las 2 tablas ya decididas
│   │   └── seed.js         # 15-20 estudiantes x 8 semanas, distribución dirigida
│   ├── lib/
│   │   ├── db.js           # pg Pool, sin ORM
│   │   ├── riskEngine.js   # primeras 2 vs últimas 2 semanas, señales + nivel de riesgo
│   │   └── aiClient.js     # mismo patrón que TutorPDF: Gemini -> fallback Ollama
│   ├── prompts/
│   │   └── radarSystemPrompt.js   # restricciones no negociables del reto
│   └── routes/
│       └── estudiantes.js  # GET /api/estudiantes, GET /:id, POST /:id/recomendacion
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                 # Resumen (cards de conteo + grid de estudiantes)
    │   └── estudiantes/[id]/page.tsx  # Detalle: perfil, evolución, señales, IA, bitácora
    ├── components/
    │   ├── Sidebar.tsx / TopBar.tsx
    │   ├── SummaryCards.tsx
    │   ├── StudentCard.tsx / RiskBadge.tsx
    │   └── detail/
    │       ├── ProfileCard.tsx
    │       ├── EvolutionChart.tsx      # recharts, notas vs asistencia
    │       ├── SignalsList.tsx
    │       ├── AIRecommendationCard.tsx
    │       └── ObservationLog.tsx      # mock estático
    └── lib/api.ts           # fetch wrapper hacia backend
```

## Orden de construcción

- [x] **1. Scaffolding** — carpetas backend/frontend, package.json de cada uno,
      Tailwind config, `.env.example`, levantar contenedor Postgres (comando ya
      dado por ti).
- [x] **2. DB** — `schema.sql` con las 2 tablas, `db.js` (pg Pool), `seed.js`
      con 18 estudiantes x 8 semanas y la distribución 40/25/20/15 pedida
      (7 sanos, 5 asistencia, 4 notas, 2 participación).
      Seed corrido: 2 Alto / 9 Medio / 7 Bajo, calibración verificada.
- [x] **3. Motor de riesgo** — `riskEngine.js`: función pura que compara
      promedio semana 1-2 vs semana 7-8 por estudiante, aplica los 3 umbrales,
      devuelve señales activas (con número exacto y semana) + nivel Alto/Medio/Bajo.
- [x] **4. Rutas backend** — `GET /api/estudiantes` (lista + riesgo por
      estudiante, conteos se derivan en frontend), `GET /api/estudiantes/:id`
      (historial completo + señales), `POST /api/estudiantes/:id/recomendacion`
      (todos los niveles: preventivo breve en Bajo, intervención en Medio/Alto).
- [x] **5. aiClient.js** — adaptar el patrón de TutorPDF (sin upload de
      archivo, solo texto): prompt con señales + números, system prompt con
      las restricciones no negociables (sin variables demográficas, enfoque en
      apoyo no en etiquetar). Fallback en 3 niveles: Gemini → Ollama → plantilla
      local.
- [x] **6. Frontend shell** — layout, Sidebar, TopBar, paleta de colores del
      mockup (crema, teal oscuro, acento naranja, badges por nivel de riesgo).
- [x] **7. Página Resumen** — SummaryCards (3 conteos) + grid de StudentCard
      (badge de riesgo, sparkline, botón "Ver detalle").
- [x] **8. Página Detalle** — ProfileCard, EvolutionChart (recharts),
      SignalsList (con cita "[Semana N]"), AIRecommendationCard (loading state
      + fuente de la recomendación), ObservationLog (mock).
- [x] **9. Integración** — `lib/api.ts` conectando frontend-backend, variable
      `NEXT_PUBLIC_API_URL`.
- [x] **10. Pulido y demo** — estados de carga/error, README con instrucciones
      de arranque (docker + seed + dev servers), fallback de 3 niveles probado
      en vivo (Gemini inválido → Ollama → plantilla local).
