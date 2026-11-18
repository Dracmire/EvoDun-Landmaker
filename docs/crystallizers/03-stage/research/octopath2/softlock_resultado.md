# Bloqueo suave de la cámara · resultado (Octopath 2, rama R2)

Brief: `stage_softlock_go.md` (commit 725fed0). Modelo: `MODELO_ACTUAL.md` v2.2, «Tres espacios» y «Perfiles de cámara». Datos crudos: `softlock_pasos.json` (cada paso de cada corrida); capturas: `../../shots/softlock/`. Herramienta: `tools/ui/softlock_walk.js` (la caminata) y `tools/ui/softlock_report.js` (las tablas de abajo).

## 1. Qué se construyó (todo opcional; apagado = el visor de hoy, byte a byte)

- `E.stage.clamp` (`src/stage.js`) recibe un décimo argumento opcional `mg = { near, far }` (en tiles): `near` desplaza el tope sur (`u ≤ uMax − near + mN`; `Infinity` = sin tope, como DQ3); `far` es un tope norte NUEVO (`u ≥ uMin + mF`; `null` = sin tope, como hoy). Solo el eje de la vista; el eje lateral queda igual. Si los dos topes se cruzan (sala más corta que los márgenes) el objetivo queda a medio camino.
- `E.stage.CAM_PROFILES` (un solo lugar, hipótesis [R]): narrow `mN 0 / mF 4 H`, long `0 / 4 H`, wide `∞ / sin tope`; `E.stage.CAM_PROFILE_OF`: Z → narrow, X → long, Hub → wide (el rol sale de `E.orient`).
- Interruptor «Camera space by room» y selector «Camera space profile» (Auto / Narrow / Long / Wide) en el modo 3, solo en ejemplos con ventana; apagado y Auto por defecto; terminan con la sesión de ventana en toda salida. El resumen del modo 3 dice «camera space: <perfil>» y marca `far` además de `near`.
- No se tocó Cam 6 fuera de esto, ni Cam 1–8, ni los modos 1, 2 y 4. No se agregó clave de manifiesto (el brief no la pide).

## 2. Cómo se midió

Una sola pasada, `heroFrac` del ejemplo puesto en 0,10 (el valor de DQ3 de la predicción; el ejemplo trae 0,14, ver §4). El héroe camina por el **eje de la vista** de su sala (la dirección hacia la cámara `(sin yaw, cos yaw)` que da `E.orient`), desde el centro caminable de la sala: `k0…k8` hacia el sur (la cámara) hasta el último tile caminable de la sala en esa línea, luego `n0…n8` hacia el norte. Por paso: alto del héroe en pantalla / alto del panel (`heroFrac medido`), fy de los pies, si el objetivo está detenido (`near` / `far`), distancia héroe–cámara en H (profundidad en el eje óptico, centro del héroe) y `heroFrac` predicho.

Dos curvas predichas, las dos con la misma cámara (D = H / (2 · heroFrac · tan 15°), pitch de Cam 6): **exacta** = `heroFrac · D / (D − du·cos p − dz·sin p)` (du = desplazamiento del héroe respecto del objetivo hacia la cámara, dz = pies − altura del objetivo: los pies están 0,5 H bajo el pivote); **modelo** = la fórmula de escala de §2 con g = −du, `s = D / (D + g·cos p)`, sin el término de los pies.

Salas: `mockt_z14` (sala 14, E.orient dice **Z**, 39,4 × 18,8, yaw 180); `mockt_x44` (sala 44) y, de `dac_stage`, la sala **20** (la Hub más grande: 386 tiles, 30,4 × 31,5; también 17, 10 y 27 son Hub) y la sala 5 (la X de `dac_stage`, extra).

**Hallazgo sobre el brief:** la sala 44 de `mockt_x44` NO sale X en `E.orient` de hoy: largo/ancho = 96,4 / 70,3 = 1,37 → **Hub** (el umbral X es ≤ 1 / 1,5 = 0,67). Con Auto le toca wide; para ver el perfil long hay que forzarlo con el selector (así se hizo). La única sala X de las que hay es la 5 de `dac_stage`.

## 3. Resultado

Predicción congelada: wide → heroFrac 0,10 ± 5 % en todos los pasos; narrow → constante en el cuadro central, crece hacia ~0,15–0,20 con fy ≥ 0,65 al llegar al sur, encoge al norte; diferencia contra la curva < 2 %.

| Predicción | Resultado |
|---|---|
| wide: 0,10 ± 5 % en todos los pasos | **Cumple**: 0,099 en los 18 pasos de cada una de las tres salas (z14, x44, dac_stage 20). |
| narrow: constante en el cuadro central | **Cumple**: 0,099 en k0…k2 y en n0…n6 de la sala 14; la cámara sigue 1:1 hasta que toca un tope. |
| narrow: al sur crece a ~0,15–0,20 con fy ≥ 0,65 | **No llega a 0,15 con heroFrac 0,10**: máximo 0,144 en k8 con fy 0,96 (distancia a la cámara 18,7 H → 12,8 H). Crece desde k3 (tope near detenido; 7,3 tiles = 3,7 H del centro). Con el heroFrac del ejemplo, 0,14, llega a **0,195** (fy 0,95); con 0,12, a 0,170. |
| narrow: al norte encoge | **Cumple, poco**: el tope far retiene el objetivo desde n7 (15,1 tiles = 7,5 H del centro; el borde caminable está a 17,25 tiles) y el héroe baja a 0,091 (−8 %); con heroFrac 0,14, 0,138 → 0,122 (−12 %). |
| diferencia contra la curva predicha < 2 % | **Cumple**: 0,00 % contra la curva exacta (máximo de los 288 pasos de las 16 corridas), ≤ 0,65 % contra la fórmula del modelo (la diferencia es el término de los pies). La curva es hiperbólica, sin índice ajustado (A484). |

**Distancia que haría falta para 0,15 (heroFrac 0,10, sala 14, héroe en el borde sur):** con el tope near en el borde de pantalla (mN = 0, como hoy) el techo es 0,144 y los pies llegan a fy 0,96. Para pasar de 0,15 hay que detener la cámara ANTES (mN negativo; medido, `E.stage.CAM_PROFILES.narrow.mN`): −0,5 H → 0,149; −1 H → 0,155; −2 H → 0,167; −3 H → 0,182; −4 H → 0,200; −6 H → 0,248. Pero fy pasa de 1,0 con −0,5 H (los pies salen del cuadro por abajo: 1,01; 1,06; 1,18; 1,31; 1,48; 1,92). Con la cámara de hoy (FOV 30°, pitch 25°) no hay combinación de 0,15–0,20 con fy ≤ 0,78 desde un heroFrac base de 0,10: el crecimiento por fila de pantalla es menor que el que se ve en Octopath. Medido en una misma caminata: con base 0,14 el héroe vale 0,158 en fy 0,70 y 0,175 en fy 0,81; con base 0,10 vale 0,123 en fy 0,77. Las capturas de Octopath (`medidas_paso1.md`: 0,11 con fy 0,61 en 0058, 0,183 con fy 0,71 en 03, 0,151 con fy 0,78 en 09) son de salas distintas con cámaras distintas, no de una misma caminata: no se puede decir si es una cámara con otro D o salas con otra distancia. Hace falta una secuencia de una sola sala de Octopath para comparar la pendiente.

**Lo que ya existía:** el visor de hoy ya tiene un tope near (mN = 0): con el interruptor apagado el héroe también crece al sur (fila «off» de la tabla, 0,144). Lo nuevo es el tope far y el perfil wide (sin tope near).

**Sobre `dac_stage`:** el espacio de cámara es la caja de la ventana (las seis salas), no la sala: caminando por el eje de la sala 20 (Hub) o de la 5 (X) el objetivo nunca llega a un tope, y los cuatro perfiles dan el mismo 0,099 (ver tabla: «Detenida – / –»). El perfil por sala solo cambia algo en ventanas de una sala (`mockt_z14`, `mockt_x44`) o si el héroe llega al borde de la caja. Un espacio de cámara por sala dentro de una ventana de varias salas pide otra regla (la caja de la sala, no la de la ventana); no se construyó.

**Narrow y long coinciden** en el eje de la vista, como dice el brief (solo difieren de lado, que es fijo): ver sala 44 con long (k8 0,118, n8 0,086) y la sala 14 con narrow (k8 0,144, n8 0,091).

## 4. Tabla por sala × perfil

`off` = interruptor apagado (el visor de hoy); `auto` = por el rol de E.orient; los demás, forzados. Los tres últimos renglones de narrow en la sala 14 con heroFrac 0,14 y 0,12 (el ejemplo trae 0,14) son extras.

| Sala (ejemplo) | heroFrac base | Perfil | Rol de E.orient | Sur: empieza a crecer (hf ≥ 1,02 × k0) | Sur: máximo (paso, hf, fy) | Norte: mínimo (paso, hf, fy) | Detenida (sur / norte) | Dif. vs curva exacta (máx) | Dif. vs fórmula del modelo (máx) |
|---|---|---|---|---|---|---|---|---|---|
| mockt_z14 · sala 14 (39.4 × 18.8; sur 19.50 / norte 17.25 tiles) | 0.1 | off | Z | k3 | k8, 0.144, 0.96 | n0, 0.099, 0.54 | k3…k8 / – | 0.00 % | 0.52 % |
| mockt_z14 · sala 14 (39.4 × 18.8; sur 19.50 / norte 17.25 tiles) | 0.1 | auto | Z | k3 | k8, 0.144, 0.96 | n8, 0.091, 0.47 | k3…k8 / n7…n8 | 0.00 % | 0.52 % |
| mockt_z14 · sala 14 (39.4 × 18.8; sur 19.50 / norte 17.25 tiles) | 0.1 | wide | Z | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| mockt_x44 · sala 44 (96.4 × 70.3; sur 52.25 / norte 51.50 tiles) | 0.1 | off | Hub | k8 | k8, 0.118, 0.72 | n0, 0.099, 0.54 | k7…k8 / – | 0.00 % | 0.22 % |
| mockt_x44 · sala 44 (96.4 × 70.3; sur 52.25 / norte 51.50 tiles) | 0.1 | auto | Hub | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| mockt_x44 · sala 44 (96.4 × 70.3; sur 52.25 / norte 51.50 tiles) | 0.1 | long | Hub | k8 | k8, 0.118, 0.72 | n8, 0.086, 0.43 | k7…k8 / n8…n8 | 0.00 % | 0.22 % |
| mockt_x44 · sala 44 (96.4 × 70.3; sur 52.25 / norte 51.50 tiles) | 0.1 | wide | Hub | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 20 (30.4 × 31.5; sur 10.50 / norte 4.25 tiles) | 0.1 | off | Hub | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 20 (30.4 × 31.5; sur 10.50 / norte 4.25 tiles) | 0.1 | auto | Hub | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 20 (30.4 × 31.5; sur 10.50 / norte 4.25 tiles) | 0.1 | wide | Hub | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 5 (14.3 × 22.8; sur 11.25 / norte 11.50 tiles) | 0.1 | off | X | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 5 (14.3 × 22.8; sur 11.25 / norte 11.50 tiles) | 0.1 | auto | X | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 5 (14.3 × 22.8; sur 11.25 / norte 11.50 tiles) | 0.1 | long | X | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| dac_stage · sala 5 (14.3 × 22.8; sur 11.25 / norte 11.50 tiles) | 0.1 | wide | X | nunca | k0, 0.099, 0.54 | n0, 0.099, 0.54 | – / – | 0.00 % | 0.00 % |
| mockt_z14 · sala 14 (39.4 × 18.8; sur 19.50 / norte 17.25 tiles) | 0.14 | auto | Z | k5 | k8, 0.195, 0.95 | n8, 0.122, 0.46 | k5…k8 / n7…n8 | 0.00 % | 0.65 % |

| mockt_z14 · sala 14 (39.4 × 18.8; sur 19.50 / norte 17.25 tiles) | 0.12 | auto | Z | k4 | k8, 0.170, 0.95 | n8, 0.107, 0.46 | k4…k8 / n7…n8 | 0.00 % | 0.59 % |

### Pasos (heroFrac medido / predicho exacta / fy / distancia héroe-cámara en H / detenida)

**mockt_z14 sala 14 · perfil auto · heroFrac 0.1**

| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |
|---|---|---|---|---|---|---|---|
| k0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k1 | 2.44 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k2 | 4.88 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k3 | 7.31 | 0.101 | 0.101 | 0.101 | 0.56 | 18.28 | near |
| k4 | 9.75 | 0.107 | 0.107 | 0.107 | 0.62 | 17.18 | near |
| k5 | 12.19 | 0.115 | 0.115 | 0.115 | 0.69 | 16.07 | near |
| k6 | 14.63 | 0.123 | 0.123 | 0.123 | 0.77 | 14.97 | near |
| k7 | 17.06 | 0.133 | 0.133 | 0.133 | 0.86 | 13.86 | near |
| k8 | 19.5 | 0.144 | 0.144 | 0.145 | 0.96 | 12.76 | near |
| n0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n1 | -2.16 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n2 | -4.31 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n3 | -6.47 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n4 | -8.63 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n5 | -10.78 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n6 | -12.94 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n7 | -15.09 | 0.095 | 0.095 | 0.095 | 0.51 | 19.38 | far |
| n8 | -17.25 | 0.091 | 0.091 | 0.091 | 0.47 | 20.36 | far |

**mockt_z14 sala 14 · perfil wide · heroFrac 0.1**

| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |
|---|---|---|---|---|---|---|---|
| k0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k1 | 2.44 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k2 | 4.88 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k3 | 7.31 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k4 | 9.75 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k5 | 12.19 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k6 | 14.63 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k7 | 17.06 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k8 | 19.5 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n1 | -2.16 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n2 | -4.31 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n3 | -6.47 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n4 | -8.63 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n5 | -10.78 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n6 | -12.94 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n7 | -15.09 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n8 | -17.25 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |

**mockt_x44 sala 44 · perfil long · heroFrac 0.1**

| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |
|---|---|---|---|---|---|---|---|
| k0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k1 | 6.53 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k2 | 13.06 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k3 | 19.59 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k4 | 26.13 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k5 | 32.66 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k6 | 39.19 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k7 | 45.72 | 0.099 | 0.099 | 0.099 | 0.55 | 18.55 | near |
| k8 | 52.25 | 0.118 | 0.118 | 0.118 | 0.72 | 15.59 | near |
| n0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n1 | -6.44 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n2 | -12.88 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n3 | -19.31 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n4 | -25.75 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n5 | -32.19 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n6 | -38.63 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n7 | -45.06 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n8 | -51.5 | 0.086 | 0.086 | 0.086 | 0.43 | 21.38 | far |

**mockt_x44 sala 44 · perfil wide · heroFrac 0.1**

| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |
|---|---|---|---|---|---|---|---|
| k0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k1 | 6.53 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k2 | 13.06 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k3 | 19.59 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k4 | 26.13 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k5 | 32.66 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k6 | 39.19 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k7 | 45.72 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| k8 | 52.25 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n0 | 0 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n1 | -6.44 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n2 | -12.88 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n3 | -19.31 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n4 | -25.75 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n5 | -32.19 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n6 | -38.63 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n7 | -45.06 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |
| n8 | -51.5 | 0.099 | 0.099 | 0.099 | 0.54 | 18.66 | – |

**mockt_z14 sala 14 · perfil auto · heroFrac 0.14**

| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |
|---|---|---|---|---|---|---|---|
| k0 | 0 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| k1 | 2.44 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| k2 | 4.88 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| k3 | 7.31 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| k4 | 9.75 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| k5 | 12.19 | 0.145 | 0.145 | 0.145 | 0.61 | 12.68 | near |
| k6 | 14.63 | 0.158 | 0.158 | 0.159 | 0.70 | 11.58 | near |
| k7 | 17.06 | 0.175 | 0.175 | 0.175 | 0.81 | 10.48 | near |
| k8 | 19.5 | 0.195 | 0.195 | 0.196 | 0.95 | 9.37 | near |
| n0 | 0 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n1 | -2.16 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n2 | -4.31 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n3 | -6.47 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n4 | -8.63 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n5 | -10.78 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n6 | -12.94 | 0.138 | 0.138 | 0.138 | 0.56 | 13.33 | – |
| n7 | -15.09 | 0.131 | 0.131 | 0.131 | 0.52 | 14.05 | far |
| n8 | -17.25 | 0.122 | 0.122 | 0.122 | 0.46 | 15.03 | far |

**mockt_z14 sala 14 · perfil auto · heroFrac 0.12**

| paso | t (tiles) | hf medido | hf predicho (exacta) | hf predicho (modelo) | fy | dist. (H) | detenida |
|---|---|---|---|---|---|---|---|
| k0 | 0 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| k1 | 2.44 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| k2 | 4.88 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| k3 | 7.31 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| k4 | 9.75 | 0.121 | 0.121 | 0.121 | 0.57 | 15.20 | near |
| k5 | 12.19 | 0.130 | 0.130 | 0.131 | 0.65 | 14.10 | near |
| k6 | 14.63 | 0.141 | 0.141 | 0.142 | 0.73 | 12.99 | near |
| k7 | 17.06 | 0.154 | 0.154 | 0.155 | 0.83 | 11.89 | near |
| k8 | 19.5 | 0.170 | 0.170 | 0.171 | 0.95 | 10.78 | near |
| n0 | 0 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n1 | -2.16 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n2 | -4.31 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n3 | -6.47 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n4 | -8.63 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n5 | -10.78 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n6 | -12.94 | 0.118 | 0.118 | 0.118 | 0.55 | 15.55 | – |
| n7 | -15.09 | 0.113 | 0.113 | 0.113 | 0.51 | 16.27 | far |
| n8 | -17.25 | 0.107 | 0.107 | 0.107 | 0.46 | 17.25 | far |

### Barrido del margen near (z14, narrow, heroFrac 0,10, hero en el borde sur)

| mN (H) | hf | fy |
|---|---|---|
| 0 | 0.144 | 0.96 |
| -0.5 | 0.149 | 1.01 |
| -1 | 0.155 | 1.06 |
| -2 | 0.167 | 1.18 |
| -3 | 0.182 | 1.31 |
| -4 | 0.200 | 1.48 |
| -6 | 0.248 | 1.92 |


## 5. Capturas

`../../shots/softlock/<ejemplo>_r<sala>_<perfil>_k0|k4|k8.png`: k0, k4 y k8 hacia el sur con el perfil de la sala y con wide, para la sala 14 (narrow / wide), la sala 44 (long / wide) y la sala 20 de `dac_stage` (wide). 1200 × 760, el panel completo (el resumen del modo 3 dice `camera space: <perfil>` y `CLAMP (… near)`). Las mira [U]; sin jueces ni rúbricas.

## 6. Carril de verificación y segundos

Todo en esta máquina (4 núcleos, headless Chromium), un proceso a la vez salvo donde se dice.

| Comando | Resultado | Segundos |
|---|---|---|
| `node tools/test_stage_cam.js` | 62 passed, 0 failed | < 1 |
| `node tools/test_cams.js` | 131 passed, 0 failed | < 1 |
| `node tools/test_orient.js` | 23 passed, 0 failed | 9 |
| `node tools/test_controls.js`, `node tools/test_modes.js` (los docs generados quedan en sincronía) | all passed (117 entradas, 6 modos) | < 1 cada uno |
| `node tools/test_stage_camspace.js` (NUEVO: topes near / far, los 4 yaws, eje lateral intacto, topes cruzados, Cam 8, tablas) | 13 passed, 0 failed | 1 |
| `tools/ui/test_stage_ui.js` | 73 passed, 0 failed | 91 |
| `tools/ui/test_stage_orient_ui.js` | 15 passed, 0 failed | 26 |
| `tools/ui/test_stage_camspace_ui.js` (NUEVO: controles, apagado = hoy, perfil por rol, long forzado, curva predicha < 2 %, MUTACIÓN wide con far 4 H FALLA como debe, fin de sesión) | 11 passed, 0 failed | 19 |
| tabla de hashes `tools/ui/m2_hashes.js` (21 estados con los interruptores apagados: dac_stage por sala y posición, todos los interruptores, los dos ejemplos mock, los dos legacy, modos 1 y 2), árbol nuevo contra 725fed0 | **IDÉNTICA** (21 / 21), 0 errores de página | 39 por árbol |
| la caminata `tools/ui/softlock_walk.js` (16 corridas, 288 pasos, 15 capturas, barrido de mN) | 0 errores de página | 164 |

**Lo que no corrió:** `regress --sample 1/4` (el cambio en `src/ui.js` queda protegido: `camSpaceOn()` exige `st.win`, modo 3 y la sala de ventana; lo demás son claves nuevas de `st.stage` y controles que el modo 3 muestra y los otros modos ocultan; la tabla de hashes de los estados apagados es idéntica); `test_modes_ui.js` y `test_modes_leak_ui.js` (el cambio no toca el registro de modos, solo añade dos controles a la lista principal del modo 3); `test_window_session_ui.js` (el fin de sesión lo cubre `test_stage_camspace_ui.js`); el pase completo y el `verifier`. Ningún test falló ni se repitió.

## 7. Límites

- `heroFrac` 0,10 es el del brief; el ejemplo trae 0,14 y con él el crecimiento llega a 0,195 (fila extra de la tabla).
- El eje lateral queda fijo (decisión de [U]); narrow y long no se distinguen en el visor.
- El espacio de cámara es la caja de la ventana, no la de la sala (ver el hallazgo de `dac_stage`, §3).
- Los márgenes son hipótesis [R]; `mN` negativo solo existe como barrido de esta medición (tabla), no como perfil.
- No hay clave de manifiesto para el interruptor.
