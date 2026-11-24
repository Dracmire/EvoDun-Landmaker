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
| `pp2/camara_snes/paso4c/` | Paso 4c de PP2: cara contra techo en el SNES real, ángulo por tiles enteros (θ = 71°), tres familias de cámara (Godot, Foundry, 3D_iso_in_2D) y bandas de profundidad sobre recortes reales, con `RESULTADO_PP2_paso4c.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/vessel/` | Paso 5 de PP2: el vessel, mapa expandido del 5F (partes, expansión hacia afuera k = 1, 2, 3 con el overlay de áreas, framing por gates, ensanche de las escaleras y expansión sobre fachada), con `RESULTADO_PP2_vessel_expansion.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/vessel_rv/` | Paso 5b de PP2: rooms que crecen con su eje de framing (reglas RV: muro mínimo w8 / w16, crecimiento por lados enteros simétrico al eje, mini esqueleto, guías de comparación), con `RESULTADO_PP2_vessel_rv.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto); `pp2/vessel/` queda como contraejemplo |
| `pp2/vessel_sdf/` | Paso 5c de PP2: crecimiento por campo de distancia room por room, con islas y pasillos extraídos y recolocados (modos A «por etapas» y B «todo a la vez»), silueta de la torre y zona gris muerta, con `RESULTADO_PP2_vessel_sdf.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/vessel_perfiles/` | Paso 5d de PP2: crecimiento con tope del 38 %, por franjas de ≥ 4 celdas, con espejo, por zonas y por pases (exterior, interior, deuda), desplazamiento y puentes recolocados, en dos perfiles (3 zonas y 2 zonas), con `RESULTADO_PP2_vessel_perfiles.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/vessel_techos/` | Paso 5e de PP2: tres elementos (muro = solo techos, piso con las caras extraídas, wrapping), empuje de bordes rectos con muro mínimo de 2 celdas, límite externo en escalera, tope ×1,38, puentes fuera y de vuelta, con `RESULTADO_PP2_vessel_techos.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/vessel_zonas/` | Paso 5f de PP2: SDF de caja por zona con tope ×1,38 propio, el techo como muro y las caras absorbidas por la sala de delante, un solo muro mínimo en la línea media entre salas y muro externo empujado, en dos perfiles (3 y 2 zonas), con `RESULTADO_PP2_vessel_zonas.md` (lecturas tomadas, contraste con la predicción de [R], sin veredicto) |
| `pp2/vessel_versiones/` | Paso 5g de PP2: 2 perfiles (3 y 2 zonas) × 3 versiones del vessel (V1 caras eliminadas, V2a/V2b SDF con expansión externa e interna y muros sumados o empujados, V3 muros mínimos en los pies fusionados) con borde externo cuadriculado de 5f, con `RESULTADO_PP2_vessel_versiones.md` (lecturas, lo que no coincidió), `V3_limites.png`, `comparacion.png` y `vessel_versiones.json`. |
| `pp2/vessel_limites/` | Paso 5h de PP2: la expansión del vessel dentro del canvas de límites v7 (reproducido, con las diagonales sustituidas por L rectas), 2 perfiles (3 y 2 zonas, tope ×1,38) × 2 tipos de borde (R recto, C curvo), con `RESULTADO_PP2_vessel_limites.md`, los dos canvas, `comparacion.png` y `vessel_limites.json`. |
| `pp2/vessel_altura/` | Paso 6 de PP2 (Vessel paso 2): la franja X4–X5–X6 sube un nivel y el hoyo del 5h se vuelve banda de altura con escaleras en los gates, en dos versiones (V1 solo el hoyo, V2 hoyo + columna central entre h19 y h20) y tres profundidades de banda (4, 5, 6 celdas), con plantas, vistas de 71°, `comparacion.png`, `vessel_altura.json` y `RESULTADO_PP2_vessel_altura.md`. |
| `pp2/vessel_altura_b/` | Paso 6b de PP2: se termina el ala derecha (la segunda mitad de X6 crece hacia el rincón del g11, con una escalera nueva X6 ↔ g11 y Y13 en el espejo de Y12) y se fija la altura del nivel 1 (1,45 H y 1,25 H, con baranda norte de 0,5 H), con `planta.png`, `vista.png`, `detalle_ala_derecha.png`, `vessel_altura_b.json` y `RESULTADO_PP2_vessel_altura_b.md`. |
| `pp2/vessel_altura_c/` | Paso 6c de PP2: hub 25 (la salida) sube al nivel 1 y se traslada 4 celdas al norte, con su banda, y X9 pasa a ser una escalera lateral de 7 × 3 que baja de oeste a este hasta hub 24; altura del nivel 1 en 6 + 1 celdas, con `planta.png`, `vista.png`, `detalle_salida.png`, `vessel_altura_c.json` y `RESULTADO_PP2_vessel_altura_c.md`. |
| `pp2/vessel_profundidad/` | Paso 7b de PP2: pase de profundidad (MiDaS de PP3 + K-means N = 4) sobre el vessel final en 3D, cámara desde el sur: 4 tomas nuevas a 71° en el circuito de la herradura más la global (`a71/`), y las 18 hojas de la muestra del paso 7 guardadas por pitch y grupo (`a55/`, `a45/`, `a35/`, `a25/`, `snes/`), con `mapa_tomas.png`, `vessel_profundidad.json` y `RESULTADO_PP2_vessel_profundidad.md`. |
| `pp2/vessel_export/` | Paso 8 de PP2 (pase 1 de la exportación de profundidad del 3D al 2D): base de solo muros y piso blanco, las 5 tomas a 71° retroproyectadas al plano z = 0 y superpuestas, y lo que sobra sobre los muros (altura del 3D que el 2D no representa), con `base_muros_piso.png`, `pase1_*.png`, `pase1_superpuesto.png`, `pase1_sobrante_por_muro.png`, `vessel_export.json` y `RESULTADO_PP2_vessel_export.md`. |
| `pp2/vessel_export_b/` | Paso 8b de PP2 (pase 1 corregido de la exportación de profundidad): lo que sobra se cuenta solo fuera de la huella de cada objeto (bloque alto X4–X5–X6 + hub 25 como un muro gigante, rampas Y12/Y13 aparte, muros comunes), con cuatro capas (rojo sobra, naranja cara sur, amarillo techo corrido, azul rampas), la cara sur medida contra la banda D = 5 del SNES, `pase1b_*.png`, `vessel_export_b.json` y `RESULTADO_PP2_vessel_export_b.md`. |
| `pp2/vessel_export_c/` | Paso 8c de PP2 (pase 1 rehecho): alturas en tiles (héroe 8, muro 14 / 28, nivel 1 = 14, baranda 4, rampas Y12/Y13 de 0 a 14), base de muros + piso blanco (franja X4–X6 y hub 25 como muro gigante, Y12/Y13 restadas), el rojo sale de las bandas de profundidad retroproyectadas (regla literal + variante por zona + sensibilidad al umbral de gris), los ids solo etiquetan el origen, `pase1c_*.png`, `vessel_export_c.json` y `RESULTADO_PP2_vessel_export_c.md`. |

## Convención (irán muchas pruebas más)

- Una subcarpeta por prueba (`pp3/`, `pp4/`…) con solo las salidas (hojas, ≤ 2500 px, ≤ 2 MB) y `RESULTADO_PPn.md`
  (≤ 40 líneas; describe lo observado, el veredicto es de [U]). Scripts, entornos y archivos pesados no se guardan aquí.
- Los insumos van en `refs/` con URL o autor, commit, medidas y sha256. No se reemplazan PNG grandes (`.git` pesa ~70 MB).
- Nombres sin espacios ni acentos. Commits `docs(stage): …`, sin líneas de firma (instrucción de [U], 2026-11-22).
- Quien añade una subcarpeta añade su fila a la tabla de arriba.
