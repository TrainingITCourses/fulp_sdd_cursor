# Instrucciones del proyecto

tono: directo, sencillo, claro
dudas: preguntame cualquier duda que tengas. ofrece opciones y haz preguntas de una en una.

## Entorno

- **Git**: https://github.com/TrainingITCourses/fulp_sdd_cursor.git — rama por defecto `main`
- **SO** `Windows` — **Shell** `bash`
- **Tiempo** usar ISO 8601 para marcas de tiempo DateTime
- **Commits**: conventional commits. Juntar ficheros según el tipo de cambio.

## Rutas

- **{Agents_File}** — `AGENTS.md` — este archivo
- **{Agents_Folder}** — `.cursor/` — habilidades, reglas y hooks del agente
- **{Product_Folder}** — `.product/` — especificaciones y arquitectura
- **{Source_Folders}** — `back/`, `front/`, `e2e/` — código fuente

Documentos actuales del producto (hasta que vivan en `.product/`):

- `e2e/docs/health.md` — salud de API y página de inicio
- `e2e/docs/routing.md` — enrutado SPA, historial y 404
- `docs/session 1/specs/vacantes.spec.md` — ejercicio de curso (CLI de vacantes)

## Producto

### Problema

Curso de Spec-Driven Development (Fundación Universidad de Las Palmas, Cursor). El código actual es un scaffold demo: API de salud, SPA con rutas y pruebas e2e de aceptación.

### Solución

Tres proyectos hermanos. Runtime y gestor de paquetes: Bun (>=1.4). TypeScript. Lint: Oxlint en `back` y `front`. El cliente espera la API en el puerto 3000; el front sirve en el 4000.

#### back

API Express 5 de Astro-Bookings. Capas agrupadas por funcionalidad. Ficheros: `funcionalidad.artefacto.extension` (ej. `health.controller.ts`). Endpoint actual: `GET /api/health`. Puerto: `3000`. Datos demo: `DB_PATH=./data/demo.db`.

- **Ruta fuente**: `back/`
- **Reglas específicas**: `.cursor/rules/back.rules.mdc`

#### front

Cliente web estándar de Astro-Bookings: HTML, CSS y TypeScript, sin framework ni paso de build. Servidor Express que sirve `app/` (TypeScript al vuelo). Rutas: `/`, `/about`, `/items/:itemId`, 404. Puerto: `4000`. `API_BASE_URL=http://localhost:3000`.

- **Ruta fuente**: `front/`

#### e2e

Suite Playwright (Chromium). Arranca sola `back` y `front` con `bun start`. Specs: health (API y página) y routing.

- **Ruta fuente**: `e2e/`

### Verificación

Desde cada proyecto: `bun install`. Tests unitarios en `back/` y `front/`: `bun test`. Lint: `bun lint`. Arranque: `bun start` / `bun dev`.

Desde `e2e/`, con las apps hermanas en `../back` y `../front` (puertos 3000 y 4000 por defecto):

```bash
bun test:e2e
```

Informe HTML: `bun test:e2e:report`. Variables si el layout cambia: `BACK_DIRECTORY`, `FRONT_DIRECTORY`, `BACK_PORT`, `PORT`.
