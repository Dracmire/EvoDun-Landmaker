# RESULTADO R1.5 · Sala T · Verificación 1 (v322)

Pedido: `stage_r15_salat_base_go.md` con las Enmiendas 1–3. Predicciones: `PREDICCION_R15_SALAT_v322.md` (9d798605…). Preparador: un subagente Sonnet (tercera corrida, `out3`). Jueces: 3 subagentes sin contexto. Mapa `MAPA_salat_v1.json` (c7729f98…), abierto después de los votos. Votos en `VOTOS_salat_v1.json`.

## Medible (preparador)
- **Controles:** pasan en los 68 estados.
- **Hashes:** ×2 iguales.
- **V1.6:** cumple.
- **V1.5 = 2.** Entran C3 (6/9) y C2 (2/3).
- **No entran:**
  - A6, A3a, A3b y A4b, con 0/6 cada uno tras 6 iteraciones;
  - B3 (3/3 PRESENTE): falla solo el aislamiento, porque la caja de medida no coincide con la isla pintada.

## Juez
| Prueba | Resultado | Regla | Estado |
|---|---|---|---|
| V1.2 · TECHO contra SUELO | gana TECHO 9/9 (27 de 27 votos); nota media 3,41 contra 1,74 (+1,67) | ≥ 8/9 y ≥ +1,0 | CUMPLE |
| V1.3 · PLACEBO contra SUELO | el señuelo gana 3/3 en el voto; nota media 2,33 contra 2,33 (+0,00) | ≤ 4 de 9 | cumple por regla, SIN INFORMACIÓN |

Notas sobre V1.3:
- Solo hay 3 posiciones evaluables. El señuelo no se ve desde los grupos m y n, así que esos pares son idénticos y quedan como AUSENTE. Es un error de diseño de [R].
- Cada juez recibió 12 pares seguidos, no tandas de ≤ 9 (declarado).

Predicciones:
- Q1 (V1.2 cumple, 65 %): ACIERTO.
- Q2 (V1.3, 55 %): cumple por regla, sin información.
- Q3 (≥ 5 trucos entran, 60 %): FALLO (entran 2).

## Lectura de [R]
1. **El juez distingue.** Una sala con los trucos le gana a la sala desnuda por unanimidad y con una nota absoluta clara. Es el primer control positivo de R1.5.
2. **El voto de par está sesgado hacia «más cosas».** Con pares casi iguales, el señuelo sin función ganó los 3 pares, pero su nota media es IDÉNTICA a la de SUELO. La elección forzada de 1 o 2 premia la pieza añadida aunque no aporte. Una prueba de quita-uno decidida por el voto de par saldría a favor de TECHO por diseño. La nota absoluta no tiene ese sesgo.
3. **La puerta es más estricta que la percepción.** Los tres jueces nombran la baranda o el pretil (A6), las masas de primer plano (A3a/A3b), los pilares de la escalera (C2) y el emblema (C3) como lo que acerca TECHO a R. A6 y A3b no pasaron su puerta en ninguna posición. Las cifras de pantalla (leídas a ojo con ± 0,02, en otro encuadre) excluyen piezas que el juez sí percibe.

## Consecuencia (propuesta, no aplicada)
Antes de las pruebas hay que decidir dos cosas, que cambian criterios:
- **(a) El juez decide por nota absoluta, con empate permitido.** Un truco aporta si quitarlo baja la nota media ≥ 0,5. El placebo se vuelve a controlar con señuelos visibles en las 9 posiciones.
- **(b) La puerta deja de excluir.** Se juzgan los 7 trucos en sus posiciones declaradas, y la puerta queda como descripción.

La decisión es de [U].
