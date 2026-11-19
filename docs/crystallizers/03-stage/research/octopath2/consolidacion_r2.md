# Consolidación R2 (2026-11-19) · pruebas detenidas por [U]

Fuente: los informes de CC de los PR #101 a #114, releídos completos por [R], más las capturas. Sin pruebas nuevas hasta que [U] apruebe este documento y el método (`entregas/README.md`).

## A. Lo construido

| PR | Qué quedó | Estado |
|---|---|---|
| #99 | Bloqueo suave de cámara (apagado) | main |
| #101 | Mockups M1–M3 y C0, clasificación v1 de las 88 salas | main |
| #103, #104 | DAC3 (`src/s3/`) clonado y sellado: 0 llamadas a la cadena original desde el modo 3 | main |
| #105 | V1a (reordenar niveles por profundidad) | main; **sin efecto útil** (A524) |
| #107 | Lego L2' (Down / Mid / Up), selector, Cam 7 con el yaw de la sala, ejemplo L1 | main |
| #109 | Salto m·E·Δ; ejemplos u1 (DAC 1) y u2 (DAC 29) | main |
| #112 | Cake Rest / Scale; lego de sub-niveles; ejemplo s1 (DAC 57) | según merge |
| #114 | Escaleras de vuelta a `steps`; Scale sin comerse la terraza; borde híbrido (`'Ah'`); medidas de 3–9 terrazas y de crecimiento | según merge |

## B. Lo aprendido (con evidencia)

1. DAC ya cumple el orden de alturas: 0 oclusores caminables sin reglas (A524).
2. No hay fronteras A+2 ni A+3 entre salas con 3, 5, 7, 8 o 9 terrazas: el terreno es continuo y las alturas dobles solo pueden salir de la representación (A532, #114).
3. Como ventana de una sala, el 70 % de las salas pisa una sola terraza (A536).
4. El lego cambia la lectura en las salas de 2 o más terrazas. Juicio de [U]: u1 bastante bien, Cake Rest (el descanso) bien (A535, A545).
5. Con 9 terrazas, **la composición gana y la conectividad se rompe**. Son dos problemas separados (corrige A553). Veredicto completo en la sección E.
6. Con seguimiento, la terraza destino crece 26–33 % en Cam 6; Cam 8 queda plana (A554).
7. En OT2 el cuerpo de las plataformas naturales es plano y la forma está en el borde (A548).
8. Cada ejemplo del modo 3 fija sus terrazas al abrirse, así que [U] no puede probar 9 terrazas desde la página (código: `applyScenario`, `sc.terraces`).

## C. Lo abierto (deudas, ninguna en curso)

- T2 por partes (A500): pedido en #101 y en #105, **nunca hecho**.
- Juicio formal de T1 (M1–M3 contra C0): las capturas existen y no hubo veredicto.
- Avisos de CC en #101 sin respuesta: DAC 14 no es P1; el héroe sale del cuadro en M3 k0; vacío > 2 % en M2, M3 y C0.
- El borde híbrido dibuja paredes en bandas: rehacerlo sobre las paredes de Box. No probado con yaw fuera de 90° ni en Cam 8.
- Peldaños de menos de una baldosa: requieren clonar el renderizador de peldaños (decisión de [U]).
- Elegir las terrazas en el modo 3 sin que el ejemplo las pise.
- Borde híbrido en la Ascensión: el muro de Ascensión (pegado a la baldosa) queda encima del contorno suavizado; en Cake no pasa (juicio de [U]).
- Cam 7 en la cima de L1 se ve casi en planta.
- El hito de [U] (A542): tipos de escenario. Todavía sin hipótesis escritas.

## D. Lo perdido

- Cuatro pasadas sobre las escaleras y el Cake de u1 y u2, con saldo casi nulo (A556).
- V1a (#105): una pasada sin efecto, por una predicción mal planteada.
- La revisión de #114: las capturas de 9 terrazas no se miraron antes de concluir.
- Causa común: [R] no leyó todas las salidas de CC y mezcló correcciones con pruebas nuevas en cada brief. La alarma y el Registro no lo detectaron, porque los lleva el mismo [R].

## E. Veredicto de 3–9 terrazas (lectura de [R] de las tablas y capturas de #114; las hipótesis las confirma [U])

1. **El 70 % de salas de una terraza es un efecto del preset «Balanced types», no de DAC.** Con «Default» y 7–9 terrazas, solo el 3–9 % de las ventanas pisa una terraza, y el 66–78 % pisa 3 o más. La causa probable es `minPlateau` 120 de Balanced, que borra las terrazas angostas [H]. Para la verticalidad, la fuente de salas es Default con más terrazas, no Balanced.
2. **Qué hacen más terrazas con la forma:**
   - **Balanced 9:** las terrazas se vuelven franjas de 1–3 baldosas, como curvas de nivel. Se leen como **laderas aterrazadas** (colina o montaña). No hay plazas planas.
   - **Valle 79** (Cake, 35 × 33 H, 8 vecinas): un piso plano rodeado de laderas escalonadas. Es la geometría base del «valle rodeado de terrazas» que pide una ciudad, pero sus bordes son gradas, no muros.
   - **Cima 46** (4 × 4 H): demasiado chica para una atalaya; una atalaya necesita al menos una toma.
3. **Candidatos de Default 9, sin capturar todavía:**
   - sala 21 (Cake, 22,7 × 18 H, 3 vecinas): casi exactamente una toma; candidata a plaza de ciudad;
   - sala 16 (Ascensión, 12 × 3,3 H): un pasillo hundido; candidato a garganta o calle, como la captura 055111 de [U];
   - sala 30 (Cake, 54 × 48 H): un valle de 3 × 3 tomas; necesita ventana y encuadre.
4. **Tipos de sala:** con más terrazas sube la Ascensión (Balanced: 41 → 58) y baja Cake (29 → 17).
5. **La conectividad se rompe** (caminable principal 70 → 5 %) porque las puertas solo unen terrazas vecinas y las franjas angostas no dejan pasar escaleras. Para escenas altas hay dos salidas [H]:
   - **dos resoluciones:** lo caminable sale de 3–5 terrazas y la altura del escenario de 7–9;
   - **escaleras que crucen dos terrazas** (A+2).

   No hay que decidir todavía.
6. **Crecimiento de la terraza destino:** 26–33 % en Cam 6. Con `heroFrac` fijo, la cámara no se acerca. Llegar al 33–40 % pide más recorrido, más pitch o un dolly, que son decisiones de cámara (A493, en espera).
