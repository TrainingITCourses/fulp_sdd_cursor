# Vacantes specification coding
_Exported on 9/10/2026 at 20:01:28 GMT+2 from Cursor (3.19.19)_

---

**User**

/codifica  @specs/vacantes.spec.md  y al acabar guarda en git

---

**Cursor**

Voy a leer la spec, el skill de commit y el estado del repo para implementar el script y guardarlo en git.

La spec es breve; revisaré el material del curso y el `.gitignore` para alinear el script.

Implementaré un CLI en Node.js para alta y listado de vacantes, según la spec, y luego haré el commit.

El alta con stdin por pipe falló; voy a depurarlo.

Voy a permitir el alta por argumentos CLI además del modo interactivo, más fiable en Windows.

Funciona. Ahora hago el commit con conventional commits, agrupando por tipo de cambio.

Listo. Script CLI según `specs/vacantes.spec.md` (alta y listado), guardado en git.

**Uso**
```bash
node vacantes.js alta "Título" "Descripción"
node vacantes.js alta          # modo interactivo
node vacantes.js listado
```

Los datos se guardan en `vacantes.json` (ignorado por git).

**Commits**
- `feat: CLI de puestos vacantes con alta y listado`
- `chore: ignorar vacantes.json de datos locales`

Quedan sin trackear: `.cursor/`, `AGENTS.md` y `specs/`. ¿Los incluyo en otro commit?

