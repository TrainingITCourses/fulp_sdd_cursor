**Instrucciones:**
tono: directo, sencillo, claro
dudas: preguntame cualquier duda que tengas. ofrece opciones y haz preguntas de una en una.

**Git:**
conventional commits. Rama principal: `main`. Juntar ficheros según el tipo de cambio.

# Problema:

Curso de Spec-Driven Development (Fundación Universidad de Las Palmas, Cursor). El código actual es un scaffold demo: API de salud, SPA con rutas y pruebas e2e de aceptación.

# Solución:

Tres proyectos hermanos (`back`, `front`, `e2e`). Runtime y gestor de paquetes: Bun (>=1.4). TypeScript. Lint: Oxlint en back y front. El cliente espera la API en el puerto 3000; el front sirve en el 4000.

## back:

API Express 5. Capas agrupadas por funcionalidad. Ficheros: `funcionalidad.artefacto.extension` (ej. `health.controller.ts`). Endpoint actual: `GET /api/health`. Arranque: `bun start` / `bun dev` (watch). Tests: `bun test`. Lint: `bun lint`.

## front:

Cliente web estándar: HTML, CSS y TypeScript, sin framework ni paso de build. Servidor Express que sirve `app/` (TypeScript al vuelo). Rutas: `/`, `/about`, `/items/:itemId`, 404. Arranque: `bun start` / `bun dev`. Tests: `bun test`. Lint: `bun lint`.

## e2e:

Suite Playwright (Chromium). Arranca sola `back` y `front` con `bun start`. Specs: health (API y página) y routing. Lint: `tsc --noEmit`.

# Verificación:

Desde `e2e/`, con las apps hermanas en `../back` y `../front` (puertos 3000 y 4000 por defecto):

```bash
bun test:e2e
```

Informe HTML: `bun test:e2e:report`. Tests unitarios: `bun test` en `back/` y `front/`.
