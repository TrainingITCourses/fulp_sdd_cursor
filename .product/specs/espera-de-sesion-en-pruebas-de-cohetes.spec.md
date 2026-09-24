# Espera de sesión en pruebas de cohetes

Las pruebas e2e de alta, edición e inhabilitación de cohetes esperan a que la sesión esté visible antes de abrir el formulario, y así dejan de fallar por llegar a esa pantalla sin sesión.

Hoy `AC-RKT-14`, `AC-RKT-15` y `AC-RKT-16` hacen clic en el login y navegan enseguida a `/rockets/new`. El login responde de forma asíncrona. Si la navegación sale antes, la página carga sin sesión y el cliente vuelve a `/login`. El alta no aparece: falta `Capacity:` o la etiqueta `Name`. `AC-RKT-13` y las pruebas de lanzamientos ya esperan el enlace de menú de la sesión y pasan. Esta entrega solo alinea esas tres pruebas con ese patrón. No cambia el cliente, la API ni la base de datos.

## Historias de usuario

1. Como quien ejecuta la suite e2e, quiero **que el alta, la edición y la inhabilitación de cohetes esperen a que la sesión esté lista**, para que el formulario de alta exista antes de usarlo.

## Fuera de alcance

- Cambiar el cliente, la API o la base de datos.
- Cambiar las pruebas de lanzamientos.
- Cambiar `AC-RKT-13` y `AC-RKT-17`.
- Cambiar el texto de `docs/rockets.md`.

## Plan técnico

### e2e

En `tests/rockets.page.spec.ts`, las pruebas `AC-RKT-14`, `AC-RKT-15` y `AC-RKT-16` comprueban que el registro responde 201. Tras el clic de login, esperan el enlace de menú "Rockets" antes de `form.goto()`. El mismo patrón que `AC-RKT-13` en ese fichero y que `registerAndLogin` en `tests/launches.page.spec.ts`. Sin páginas nuevas ni cambios de selectores del formulario.

## Criterios de aceptación (EARS)

- [ ] 1. CUANDO la prueba de alta de cohete inicia sesión, LA suite DEBERÁ esperar el enlace Rockets antes de abrir el formulario y DEBERÁ ver la capacidad 9 fija y el detalle del cohete creado.
- [ ] 2. CUANDO la prueba de edición de cohete inicia sesión, LA suite DEBERÁ esperar el enlace Rockets antes de abrir el formulario y DEBERÁ mostrar en el detalle el nombre y el alcance guardados.
- [ ] 3. CUANDO la prueba de inhabilitación inicia sesión, LA suite DEBERÁ esperar el enlace Rockets antes de abrir el formulario y DEBERÁ mostrar el cohete inhabilitado sin el botón Disable.
- [ ] 4. SI el registro del usuario de prueba no responde 201, LA suite NO DEBERÁ continuar el alta, la edición ni la inhabilitación.
