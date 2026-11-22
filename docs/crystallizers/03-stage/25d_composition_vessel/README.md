# 25d composition vessel

Pase de la hoja de composición del cristalizador 3 (Stage). Nombre fijado por [U], 2026-11-22.

## Qué es

La cadena que [U] propone para llevar un mapa 2D plano al HD-2D: mapa de 8 bits plano → mapa de 16 bits con altura
simulada → **Pase 2.5D** (extraer la altura y modelar la profundidad con «cajones de profundidad») → proyección
incompleta o isométrica de ángulo fijo → HD-2D. El «vessel» es un 2D hecho para medirse sobre un mundo 3D, guiado por
áreas y puntos de interés, no tile por tile. El mapa de 16 bits es un greybox con áreas fijas: los detalles pueden
cambiar, las áreas no.

Hipótesis a la que sirve: `../HP1.md` (derivación en `../HP1_DERIVACION.md`).

## Dónde está cada cosa

- Teoría, respuestas de [U], predicciones y estado de las pruebas: docs del Proyecto EvoDun en claude.ai
  (`PASE_2_5D.md`, `PASE_2_5D_anexo_2349.md`, `PRUEBAS_PENDIENTES.md`). No se copian aquí para que no diverjan.
- En esta carpeta: insumos, resultados de CC, scripts y entorno de cada prueba.

| Carpeta | Contenido | Estado |
|---|---|---|
| `refs/` | Figura 1 de XChengCode (esquema del proceso) y mapa Dreamer's Tower 5F (SNES), con procedencia y hash | listos |
| `pp3/` | PP3: red de profundidad de XChengCode sobre el mapa 5F y dos fotogramas del remake | corrida hecha por CC; falta subirla aquí |

## Convención (irán muchas pruebas más)

- Una subcarpeta por prueba (`pp3/`, `pp4/`…): `RESULTADO_PPn.md` (≤ 40 líneas; describe lo observado, el veredicto es
  de [U]), hojas de comparación (≤ 2500 px, ≤ 2 MB), el script y `ENTORNO.md` (versiones, hashes, tiempos, qué falló).
- Los insumos van en `refs/` con URL o autor, commit, medidas y sha256. No se reemplazan PNG grandes (`.git` pesa ~70 MB).
- Lo pesado (pesos, .npy, capas) queda fuera del repo; aquí solo su tamaño y su hash.
- Nombres sin espacios ni acentos. Commits `docs(stage): …`, sin líneas de firma (instrucción de [U], 2026-11-22).
- Quien añade una subcarpeta añade su fila a la tabla de arriba.
