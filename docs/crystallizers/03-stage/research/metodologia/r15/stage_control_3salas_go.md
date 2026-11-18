# Pedido a CC · Punto de control: la vista 2D-HD con todo lo acumulado (3 salas) — v326

**Para qué.** R1.5 (trucos) quedó cerrada. [U] quiere ver **la mejor vista 2D-HD que hoy sabemos construir**, con todo el conocimiento acumulado aplicado a la vez sobre salas que no vienen de DQ3. No quiere una sala común de DAC con la cámara cambiada. Una celda TODO que se vea como la DAC por defecto es un fallo de este pedido: se informa como tal, no se entrega como resultado.

**Tu papel.** Construyes, renderizas, mides y armas las hojas. No juzgas composición: juzga [U] mirando. Sin agentes y sin jueces. Fuentes de las reglas: `METODOLOGIA_GENERACION_DQ3_v325.md` (receta, §1) y el `METODOLOGIA_GENERACION_DQ3_v318.md` del proyecto (§1, modelo verde, azul y rojo; §4, alturas; §7, patrones). Este pedido las baja a cifras.

## 0. Reglas del pedido
- Árbol del visor `e882c5c` en un worktree aparte. **Sin tocar `src/`.** Cámara, piezas y datos van por el arnés (ganchos e inyección de pack), como en salat, t5 y t6.
- **Solo salas generadas (DAC) o un mapa viejo.** Nada copiado ni ajustado a una toma de DQ3. No hacen falta tomas de terceros.
- **Se puede construir sobre la sala:** volúmenes, overlay rojo, barandas, pilares, escaleras, calcomanías y cierres. Cada pieza va marcada **POR REGLA** (la pone una regla del visor o del arnés a partir del mapa) o **A MANO** (puesta por ti). Las dos valen; la hoja dice cuál es cuál.
- **No se toca la topología transitable,** salvo dos cosas, declaradas con su diff de máscara: ensanchar pasos a ≥ 3 H y convertir un paso en escalera.

## 1. Las tres salas
| # | Sala | Qué representa |
|---|---|---|
| 1 | **DAC 44** (ejemplo `mockt_x44`, Cake, eje X) | sala generada, recorrido lateral |
| 2 | **DAC 14** (ejemplo `mockt_z14`, Ascension, eje Z) | sala generada, recorrido hacia el fondo (el caso más parecido a un pasillo de dungeon) |
| 3 | **Forest A** (ejemplo `forest_a`, mapa viejo, meta por POI) | exterior abierto |

Si una no carga o no tiene caminata: PARADA para esa sala sola, y sigues con las otras.

## 2. Tres estados por sala
- **BASE:** el ejemplo tal como está hoy.
- **CÁMARA:** solo la cámara y el terreno de §3.1 y §3.2. Sirve para separar cuánto aporta la cámara y cuánto la composición.
- **TODO:** todo §3.

## 3. Lo que lleva TODO (todo esto, en este orden)

### 3.1 Cámara (medida en DQ3; la prueba de distancia confirmó la fórmula con 0,000)
- Cam 6, FOV 30, K 1 (sin Cam 8), `exag` 1, `vScale` 1.
- `heroFrac` 0,10: el héroe mide 0,10 del alto del cuadro, de la coronilla al centro del punto de los pies. `tilesPerH` 1,5.
- **Pitch:** 25 en DAC 44 y DAC 14 (interior, rango medido 24–28); 38 en Forest A (exterior abierto, medido 37–40).
- **Pies del héroe en pantalla (`heroScreen`):** (0,47; 0,51) en interiores y (0,50; 0,65) en exterior.

### 3.2 Terreno
- `terraces` 3, `subs` 2.
- **Peldaño ≤ 0,5 H.** DQ3 es «súper plano»: suelo plano y el cambio de altura concentrado en escaleras.
- **Pasos ≥ 3 H de ancho** (5 integrantes lado a lado). Una escalera en cada paso entre niveles, ensanchada hacia el flujo.

### 3.3 Modelo de escena (verde / azul / rojo)
- **Verde:** suelo transitable y continuo. **Azul:** no transitable. **Rojo:** overlay decorativo y obstructivo (barandas, pilares cercanos, parapetos, vigas), con al menos un pie en azul.
- **Lo estructural es geometría** (volúmenes); **lo decorativo es billboard.** Billboards más rojo ≤ 30 % de la pantalla. Las calcomanías y cintas no cuentan.
- El rojo puede tapar al héroe un momento, nunca en el hotspot.

### 3.4 Plantilla de pantalla (lo que [U] va a buscar)
Cada celda TODO en la posición del hotspot debe acercarse a esta plantilla. Mídela e informa cada fila de la tabla.

| Elemento | Dónde (y de pantalla: 0 arriba, 1 abajo) | Cifra objetivo | Truco o regla |
|---|---|---|---|
| Primer plano | franja inferior, < 0,15 | una escalera, un borde o un corte que no tape al héroe | A7 (`noFront`) y B1 si hay paso |
| Héroe | pies en 0,51 (interior) / 0,65 (exterior) | ± 0,03 | §3.1 |
| Línea de nivel | continua entre 0,42 y 0,60 | ≥ 70 % del ancho | A6: baranda o bordillo de 1,0–1,4 H, con su encuadre |
| Masas laterales | tercios izquierdo y derecho | el tercio central queda abierto | A3 en secuencia: pilares de ≈ 5 H cada ≈ 7,3 H a los dos lados del eje, nunca sueltos ni en el centro |
| Par en la transición | flanqueando el paso o la escalera principal | un solo par por sala | C2 |
| Hotspot | sobre el eje, transitable | calcomanía visible y sutil | C3 (tinte del suelo, no del camino) |
| Fondo | borde del fondo entre 0,10 y 0,25 | s del fondo ≈ 0,55 (se mide, no se fuerza) | proporciones (A452) |
| Cierre | detrás de la línea de nivel | dos planos: barrera baja cerca + masa alta lejos | A1 + A2: vistazo a la sala vecina (Δ por V ≥ 10 % en k4); sin vecina, cierre ≥ 3 H + A4 |
| Punto focal | fondo, sobre el eje | el elemento más contrastado del cuadro | A4/A5: vano, puerta o luz (contraste máximo del visor; la luz real queda para Unity) |
| Vacío | todo el cuadro | ≤ 2 % | cierre o ventana |

**En el exterior (Forest A)** la línea de nivel puede ser un borde de terraza, un muro bajo o una fila de árboles. Las masas laterales, árboles o rocas como volumen. El fondo, el horizonte del mapa o la masa de la torre.

### 3.5 Alturas de referencia (en H, medidas en DQ3; úsalas como dato de pieza, nunca con `exag` global)
- Baranda o balaustrada: 1,0–1,4 (0202: 1,34–1,42).
- Parapetos: 0,7–1,6.
- Muro bajo: 1,2–1,3.
- Pilares de pasillo o escalera: 3,7–5.
- Muros de cierre altos: ≈ 8.

### 3.6 Lo que NO va (nunca probado, para pulido)
A3b, A8, A416, B3, B5, N1, C5, C7, bloqueo suave, `exag` o `vScale` globales, Cam 8. Si alguno aparece por regla del visor, se declara.

## 4. Posiciones
- **Cinco por sala** a lo largo del camino de props: inicio, ¼, hotspot, ¾ y cerca de la meta. Las mismas en los tres estados; si TODO cambia el camino, se usa la posición equivalente y se declara.
- **La plantilla de §3.4 se mide en el hotspot.** En las demás posiciones solo cuentan los controles de §5.

## 5. Controles y medidas
- **Controles en todas las celdas:**
  - héroe ± 5 % entre estados;
  - vacío ≤ 2 %;
  - billboards más rojo ≤ 30 %;
  - hashes ×2;
  - máscara, camino y meta iguales entre estados, o el diff declarado.
- **Por celda:** fila de los pies, fila del borde del fondo, s del fondo, profundidad útil detrás del hotspot (H), % de billboards más rojo, % de vacío.
- **Por sala, en TODO:** la tabla de §3.4 llena, fila por fila: PRESENTE (cifra medida en pantalla) / AUSENTE (motivo) / POR REGLA o A MANO.

## 6. Entrega
- **Hoja por sala:** filas = las 5 posiciones; columnas = BASE | CÁMARA | TODO. Bajo cada celda, una línea de medidas.
- **Hoja de plantilla:** el TODO de cada sala en el hotspot, con la plantilla de §3.4 dibujada encima en líneas finas (franjas, tercios y fila de los pies), para que [U] vea dónde cae cada cosa.
- **Hoja resumen:** las tres salas en TODO, en el hotspot, lado a lado.
- **`medidas_control.txt`:** las cifras, las tablas de §3.4 por sala, la lista de piezas POR REGLA y A MANO con su posición y su altura, y lo que no se pudo hacer.
- **`SHA256SUMS`** y un zip.
- **Ningún juicio.**

## PARADAS
- Algo exige `src/`: lo dices, propones el cambio sin hacerlo y sigues sin eso.
- Una sala no admite la plantilla (por ejemplo, es más chica que un cuadro): PARADA para esa sala, con las cifras.
- El héroe varía más de ± 5 % o el vacío pasa del 2 % y no se corrige sin romper una regla.
- El mismo fallo se repite dos veces.

## Historia
- v325 (dff2de1): primera versión. Delegaba en la receta y no bajaba la plantilla a cifras; usaba T3.
- v325b (e3a3cda): T3 fuera (estaba ajustada a 0202: [U] no admite salas copiadas de DQ3).
- v326: esta versión. [U] pidió que el pedido lleve todo el conocimiento acumulado explícito, para que el resultado sea 2D-HD y no una sala DAC común.
