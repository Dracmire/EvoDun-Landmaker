# Transformadores de HT1 (camino M6)

[R], 2026-11-20 (A611–A612). Sigue a `MARCO.md` §6 con la corrección de [U]: **una transformación se detecta por
qué cambia y se demuestra replicándolo**. Comparar baldosa por baldosa solo da la relación entre el mapa viejo y el
remake, no la transformación. Ejemplo de [U]: en la Torre del Soñador el transformador fue el cambio de altura de
algunas salas enteras (MODELO F-D, A1 + A2: la vecina sube o baja ±Δ ≤ 4 H para abrir un vistazo).

## 1. La unidad no es la baldosa

Un transformador actúa sobre una **estructura** del mapa plano: una zona entera, una banda transversal al eje, un
borde entre zonas, el eje camino → meta. Su forma es:

`disparador (estructura + su relación con la entrada, el camino, la meta o la cámara) → cambio (desplazamiento de
altura de toda la unidad, cierre en un borde, escalonado)`

La **lectura del mapa** (firma de color → clase, piezas conectadas → zonas) **no es transformación**: es entrada. En
los tres scripts es propia de cada mapa (umbrales de color, sectores) y en EvoDun la da el generador, que ya conoce sus
clases. El operador empieza en la capa de clases, zonas, camino y meta.

## 2. Qué cambió en cada mapa (la evidencia)

Los mapas viejos son planos: toda la altura de los packs es transformación agregada.

| Mapa | Zonas del mapa plano | Altura que se agregó (pack) | De dónde salió la altura |
|---|---|---|---|
| Trono (`map1.txt`) | nave (alfombra + piso lateral), pilares, muros | Alfombra en bandas a → f que suben hacia el trono; banda del fondo a 5; piso lateral a 0; muros arriba (52) | El par del remake, leído a mano |
| Aurhea | 5 sectores de tierra, agua, sendero, península (meta) | Agua 20 < tierra 30 < península 60 | Hipótesis [R], calibrada en M4 con la foto |
| Bosque (B′) | valle (sendero), ladera, mesetas NO / N / SO, torre | Valle 20 < ladera 33 < mesetas 45 < SO 57 < torre 68 (máximo) | v53 a ojo sobre el remake (no verificado); B′ amplificado |
| Torre del Soñador (sin script) | salas | Una sala vecina se desplaza ±Δ para abrir un vistazo | Medido en el remake (F-D) |

**Ojo:** la «verdad» de los packs es en parte hipótesis nuestra (Aurhea, bosque A). El juez final es el remake (la foto
o el par), y el pack hecho a mano es solo referencia secundaria.

## 3. Transformadores candidatos

| Id | Disparador | Cambio | Trono | Aurhea | Bosque | Torre |
|---|---|---|---|---|---|---|
| T-A Ascenso por el eje | Bandas transversales al eje camino → meta | Suben de forma monótona hacia la meta | sí (a → f) | sí (tierra → península) | no: la meta (POI A) está en la ladera este, no arriba | — |
| T-B Desplazamiento de unidad | Zona o sala vecina que se ve desde la del héroe | Toda la unidad sube o baja un salto | parcial (banda del fondo a 5) | sí (península, un salto entero) | sí (cada zona a una terraza de su vecina) | sí (±Δ) |
| T-C Hundimiento del agua | Clase agua | Queda por debajo de toda la tierra | — | sí | — | — |
| T-D Cierre del borde | Borde de lo caminable o del mapa | Sube a la altura máxima (muro, parapeto) | sí (muros a 52) | no (orilla de roca a 30) | parcial (banda oscura de la ladera) | sí (baranda, BACK) |
| T-E Hito máximo | Hito sólido (torre, trono) | Es el punto más alto de su zona o del mapa | sí (trono en la banda alta) | sí (punta de la península) | sí (torre a 68) | — |
| T-F Cuenca | Zona del sendero contra zonas sin sendero | El sendero queda abajo; lo que se aleja sube | no (el piso lateral queda a 0) | no (tierra pareja) | sí (valle abajo, mesetas arriba) | — |

T-A y T-F se contradicen entre mapas: el trono sube por el eje y el bosque sube alejándose del sendero. La prueba
decide si son dos transformadores para dos tipos de lugar (interior frente a exterior) o si uno de los dos sobra.

## 4. Orden de aplicación propuesto

Clases y zonas (entrada) → T-C (el agua se hunde) → T-B y T-A o T-F (el tipo de lugar decide) → T-E (el hito queda
máximo) → T-D (cierre del borde). Las alturas son **relativas, en saltos**: el transformador dice «un salto más arriba
que su vecina», no un número de gris.

## 5. Cómo se prueba (replicar, no comparar baldosas)

Dejar un mapa fuera:
1. se eligen los transformadores con dos mapas (más la Torre y los pares);
2. se aplican al **mapa plano** del tercero (sus clases, zonas, camino y meta, sin ninguna altura);
3. se comparan **los cambios, no los valores**:
   - ¿qué unidades se desplazaron, y en qué sentido, respecto de su vecina?
   - ¿las bandas suben hacia la meta?
   - ¿qué bordes se cerraron?
   - ¿el hito quedó arriba?

   La referencia es el remake (el par o la foto), y el pack hecho a mano va de apoyo.
4. Rotar: cada mapa queda fuera una vez.

**Descarte (fijado antes):** HT1 se queda en lv2 si en el mapa que quedó fuera los transformadores disparan donde el
remake no cambió nada, o no disparan donde sí cambió, en la mayoría de las unidades (zonas, bandas y bordes) de ese
mapa. Con pocas unidades por mapa (trono 3 zonas y 6 bandas, Aurhea 5 sectores, bosque 6 zonas), la cuenta va unidad
por unidad, escrita en una tabla.

## 6. Por qué esto tiene ganancia

- Es la herramienta de M6: sin reglas por mapa, de un trazado plano sale el relieve.
- EvoDun entrega clases, zonas, camino y meta: el operador corre sobre su salida.
- Potencial lv5 (lectura de [U]): si funciona, el lugar sale de la misión y del trazado, y alimenta la toma.

## 7. Contradicciones = señal de tipos (nota de [U], A613)

Si dos transformadores se contradicen entre mapas (T-A ascenso en el trono contra T-F cuenca en el bosque), no se
elige uno a la fuerza: puede ser la señal de **varios tipos de lugar o de sala**. La prueba registra qué atributo del
mapa plano separa a los mapas donde gana cada uno (interior / exterior, recinto cerrado / abierto, agua, posición de
la meta respecto de lo más alto) y lo propone como **tipo**. Un tipo así sale de la transformación, no de un
clasificador a priori (como fueron los perfiles P1–P6).
