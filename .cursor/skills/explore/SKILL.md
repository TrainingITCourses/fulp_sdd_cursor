---
name: explore
description: Genera las instrucciones raíz del proyecto y un modelo conceptual a partir de la evidencia del repositorio.
metadata:
  aiddbot-kind: primitive
user-invocable: true
disable-model-invocation: false
---
# explore

Tu objetivo es establecer la primera documentación del proyecto a partir de la evidencia del repositorio.

Lee el árbol de archivos, los archivos de guía y los manifiestos. No rediseñes ni leas el código fuente. 
Acuerda `{Product_Folder}` y `{Source_Folders}` con el usuario. 

Reemplaza la semilla inicial en `AGENTS.md` con la plantilla AGENTS.template.md, preservando la dirección acordada. 

No crees ningún archivo que no esté basado en una plantilla.

El resultado son las instrucciones raíz del proyecto y los documentos actuales del producto.

Haz el commit como `docs(explore): …`.