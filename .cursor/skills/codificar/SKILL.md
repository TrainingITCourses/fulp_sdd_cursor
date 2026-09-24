---
name: codificar
description: Implementa la funcionalidad de una spec en un proyecto concreto.  Usar cuando necesites programar la cpa física de un feature especificado.
user-invocable: true
disable-model-invocation: false
---
# codificar

Tu objetivo es implementar la funcionalidad de una spec en una capa física (back, o front o e2e)

Debe recibir la spec y la rama. 
Crear o reutilizar un rama `feat/spec-slug` y codificar en ella. 
Ir al proyecto especificado y codificar. 
Asegurar un lint básico y un formato legible. 
Comitear al terminar. 
Para proyectos de producción (back o front) desarrollar tests unitarios y probarlos.

## Entrada

Si el usuario no adjunta la spec, léela de `{Product_Folder}/specs/`. El slug es el nombre del fichero sin extensión (`registro-usuario.soec.md` → `registro-usuario`).

Si el usuario no propone un proyecto, ir por defecto a back. Si ya está ir a front o e2e.

Lee la spec completa (historias, fuera de alcance, plan técnico, criterios). No implementes lo que esté fuera de alcance. Si falta la spec o el plan técnico es ambiguo, pregunta una duda cada vez.

## Rama

Desde la rama default (`AGENTS.md`): crea o cambia a `feat/{spec-slug}`. Todo el trabajo ocurre en esa rama.

## Orden

Sigue el plan técnico de la spec, o deesarrolla uno sobre la marcha si es necesario.

Antes de tocar el proyecto especificado, lee sus reglas de estilo y arquitectura en `.cursor/rules/{Source_Folder}.rules.mdc` y aplícalo. No rediseñes capas ni nombres.

No ejecutes servicios. No pruebes como humano

## Cierre

En caso de haber arrancado un progrtama, cierra el programa.

Si el test falla, no fuerces: informa y espera.
Asegúrate de hacer commit de los cambios realizados.

