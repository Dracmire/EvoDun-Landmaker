# Resultado de la calibración ciega del juez (P0, v311) — [R], 2026-11-16 ~12:30
Material: calib_cuadros.zip (sha256 48c4faad…a1), 5 PNG verificados contra HASHES_calib.sha256; MAPA_calib.json (2ec6be19…5d). Predicciones: PREDICCION_calib_v311.md (6811794a…a1). Dos jueces subagentes sin contexto, mismo texto §3, orden de archivos distinto.
Declarado: [R] vio el mapa antes de los jueces (llegó adjunto); los jueces no lo recibieron. V1 y V2 vienen de un webp con pérdida, escalados ×2,06.

## Tablas (C = cumple, N = no cumple)
| Cuadro | Ítem | Juez 1 J1/J2/J3 | S1 | Juez 2 J1/J2/J3 | S2 |
|---|---|---|---|---|---|
| c_d95e | V2 desierto (≈ 9,5) | C/C/C | 3 | C/C/C | 3 |
| c_a007 | V1 desierto (≈ 7) | C/C (al límite)/C | 3 | C/N (al límite)/C | 2 |
| c_bf08 | DAC 84 por defecto (1) | N/C/N | 1 | N/C/N | 1 |
| c_bc55 | toma DQ3 0202 | C/C/N | 2 | C/C/N | 2 |
| c_1320 | toma DQ3 0137 | N/N/N | 0 | N/N/N | 0 |

## Predicciones
- P1 (control) S(0202) = 3 y S(0137) = 3: FALLA en los dos jueces (2 y 0).
- P2 S(V2) ≥ S(V1): CUMPLE (3 ≥ 3; 3 ≥ 2).
- P3 S(V1) > S(DAC): CUMPLE (3 > 1; 2 > 1).
- P4 S(DAC) ≤ 1: CUMPLE (1; 1).
- P5 S(V2) = 3: CUMPLE.
- P6 acuerdo ≥ 12/15: CUMPLE (14/15; única diferencia V1 J2, al límite en los dos).

## Veredicto por la regla congelada
CALIBRA: P2, P3 y P4 se cumplen en los dos jueces; el orden coincide con el de [U] (9,5 ≥ 7 > 1).

## Lo que la regla no decide (P1 informa)
- Las dos tomas del remake, de las que salió la rúbrica, no la cumplen a ciegas: 0202 falla J3 (≥ 3 niveles y 2 grupos de peldaños) y 0137 falla los tres (balaustrada y cambio de nivel cortan el eje; masa solo a un lado; varios niveles y escaleras).
- La rúbrica ordena bien maquetas limpias y simétricas (V2 > V1 > DAC), pero castiga el 2D-HD real. J3 penaliza exactamente lo que T26 describe: niveles visibles y relieve repartido (miradores, terrazas, vistazo).
- Mi calificación de v305 («0202 cumple J1–J3») no se sostiene a ciegas en J3.
