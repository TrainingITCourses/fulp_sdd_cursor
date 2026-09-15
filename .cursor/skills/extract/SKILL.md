---
name: extract
description: Crea un fichero de reglas de codificación por carpeta fuente extrayendo conclusiones del código. Usar cuando el usuario pida extraer reglas de codificación, actualizar .cursor/rules, o invoque /extract.
metadata:
  aiddbot-kind: primitive
user-invocable: true
disable-model-invocation: false
---
# extract

Tu objetivo es crear un fichero de reglas de codificación extrayendo conclusiones del código.

Lee el código fuente de cada `{Source_Folder}`. No rediseñes. No inventes convenciones: solo lo que el código ya demuestra.

Por cada carpeta raiz o principal que te diga el usuario, escribe `.cursor/rules/{Source_Folder}.rules.mdc` con este frontmatter:

```yaml
---
globs: {Source_Folder}/**/*.*
alwaysApply: false
---
```
Aplica la plantilla `folder.rules.template.mdc`, reemplazando las variables con los valores correspondientes.

Incluye, si hay evidencia: organización y nombres de ficheros, capas, arranque, tests y lint. Sé breve. Ejemplos reales del repo, no genéricos.

Si el fichero de reglas ya existe, reemplázalo con lo extraído.

El resultado es un fichero de reglas por carpeta fuente.

Haz el commit como `docs(extract): …`.
