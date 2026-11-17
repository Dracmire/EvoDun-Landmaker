# RESULTADO R1.5 · Pasada única de trucos (v322)

Predicción congelada: `PREDICCION_R15_PASADA_v321.md` (sha256 3a7c58e0…). Pedido: `stage_r15_pasada_go.md` (77495627…). Medidas y presencia: entrega de CC (`presencia.txt`, `pasada_medidas.txt`, `SHA256SUMS`), fuera del repo.
Base: `dac_stage`, salas 3, 8 y 14; terraces 3, subs 1, salto 1,25 H; Cam 6, heroFrac 0,10.

## 1. Presencia (CC, puerta de cada ficha)

| Truco | Posiciones PRESENTES de 9 | Estado | Motivo principal (CC) |
|---|---|---|---|
| A6 línea media con encuadre | 0 | no evaluable → NUNCA PROBADO | el borde BACK de las salas es corto: recorrido 0,06–0,45 del ancho, la puerta pide ≥ 0,60 |
| A3a columna suelta de borde | 0 | no evaluable → NUNCA PROBADO | las columnas SIDE de `planes` ocupan el borde: no hay separación |
| A3b masa de esquina baja | 4 | no evaluable → NUNCA PROBADO | presente en k0/k4 de salas 3 y 8; falta en el resto |
| C3 calcomanía | 3 | no evaluable → NUNCA PROBADO | caja fuera de 3–8 % o banda fuera de B2–B3 |
| A4 vano focal del fondo | 4 | no evaluable → NUNCA PROBADO | presente en k0/k4 de salas 3 y 8; en k8 el panel cae a y 0,25–0,53 (puerta: 0,05–0,25) |
| C2 escalera hacia el flujo (+ B1) | 0 | no evaluable → NUNCA PROBADO | solo la sala 8 tiene transición; B1: ancho 0,076 (steps llega a 3 columnas, la ficha pide 0,15–0,25) |
| B3 isla | 0 | no evaluable → NUNCA PROBADO | no hay islas del tamaño pedido |
| N1 | 0 | no evaluable → NUNCA PROBADO | sin escalera ni transición en cuadro |

P1 (A6) y P2 (A3a): no se juzgan (0 presentes). TODO por sala = BASE + los trucos presentes en alguna posición de esa sala: sala 3 {A3b, C3, A4}, sala 8 {A3b, A4}, sala 14 {C3}. CC los dibujó en las tres posiciones aunque en algunas su puerta falle (sala 3 k8: los tres AUSENTES; sala 8 k8: A3b y A4 AUSENTES; sala 14 k0/k8: C3 AUSENTE). Ningún par idéntico.

## 2. P3 · TODO contra BASE (referencia 0137)

3 jueces sin contexto, texto exacto de P1, mapa `MAPA_pasada.json` sha256 4a96a4de… abierto tras los votos (semilla 20261117).

| Prueba | Sala | k | Votos por TODO | Resultado |
|---|---|---|---|---|
| t8c05 | 3 | k0 | 3/3 | TODO |
| t290e | 3 | k4 | 3/3 | TODO |
| t9c39 | 3 | k8 | 3/3 | TODO |
| t7d0c | 8 | k0 | 3/3 | TODO |
| t2430 | 8 | k4 | 3/3 | TODO |
| t3062 | 8 | k8 | 1/3 | BASE |
| t40a4 | 14 | k0 | 3/3 | TODO |
| tf6cd | 14 | k4 | 3/3 | TODO |
| taf28 | 14 | k8 | 3/3 | TODO |

**TODO gana 8 de 9 → P3 CUMPLE** (firma de [R] 55 %).

## 3. Lectura (lo que dicen las razones, no los votos)
- Los tres jueces deciden cada par por UNA pieza: el panel blanco arriba al centro (A4), que leen como «la puerta luminosa de R», y la mancha oscura del suelo (C3), que leen como «el emblema de R». Ninguno menciona A3b.
- Los tres escriben que ninguna maqueta se parece mucho a R y que casi todos los pares son «casi empate». Lo que falta, según ellos: la baranda que cruza toda la imagen (A6), el borde tapado por columnas y estatua en lugar de pilares sueltos (A3a/A3b), y una sala cerrada en lugar de terreno lejano.
- La única derrota (sala 8, k8): el panel A4 queda a media pantalla (y 0,533) y tapa la franja media; los tres lo señalan. La puerta de A4 ya lo marcaba AUSENTE ahí, pero TODO lo dibujó igual. Corrección para la próxima pasada: TODO debe quitar, en cada posición, los trucos cuya puerta falla en ESA posición.
- Conclusión limitada: la combinación no estorba y A4 + C3 empujan en la dirección de R, pero P3 se gana por dos fichas «de objeto» que imitan piezas de la referencia, no por la estructura del cuadro. Que P3 cumpla NO valida A6, A3a, C2, B3 ni N1, que no llegaron a los jueces.

## 4. Hallazgo estructural
Las salas que genera DAC no traen las precondiciones de la mayoría de las fichas: borde BACK largo y recto (A6), borde libre sin columnas SIDE (A3a), escaleras y transiciones en cuadro (C2, B1, N1), islas (B3). Coincide con A229: los trucos dependen de contenido de sala que el generador no produce. Las fichas no fallaron; no se pudieron presentar.

## 5. Límites
3 salas de un generador; jueces del mismo modelo; referencia de otro juego; TODO incluye trucos con la puerta fallida en algunas posiciones; las razones de los jueces son lectura de [R], no medida.
