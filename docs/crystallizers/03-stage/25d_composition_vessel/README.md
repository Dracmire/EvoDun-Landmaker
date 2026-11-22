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
- En esta carpeta: los insumos y las salidas de cada prueba (hojas y conclusiones), nada más.

| Carpeta | Contenido |
|---|---|
| `refs/` | Figura 1 de XChengCode (esquema del proceso) y mapa Dreamer's Tower 5F (SNES), con procedencia y hash |
| `pp3/` | Salidas de PP3: hojas de la red de profundidad de XChengCode (MiDaS) sobre el 5F SNES y dos fotogramas del piso 2, y `RESULTADO_PP3.md` (lo observado, sin veredicto) |
| `pp2/guias/` | Guías del 5F con el código DAC3: rejilla y clases, plataformas, caminos entre escaleras, manifest y counts, y `RESULTADO_PP2_guias.md` (lo hecho y lo observado, sin veredicto) |
| `pp2/guias/B/` | Variante B de las guías del 5F: cores por anillos, áreas, puertas, conos, plataformas y rutas entre escaleras, con `RESULTADO_PP2_B.md` (lo hecho y lo observado, sin veredicto) |
| `pp2/guias/C/` | Variante C de las guías del 5F: los cores de B agrupados en pasillos X / Y y hubs, con gates y elbows como separadores, y `RESULTADO_PP2_C.md` (lecturas tomadas, sin veredicto) |
| `pp2/guias/D/` | Variante D de las guías del 5F: flow sobre los grupos de C (A* desde la entrada a los destinos, flow de la arquitectura con y sin sombra, y su suma), con `RESULTADO_PP2_D.md` (lecturas tomadas, sin veredicto) |
| `pp2/guias/E/` | Cierre del paso 2 de las guías del 5F: grupos regrupados con las fusiones de [U], gates (corte / puerta / absorbido), sectores, flow de la herradura y camino A*, en un solo objeto, con `RESULTADO_PP2_E.md` (lecturas tomadas y lo que no calzó, sin veredicto) |
| `pp2/alturas/` | Paso 3 de PP2: mapa de muros del 5F (SNES) con su altura, medida contra el héroe de las capturas de SNES y Switch, y `RESULTADO_PP2_alturas.md` (lecturas tomadas y lo que no calzó, sin veredicto) |
| `pp2/profundidad/` | Paso 4 de PP2: oclusión del héroe por pilares y muros (M1, método de [U]) y tomas del mock-up del 5F con la red de profundidad (M2, método de [R]), con `RESULTADO_PP2_profundidad.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/camara_snes/` | Paso 4b de PP2: cámara ortográfica única del SNES (θ = 70° y 60°), oclusión del héroe por pilar y muro, vista de lado y tomas G, H, I contra el mapa real, con `RESULTADO_PP2_camara_snes.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |

## Convención (irán muchas pruebas más)

- Una subcarpeta por prueba (`pp3/`, `pp4/`…) con solo las salidas (hojas, ≤ 2500 px, ≤ 2 MB) y `RESULTADO_PPn.md`
  (≤ 40 líneas; describe lo observado, el veredicto es de [U]). Scripts, entornos y archivos pesados no se guardan aquí.
- Los insumos van en `refs/` con URL o autor, commit, medidas y sha256. No se reemplazan PNG grandes (`.git` pesa ~70 MB).
- Nombres sin espacios ni acentos. Commits `docs(stage): …`, sin líneas de firma (instrucción de [U], 2026-11-22).
- Quien añade una subcarpeta añade su fila a la tabla de arriba.
