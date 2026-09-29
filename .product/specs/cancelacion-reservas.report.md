---
name: cancelacion-reservas
date: 2026-09-29
status: GREEN
---
# Reporte de pruebas e2e

## Resultados

- Rama: `feat/cancelacion-reservas`
- Comando: `cd e2e && bun test:e2e` (Chromium, back y front arrancados por Playwright)
- Total: 96 tests — 94 pasados, 0 fallados, 2 omitidos (32.3s)
- Tests de la spec que pasan:
  - API `Cancel booking API` en `e2e/tests/launches.api.spec.ts` (incluye AC-CBK-05)
  - Páginas `Cancel booking pages` en `e2e/tests/launches.page.spec.ts` (AC-CBK-06, AC-CBK-07, AC-CBK-08)
- Omitidos: 2 tests de `e2e/tests/e2e/content/content.spec.ts`, omitidos a propósito con `test.skip` porque `front/package.json` no declara datos de autor. No tienen que ver con esta spec.

## Errores

Ninguno. Los avisos 4xx del log (400, 404, 409) son respuestas que los tests esperan en los casos de error. Los 404 de estilos en `/rockets/styles/...` son de otra funcionalidad y no hacen fallar ningún test.
