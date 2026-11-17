# Resultado R1.5 Pase 2 (Generación del vistazo en DAC) — [R], 2026-11-16 ~20:50
Predicciones: PREDICCION_R15_P2_v313.md (f4cfd000…). Entrega de CC: r15_p2.zip (8bc83896…), 13 archivos verificados. Pruebas: 9 por juez, armadas por [R]; mapa MAPA_pruebas_r15p2.json (45c275cc…) abierto después de los 3 votos. Referencia R = toma 0137 (c_1320).

## Sala y estados
Sala 1 de dac_stage (278 tiles, yaw 0), elegida por regla; vecina = sala 7 a 1 tile. A = planes 3 H; K = planes 5 H; B = baranda 1 H al fondo + margen 62 + vecina +4,0 H (ningún Δ alcanzó V ≥ 20 %; máx. 15,7 % en el hotspot k4; con Δ = 4 la baranda solo se aplica en 31 de 58 tiles).

## Medidas
V de la vecina (% del cuadro), k0/k4/k8: A 1,05/0,98/0,71 · K 0,93/0,79/0,56 · B 11,9/15,7/32,3. Control de máscara, camino y meta: iguales.

## Votos (estado elegido por juez A / B / C)
| Posición | B vs K | B vs A | K vs A |
|---|---|---|---|
| k0 | B B B | B B B | A K A → A |
| k4 | B B B | B B B | A K A → A |
| k8 | B B B | B B B | K K K → K |
Razón dominante: B tiene un muro bajo a media profundidad con un fondo lejano escalonado detrás, como la baranda y el salón de R; K y A cierran con una pared alta única.

## Predicciones
G1 cumple · G2 a medias (V de B > V de A en las 3; el 20 % no se alcanzó) · G3 (principal) CUMPLE 3/3 posiciones, unánime · G4 CUMPLE 3/3, unánime · G5 informativa: A gana a K en k0 y k4, K gana en k8 · G6 cumple.

## Veredicto por la regla congelada
POSITIVO: en una sala generada no usada, la regla del vistazo gana al cierre alto (K) y al estado por defecto (A), 9 de 9 votos en cada comparación.

## Lectura de [R] y límites
- Responde A333: los jueces no premian solo «tapar el cielo»: K también tapa el cielo y pierde 9 a 0. Lo que gana es el cierre en dos planos: una barrera baja cercana y una masa más alta y lejana detrás.
- No se probó que la masa lejana tenga que ser la sala vecina real: un fondo construido (fondo falso de 16 bits) podría dar lo mismo. Las dos son reglas de generación.
- La regla quedó en su tope (Δ = 4 H, V 15,7 % < 20 %) y la baranda se aplicó a medias: el estado B no es exactamente el especificado.
- Una sala, tres posiciones, tres jueces del mismo modelo; referencia de otro juego.
