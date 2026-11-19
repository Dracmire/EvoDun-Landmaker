# Verticalidad tipo lego en DAC3 (pase de diseño de [R], R2)

Registro A524–A529, T60, T61. Fuentes: `verticalidad.md` (familias A y B, invariantes I1–I4, V1–V7), el resultado del PR #105 (`verticalidad_resultado.md`) y la lectura de [U] del 2026-11-19. Todo lo que no está medido es **[H] hipótesis**.

## 1. Lo que dijo la medición (A524)

- DAC ya cumple el **orden**: 0 oclusores caminables sin reglas; M2 con ρ 0,75–0,79.
- Falta **cantidad de relieve**: las salas tienen 2–4 niveles y peldaños pequeños (M1: uno de 0,275 H). Reordenar lo que existe (V1a) no forma bandas.
- Conclusión: hay que **agregar altura**, no permutarla. Eso solo se puede en DAC3, porque cambia la topología (A514, A520).

## 2. La idea de [U] (T60, T61)

- **Lego:** Octopath usa un escalón base constante (≈ 1,25–1,5 H) y arma la verticalidad apilando dobles y triples. Una vez fijada la altura, se reutiliza en toda la zona.
- **Dirección en Y por temática:** cada zona tiene un tratamiento de altura. Con 3 tratamientos:

| Tratamiento | Familia | Qué hace | Ejemplo |
|---|---|---|---|
| **Down** | B · atalaya | el punto de vista queda alto; todo cae alrededor del héroe; vista lejana más baja | Sea of Stars, murallas de Octopath (v09, v19) |
| **Mid** | — | lo de hoy: DAC sin cambio | aldeas, bosques |
| **Up** | A · banda que sube | el fondo sube en bandas; plataformas dobles y triples; muros de contención grandes | ciudades de Octopath (v11, v15), montaña |

Con 5 (Abismo, Valle, Llanura, Colina, Montaña) son las mismas tres con dos intensidades más. **Se empieza con 3.** [R]

## 3. Reglas propuestas (hipótesis de [R])

**L1 · Escalón único.** Toda altura nueva es un múltiplo del escalón E = 1 terraza de la Base (1,25 H). Los `subs` siguen como micro relieve, sin cambio.

**L2 · Up: cortes en bandas.** La parte de sala se corta con líneas **de través a la vista** (perpendiculares al eje de `orient`). Cada franja sube 1 E respecto de la anterior al alejarse de la cámara. Las franjas tienen ≥ 5 H de profundidad, para que una toma de ≈ 17 H muestre ≤ 3 bandas (V7).

**L3 · Cada corte caminable lleva escalera.** Si un corte parte una región caminable, se talla una escalera frontal (sobre el eje del camino de `props`) o lateral pegada a la cara (I3), de ancho ≥ 3 H. La región sigue conectada; lo que cambia es la altura. Si no cabe la escalera, el corte no se hace y se cuenta como conflicto.

**L4 · Dobles y triples solo en caras no caminables.** Los saltos de 2 E o 3 E van en el escenario: el fondo (V5, el muro más alto), los lados en U y las **extrusiones grandes** de [U] (mini terrazas verticales sin acceso, vestidas como muro o fachada, I2). Lo caminable sube de a 1 E; lo que enmarca sube de a 2–3 E. Así se obtiene la lectura de «doble o triple plataforma» sin escaleras imposibles.

**L5 · Down: la parte del héroe es la cima.** La parte de sala donde está la meta o el núcleo queda en lo alto. Las franjas hacia la cámara y hacia los lados bajan de a 1 E (L3). El frente cae ≥ 2 E con baranda (V6). El fondo es una vista lejana más baja: el escenario de fondo baja en vez de subir.

**L6 · I1 siempre.** Ninguna franja caminable delante del héroe queda más alta que él (en Up se cumple por construcción; en Down también).

**L7 · Mid no cambia nada.** Mid es el DAC3 de hoy, byte a byte.

## 4. Uniones A+2 entre salas (pista [Repo] de T60)

Hoy las puertas solo unen baldosas a **una** terraza de distancia (`computeGates`, transcripción de `FindRankedTerraceTransitions`). Por eso un salto A→A+2 entre salas existe como acantilado pero nunca como unión, y ningún Cake ni mirador nace de ahí. Propuesta: en esta fase **solo se mide** en DAC3 cuántas fronteras A+2 y A+3 hay entre salas de «Balanced types», y cuántas tendrían una puerta si la regla aceptara dos terrazas. Construirlo va en otra fase.

## 5. Cam 7 con el yaw de la sala (A526)

Cam 7 tiene el yaw fijo en 0, así que en una sala con yaw 180 muestra la escena de espaldas. La hoja 2.5D tiene que mirar con el yaw de `orient`. Cam 7 vive en `render.js` (herramienta compartida): por la regla A522, cambiarla exige un clon (ver la decisión D-L4).

## 6. Medidas (sin juez)

Por ejemplo y por k0/k4/k8, en Cam 6 y en Cam 7:
- ρ (Up) o altura relativa del héroe (Down);
- oclusores caminables (deben ser 0);
- bandas visibles en la toma;
- escaleras agregadas y conflictos de L3;
- cambio de topología: regiones antes y después (debe seguir siendo una), baldosas caminables perdidas por las escaleras.

[U] juzga las capturas.

## 7. Decisiones de [U] (2026-11-19, A528)

- **D-L1:** 3 tratamientos (Down, Mid, Up). Aprobado.
- **D-L2:** E = la terraza de la Base (1,25 H). Aprobado.
- **D-L3:** aprobado, con una corrección de [U] que **reemplaza a L2 y L3** (ver §7b): DAC se construye sobre terreno natural, así que no se corta lo caminable. Se cambia la **representación**: en Up, las terrazas que ya existen se apilan con un número de legos que depende de la terraza base de la sala.
- **D-L4:** Cam 7 se reajusta (era un clon en desuso). Las cámaras principales no se tocan: Cam 3 (modo 1), Cam 1 (modo 2), Cam 6 (modo 3) y Cam 5 (cenital, útil para todos). Cam 2 es Cam 1 con el otro ángulo.
- **D-L5:** las uniones A+2 se miden ahora y se construyen después. Aprobado.

## 7b. L2' · Lego por terraza (reemplaza L2 y L3; interpretación de [R] de la idea de [U])

- **Multiplicador por sala:** m = la terraza base de la sala (la más baja que pisa), acotada a 1–3: terraza 1 → simple, 2 → doble, 3 → triple. Así cada zona reutiliza su altura (el concepto lego de T60) y las salas más altas del mapa (montaña, ciudad alta) suben más.
- **Up:** cada salto entre terrazas caminables de la sala mide m·E en vez de E. **La topología no cambia**: mismas baldosas, mismas regiones, mismas rampas; solo cambian las alturas de los niveles de la sala. Las rampas quedan más empinadas (la profundidad es fija); las líneas transversales las leen como escalera.
- **Mid:** m = 1, igual que hoy.
- **Down:** el mismo m, pero hacia abajo: la terraza más alta de la sala queda donde está y las de abajo caen m·E por salto.
- **Los `subs`** no cambian (micro relieve).
- **Límite honesto:** una sala de una sola terraza no gana nada con L2'. Se cuenta cuántas salas quedan así; los cortes en bandas (L2 y L3 originales) quedan como opción para después.
- L4 (dobles y triples en lo que enmarca), L5, L6 y L7 siguen igual.

## 8. Tesis

**T4:** con L1–L7 en Up (M1, M3) y Down (un Diorama Cima o Mirador), las salas muestran 2–3 bandas legibles por toma, ρ ≥ 0,6 en Up o altura relativa ≥ 0,8 en Down, 0 oclusores caminables y una sola región caminable. Si las bandas aparecen pero [U] no las lee como 2D-HD, falta el vestido de las caras (I2), no la altura.
