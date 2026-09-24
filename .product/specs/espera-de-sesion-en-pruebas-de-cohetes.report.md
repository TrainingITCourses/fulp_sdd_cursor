---
name: espera-de-sesion-en-pruebas-de-cohetes
date: 2026-09-24
status: GREEN
---
# Reporte de pruebas e2e

## Resultados

`bun test:e2e` en `e2e/`: 53 passed, 2 skipped (55 tests, ~19 s).

`AC-RKT-14`, `AC-RKT-15` y `AC-RKT-16` pasaron. Los dos skipped son pruebas de autor que se omiten porque `package.json` del front no declara email ni url.

## Errores
