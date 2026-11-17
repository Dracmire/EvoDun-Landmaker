# Pedido a CC — R1.5 Pasada única: 8 trucos con ficha sobre la misma base (v321)
Predicciones ya congeladas (PREDICCION_R15_PASADA_v321). CC construye, renderiza y mide; NO juzga composición. Árbol congelado e882c5c; nada de `src/` (hooks y envoltorios de página, declarados, como en el Paso 0).
Lee primero `INFORME_METODO_TRUCOS.md` (repo, rama docs/stage-metodologia-v319, o el Proyecto): cada truco tiene su ficha de 11 campos. Ejecuta la ficha al pie de la letra (precondiciones → receta → puerta de presencia). Si una instrucción no alcanza para ejecutarla, PARA y di qué falta. Los objetivos numéricos que cambian respecto de la ficha están en la §2 de la predicción y abajo.

## Base (igual en todos los estados)
- Terreno del Paso 0: `dac_stage`, terraces 3, subs 1, terH 2,5 tiles (1,25 H), tilesPerH 2, «Measures in H» off, spread 1 (hash del terreno puro 31ca6663…; compruébalo).
- Cam 6, heroFrac 0,10 (informa el alto del héroe en el render), exag 1, vScale 1.
- BASE = vistazo (baranda BACK 1 H, margen mínimo con la vecina entera, vecina + Δ*) + noFront + orient + props (camino) con los hooks de página del Paso 0.
- Salas y Δ*: 3 (+2,0), 8 (+2,5), 14 (+0,5). Posiciones k0, k4, k8 (+ k_mir del Paso 0 solo para A6).

## Estados por sala (10)
BASE · A6 · A3a · A3b · C3 · A4 · C2 · B3 · N1 · TODO
- A6 · línea media con su encuadre (ficha A6 entera: geometría + `heroScreen` fy en [0,45; 0,80]; la BASE de la comparación usa el MISMO fy, y además entrega BASE con fy por defecto).
- A3a · columna suelta de borde, alturas por pieza (incluye B4).
- A3b · masa baja de esquina: objetivo actualizado x ∈ [0,00; 0,35] o [0,65; 1,00], alto aparente 0,25–0,60 del cuadro, toca el borde inferior.
- C3 · calcomanía (anillo + estrella) en el hotspot.
- A4 · vano focal luminoso en el cierre lejano (abertura o tarjeta plana; nunca volumen saliente).
- C2 · par que flanquea la transición del camino (un solo par por sala); con B1 (escalera ensanchada) si la sala tiene transición (sala 8).
- B3 · altura fingida (isla azul elevada 1,5 H).
- N1 · escalera–estatua–escalera (si hay dos pasos a ≤ 10 tiles).
- TODO · BASE + todos los trucos PRESENTES en esa sala.
Si dos trucos piden el mismo lado del cuadro en TODO, se respeta la regla de cada ficha (campo 10) y se informa.

## Renders y medidas
1. PNG limpios 1280×720 por sala × estado × posición: `p_s{sala}_{k0,k4,k8,kmir}_{estado}.png` (kmir solo BASE y A6), 2 corridas con el mismo hash.
2. HOJA DE PRESENCIA (`presencia.txt`): por estado, sala y posición, PRESENTE con las medidas de la puerta de su ficha (caja en pantalla, % del cuadro, alto aparente, separación, fy, etc.) o AUSENTE con el motivo.
3. Control por sala: hash de máscara transitable, camino y meta en los 10 estados; ningún volumen sobre un tile del camino; % del cuadro de billboards + rojo (≤ 30 %).
4. V de la vecina por estado y posición (para ver si algún truco tapa el vistazo).

## Entrega
`r15_pasada.zip` (PNG), `presencia.txt`, `pasada_medidas.txt`, SHA256SUMS. Sin hojas con juicio.
## Paradas
Una ficha no alcanza para ejecutarse · hace falta tocar `src/` · el terreno no reproduce 31ca6663… · un hash difiere entre corridas. Un truco AUSENTE en una sala NO es parada: se informa.
Sin «se parece». Si el entorno añade un pie de atribución o un enlace de sesión, dilo.
