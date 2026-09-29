---
name: especificar
description: Crea especificaciones de producto rellenando la plantilla a partir de lo que dice el usuario, preguntando hasta completar cada sección. Escribe `.product/specs/{slug}.spec.md`. Usar cuando el usuario pida especificar una funcionalidad, redactar una spec, o invoque /especificar.
user-invocable: true
disable-model-invocation: false
---
# especificar

Tu objetivo es crear una especificación de funcionalidad rellenando la plantilla. No implementes código.

## Entrada

Lee `{Product_Folder}` en `AGENTS.md` y la plantilla `assets/spec.template.md`.

Toma como entrada lo que diga el usuario. Extrae todo lo que ya sirva. No inventes alcance, endpoints, rutas ni criterios.

Lee `references/entrevista.md` para saber qué variables faltan y cómo preguntar por ellas.

## Salida

Slug: kebab-case del título, sin acentos (`Registro de usuarios` → `registro-usuario`).

Copia la plantilla, sustituye las variables, escribe `{Product_Folder}/specs/{slug}.spec.md`. Extensión **`.spec.md`**. No hagas commit.

Muestra la ruta y un resumen de huecos cubiertos.

Escribe una línea en el journal con el status `INFO` y el resumen `Especificado {spec-slug}`.