---
name: explore
description: Explora el repositorio (back, front, e2e, reglas y scripts) y escribe AGENTS.md en la raíz. Usar cuando el usuario pida explorar la solución, generar o actualizar AGENTS.md, o documentar el contexto para agentes.
---

# Explore

Explora la solución y escribe `AGENTS.md` en la raíz del repositorio. No pidas confirmación para escribir el fichero.

Tono del fichero y de la exploración: directo, sencillo, claro. Español, igual que el `AGENTS.md` actual.

## Fuentes (en este orden)

1. `AGENTS.md` existente (conservar instrucciones y git si siguen vigentes).
2. `README.md` de la raíz y de `back/`, `front/`, `e2e/`.
3. `package.json` de cada proyecto: descripción y scripts (`dev`, `start`, `test`, `test:e2e`, lint).
4. `.cursor/rules/` y `AGENTS.md` de subproyectos si existen.
5. Estructura de carpetas: APIs, páginas/rutas, pruebas e2e.

No leas `node_modules`, locks salvo para runtime (`bun`, `npm`), ni binarios.

## Qué extraer

- **Problema:** dominio y objetivo del producto (quién, para qué).
- **Solución:** cada proyecto (ruta, rol, stack real: runtime, framework o su ausencia).
- **Convenciones:** git, nombres de ficheros, capas, tono, cómo preguntar dudas.
- **Verificación:** comando canónico de aceptación (e2e) y, si aplica, tests unitarios por proyecto.

Si algo no está en el código, no lo inventes. Omite la sección o deja una frase mínima.

## Plantilla de `AGENTS.md`

Usa esta la plantilla de `AGENTS.template.md` como base. Adapta el contenido a lo encontrado. Conserva texto del usuario si ya está en el fichero y sigue siendo cierto.

Interpreta lo que va entre {} como una variable o placeholder y reemplázala con el valor correspondiente.

Añade subsecciones `##` solo por proyecto o aspecto que exista (`back`, `front`, `e2e`, …).

## Flujo

1. Localiza la raíz del git (donde debe quedar `AGENTS.md`).
2. Lee las fuentes.
3. Resume internamente problema, proyectos, verificación.
4. Escribe o sobrescribe `AGENTS.md` con la plantilla rellena.
5. Responde al usuario en corto: qué exploraste y qué cambió en `AGENTS.md`.
