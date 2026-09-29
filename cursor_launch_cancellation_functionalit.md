# Launch cancellation functionality
_Exported on 9/29/2026 at 18:16:30 GMT+2 from Cursor (3.22.12)_

---

**User**

especifica la funcionalidad de cancelar un lanzamiento asignando una causa. La causa lleva tipo: Económico, Meteorológico o Técnico y un texto. Necesitmaso resgistro de ese cambio con hora y usuario que lo generó.

---

**Cursor**

Voy a seguir el flujo de especificar y leer la habilidad antes de redactar la spec de cancelar un lanzamiento.

La funcionalidad es **cancelar un lanzamiento** con una causa (tipo económico, meteorológico o técnico, más un texto) y dejar constancia de la hora y del usuario que lo hizo.

Para acotar esta entrega: ¿desde qué estados se puede cancelar?

1. Solo si está **planificado**.
2. Si está **planificado** o **confirmado**.
3. Cualquiera que no esté ya **cancelado** ni **exitoso**.

---

**User**

3

---

**Cursor**

Cualquier lanzamiento se puede cancelar salvo que ya esté cancelado o marcado como exitoso.

¿Quién puede hacer esa cancelación?

1. Cualquier usuario con sesión.
2. Solo quien planificó ese lanzamiento.
3. Otro rol. Dime cuál.

---

**User**

1

---

**Cursor**

Cualquier usuario con sesión puede cancelar un lanzamiento que no esté cancelado ni marcado como exitoso, indicando el tipo de causa y un texto. El cambio queda con hora y usuario.

¿Esta entrega también permite ver ese registro?

1. Sí, en el detalle del lanzamiento.
2. Sí, en el detalle y en el listado.
3. No. Solo se guarda; consultarlo queda fuera.

---

**User**

1

---

**Cursor**

El registro se ve en el detalle. Reviso cómo están los lanzamientos ahora para preguntar el siguiente hueco con opciones reales.

El registro de la cancelación se muestra en el detalle del lanzamiento.

¿Se puede deshacer o corregir después?

1. No. Cancelar es definitivo y la causa no se edita.
2. Se puede corregir la causa, pero no reabrir el lanzamiento.
3. Se puede reabrir el lanzamiento y corregir la causa.

---

**User**

1 
no preguntes más y tira con tu mejor opción

---

**Cursor**

Cancelar queda definitivo y la causa no se edita. Completo la spec con las decisiones que ya diste y el patrón actual de lanzamientos.

La cancelación queda en el propio lanzamiento, con la misma sesión y las mismas rutas de detalle que ya existen. Redacto la spec con eso.

Spec escrita en `.product/specs/cancelar-lanzamiento.spec.md`.

Un usuario con sesión cancela un lanzamiento planificado o confirmado con una causa (económica, meteorológica o técnica, más un texto). El detalle muestra esa causa, la hora y el usuario. Cancelar es definitivo.

Decisiones que cerré yo:

- El registro vive en el propio lanzamiento: un solo cambio, no un historial.
- La hora la pone el servidor y el usuario sale de la sesión.
- El alta es `POST /api/launches/:launchId/cancel`.
- El formulario está en el detalle. El listado solo muestra el estado cancelado.
- Un lanzamiento exitoso o ya cancelado responde 409.

---

**User**

impleméntalo

---

**Cursor**

Voy a seguir la habilidad de implementar y leer cómo encaja con la spec de cancelar un lanzamiento.

La spec entra en la rama de trabajo y empiezo por el API: cancelar, guardar la causa y devolverla en el detalle.

La rama `feat/cancelar-lanzamiento` ya está lista. Sigo con el API y sus tests.

El API ya cancela y guarda la causa. Sigo con el detalle en el cliente.

Las tres capas están commiteadas. Lanzo la suite e2e para verificar la spec.

Cancelar un lanzamiento ya está en `main`.

Un usuario con sesión cancela un lanzamiento planificado o confirmado desde su detalle, con tipo de causa (económico, meteorológico o técnico) y un texto. El lanzamiento queda cancelado y el detalle muestra la causa, la hora y el nombre de quien lo hizo. Un lanzamiento exitoso o ya cancelado no se puede volver a cancelar.

La suite e2e terminó en verde: 71 pruebas pasaron y 2 quedaron omitidas. El informe está en `.product/specs/cancelar-lanzamiento.report.md`.

