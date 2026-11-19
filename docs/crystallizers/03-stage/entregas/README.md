# Método de entregas (indicador externo, decisión de [U] 2026-11-19)

Problema: [R] supervisaba solo con su propia alarma y su propio Registro, y aun así cayó en un bucle e ignoró salidas de CC. Hace falta un indicador **que lleve otro, no [R]**, y que [U] pueda verificar contando filas.

## 1. Ficha de entrega (la escribe CC, una por PR)

Archivo `docs/crystallizers/03-stage/entregas/PR-<n>.md`, con cuatro tablas fijas y nada más:

**a) Pedido → resultado.** Una fila por cada punto del brief: `hecho` / `no hecho` (motivo) / `cambiado` (qué).

**b) Salidas.** Una fila por cada archivo producido (imagen, JSON, documento), con la ruta y una de estas marcas:
- `nuevo` (no existía);
- `igual a PR-<m>` (mismo contenido que antes; CC lo compara por hash o por diferencia de píxeles);
- `cambia respecto a PR-<m>`.

**c) Ejemplos tocados.** Una fila por ejemplo (`perfil_u1`, `dac_stage`…) con el número de PR seguidos que lo tocaron. **Si un ejemplo llega a 3 PR seguidos, CC escribe `BUCLE` en la fila.** La línea de trabajo se detiene ahí y no hay brief nuevo sobre ese ejemplo sin el visto bueno de [U].

**d) Preguntas abiertas.** Lo que CC no pudo decidir, los avisos y las desviaciones del brief.

## 2. Recibo (lo escribe [R] al principio de su respuesta a [U])

`Recibo PR-<n>: a X/X · b Y/Y · c Z/Z · d W/W`, más la lista de las filas que [R] no leyó.
- Si alguna fila queda sin leer, [R] no saca conclusiones de ese PR.
- [U] verifica contando: las filas del recibo tienen que coincidir con las de la ficha.

## 3. Brief

- **Un brief, una pregunta.** Las correcciones de un PR anterior van en un brief propio, corto, o no van.
- Antes de enviarlo, [R] comprueba que cada regla se puede construir con baldosas y con el código que existe, y lo dice en una línea: `Construible: sí / no (por qué)`.
- El brief nombra el PR anterior que toca, y la ficha tiene que compararse contra él.

## 4. Costo

La ficha son cuatro tablas cortas. El recibo es una línea. [R] lee la ficha completa y abre solo las salidas marcadas `nuevo` o `cambia`; las marcadas `igual` no se reabren.
