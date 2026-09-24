---
name: planificar-lanzamientos
date: 2026-09-24
status: RED
---
# Reporte de pruebas e2e

## Resultados

`bun test:e2e` en `e2e/`: 58 passed, 3 failed, 2 skipped (63 tests, ~51 s).

Los fallos no están en `tests/launches.*`. Esos specs formaron parte de los 58 que pasaron.

## Errores

1. `tests/rockets.page.spec.ts` — AC-RKT-14 creates a rocket and opens its detail with fixed capacity 9  
   `expect(page.getByText("Capacity:")).toBeVisible()` — elemento no encontrado (timeout 5000 ms).

2. `tests/rockets.page.spec.ts` — AC-RKT-15 saves a new name and range on the detail  
   Timeout 30000 ms esperando `getByLabel('Name')` en el formulario de alta.

3. `tests/rockets.page.spec.ts` — AC-RKT-16 disables a rocket and hides the disable button  
   Timeout 30000 ms esperando `getByLabel('Name')` en el formulario de alta.
