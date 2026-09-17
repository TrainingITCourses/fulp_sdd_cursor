---
name: codificar
description: Implementa la funcionalidad de una spec. Recibe la spec, crea la rama feat/spec-slug, codifica proyecto a proyecto, lint y formato, commit por proyecto, tests unitarios en back y front, crea e2e sin ejecutarlos, y mergea con la rama default. Usar cuando el usuario pida implementar una spec, codificar una funcionalidad especificada, o invoque /codificar.
user-invocable: true
disable-model-invocation: false
---
# codificar

Tu objetivo es implementar la funcionalidad de una spec.

Debe recibir la spec. crear un rama `feat/spec-slug` y codificar en ella. Ir proyecto a proyecto. Para cada uno asegurar un lint básico y un formato legible. Comitear cada proyecto. Al acabar mergear con la rama default. No ejecutes pruebas e2e., solo crearlas. haz test unitario de los proyectos de produccion.

## Entrada

Si el usuario no adjunta la spec, léela de `{Product_Folder}/specs/`. El slug es el nombre del fichero sin extensión (`registro-usuario.soec.md` → `registro-usuario`).

Lee la spec completa (historias, fuera de alcance, plan técnico, criterios). No implementes lo que esté fuera de alcance. Si falta la spec o el plan técnico es ambiguo, pregunta una duda cada vez.

## Rama

Desde la rama default (`AGENTS.md`): crea y cambia a `feat/{spec-slug}`. Todo el trabajo ocurre en esa rama.

## Orden

Sigue el plan técnico de la spec, proyecto a proyecto, en el orden que indique (habitualmente `back/` → `front/` → `e2e/`). Omite un `{Source_Folder}` si la spec no lo toca.

Antes de tocar un proyecto, lee `.cursor/rules/{Source_Folder}.rules.mdc` y aplícalo. No rediseñes capas ni nombres.

## Por proyecto

1. Implementa solo lo de esa carpeta.
2. Proyectos de producción (`back/`, `front/`): tests unitarios colocalizados (`*.test.ts`). Ejecuta `bun test` en esa carpeta. Corrige fallos antes de seguir.
3. `e2e/`: crea specs y docs de aceptación. **No ejecutes** `bun test:e2e` ni `playwright test`.
4. Lint básico y formato legible en esa carpeta: `bun run lint:fix` y `bun run format` si existen; en `e2e/` usa `bun lint` y `bun format`.
5. Commit **solo** los ficheros de ese proyecto. Conventional commits, scope del proyecto: `feat(back): …`, `feat(front): …`, `test(e2e): …`.

No mezcles proyectos en un mismo commit. No hagas push.

## Cierre

Cuando todos los proyectos de la spec estén commiteados: mergea `feat/{spec-slug}` en la rama default y deja el working tree en la default.

Si el merge falla, no fuerces: informa y espera.
