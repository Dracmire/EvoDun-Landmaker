# Marco del modo 3: niveles, teorías, convergencia y camino de HT1

[R], 2026-11-20 (A606–A608). Ordena lo que está disperso en `PANORAMA.md` (bitácora), `MODELO_ACTUAL.md` (el
modelo) y `HIPOTESIS.md`. Antes de cualquier prueba nueva se lee esto.

## 1. Dos ejes para clasificar todo

**THML (abstracción, A586/A589):**

| Eje | Qué es | Estado |
|---|---|---|
| T · top | Teoría del paso de conversión, o de cómo se comportan DQ3 y OT2 | activo |
| H · high | Un método apto para HD-2D | activo |
| M · mid | Herramientas de topografía en `src` | polish, postergado |
| L · low | Parámetros y cámara | polish, postergado |

**Niveles de madurez (A604):** lv1 entry (propuesta) · lv2 existe (comprobada) · lv3 applied (testeada y aplicada al
modelo) · lv4 mature (dio ganancia) · lv5 evolved (se integró y nos subió de nivel).

Equivalencia con las marcas del modelo: `[H]` = lv1; `[V]` = lv2, o lv3 si además está construida en el visor;
`[X]` = descartada (fuera de la escala); `[R]` = decisión, no hipótesis.

## 2. El modelo actual evaluado con los dos ejes

Conteo de marcas por sección de `MODELO_ACTUAL.md` v2.5:

| Sección | THML | `[V]` | `[H]` | `[X]` | Nivel típico |
|---|---|---|---|---|---|
| §1 Qué es una vista 2D-HD | T | 0 | 2 | 0 | lv1 |
| §2 Cámara | L | 11 | 8 | 1 | lv2–lv3 |
| §3 Escala y alturas | L / M | 7 | 0 | 0 | lv3 (H, heroFrac); el héroe como unidad, lv4 |
| §4 Terreno y relieve | M | 6 | 2 | 0 | lv2–lv3 |
| §5 El mapa viejo y el generador | T / H | 9 | 0 | 1 | lv2 |
| §6 Modelo de escena | H | 1 | 0 | 0 | lv2 |
| §7 Composición | H | 5 | 1 | 0 | lv2 |
| §8 Lo que no funciona | M / L | 0 | 0 | 18 | descartadas |
| §9 Método e instrumentos | H | 4 | 0 | 0 | lv3 (caminata, toma emparejada) |
| §9b Fuentes de los creadores | T | 9 (fuente) | 0 | 0 | lv2 |
| Parte II · Base (rasgos 1–6) | M | — | — | — | lv3 |
| Parte III · Features por tipo (F-D, F-T, F-B, F-E, F-C) | M / H | 22 | 9 | 2 | lv1–lv2 |
| §16 Abierto | H / T | 0 | 0 | 1 | pendiente |

**Lectura:** el modelo pesa abajo. Cámara y escala (L) juntan 18 de las 66 `[V]`; la sección de teoría (§1) tiene
solo 2 hipótesis y ninguna comprobada. Es el techo de sublimación visto en el propio modelo: mucho comprobado en L y M,
casi nada en T. Lo único de T en lv2 llegó por fuentes externas (§9b) y por HT1.

## 3. Matriz teorías × dominios

Dominios = la cadena de Dormans (M0–M3), más el juez (cómo se evalúa) y el generador (qué datos tiene que entregar).

| Teoría o fuente | M0 Misión | M1 Lugar | M2 Toma | M3 Geometría | Juez | Generador |
|---|---|---|---|---|---|---|
| Dormans, cadena de modelos | Grafo de misión | Grafo de espacio | (extensión nuestra) | Último modelo | Cada flecha se comprueba sola | Entrega M0 |
| Image Analogies | — | Reglas locales aprendidas de un par | Ídem para la cámara | — | Predecir la parte que no se usó | — |
| Merrell, gramática desde un ejemplo | — | Reglas desde un ejemplo | — | Síntesis 3D | — | — |
| Rango expresivo (PCG book) | — | — | — | — | Distribución sobre muchas salidas | — |
| Hullett, patrones validados | — | Patrón = intención + forma | Patrón de toma | — | Validar sobre muchos casos | — |
| Christie, cámara por restricciones | — | — | Visibilidad, encuadre, oclusión | — | Restricciones cumplidas | — |
| Modelado procedural inverso | — | Parámetros desde un ejemplo | — | — | Ajuste al ejemplo | — |
| GDC Octopath | Camino primero | Zona alrededor del camino; escala por espacio (1:2) | FOV estrecho; máscara alfa; héroe constante | Terrazas, fondo alto, casas chicas; piezas modulares | Demo recorrible | — |
| DQ11 | — | Reconocible por sus hitos | Cambiar lo que no se lee | Techos → terrazas | Recorrer con modelos temporales | — |
| Pares DQ3 (HT1) | Eje (C7) | Hitos, marco, meta del fondo sube, tarima frente a puerta | Primer plano, contexto | — | El remake | Función del lugar (densidad) |
| Plataformas de [U] (SequenceA) | Camino A* entre núcleos | Trozos por sala y terraza | Punto de vista, visible / oculto | — | — | Ya es generador |

## 4. Convergencia

**Entre teorías.** Todas dicen lo mismo con palabras distintas:
1. **Modelos intermedios explícitos** (Dormans, GDC: camino → zona → piezas; DQ11: concepto → 3D → 2D; [U]: camino →
   trozos → plataformas).
2. **Las reglas se derivan de ejemplos** (Image Analogies, Merrell, modelado inverso; HT1 lo hizo a mano con los pares).
3. **Se juzga sobre lo que no se usó para escribir la regla, o sobre muchas salidas** (Image Analogies, rango
   expresivo, Hullett). Es lo que nos faltaba: por eso los tests de un solo lugar no servían (⊘, A586).
4. **La geometría se deforma para la cámara** (GDC: fondo alto, casas chicas, 1:2; DQ11: techos → terrazas; pares C3a;
   Christie, al revés).

**Entre el polish y la cadena (A593).** Las cinco familias de L / M son arreglos locales de tres modelos que faltan:

| Familia de polish | Modelo que la produciría |
|---|---|
| La altura crece con la profundidad | M2 → M3 |
| El encuadre está cerrado | M1 |
| El eje del recorrido es el eje de la vista | M0 → M2 |
| El héroe es la unidad | M2 |
| Las transiciones se leen desde la cámara | M2 → M3 |

**Entre las teorías y el polish.** Las cuatro ideas comunes de arriba cubren las cinco familias. Lo que construimos
en L / M era correcto, pero hecho en el nivel equivocado, a mano y sin el modelo que lo produce.

## 5. HT1: teoría derivada y camino de madurez

**De HT1 a una teoría.** HT1 comprobó *que* la conversión es local. La teoría derivada dice *cuál* es:

**TL · Teoría del lugar.** El lugar (M1) es una función del trazado top-down y de la función del sitio:
`lugar = TL(trazado, función)`, con cinco reglas locales, cada una con su predictor:

| Regla | Predictor en el trazado | Efecto en el lugar | Evidencia |
|---|---|---|---|
| L1 Hitos | Objeto distinto sobre el suelo | Se conserva y se marca como hito | 8/8 |
| L2 Marco | Borde de lo caminable o fila de objetos | Se cierra con un marco (muro, columnata, baranda, árboles) | 8/8 |
| L3 Meta del fondo | Meta en el extremo del eje principal | Sube (tarima, isla, subida) | 4/8 |
| L4 Umbral | Parche de suelo distinto frente a una entrada | Tarima con escalones | 2/8 |
| L5 Eje | Camino, alfombra o puente dominante | Eje del lugar; la toma lo mira | 6/8 |

La función del sitio (taberna, tienda, guarida) no está en el trazado: la entrega el generador, y de ella sale la
densidad (C6).

**Camino de niveles:**

| Nivel | Qué hay que lograr | Cómo se evalúa | ¿CC? |
|---|---|---|---|
| lv2 (hoy) | Reglas observadas en 8 escenas | — | No |
| lv3 applied | Cada regla escrita como una transformación local (entrada: el fotograma original, que es top-down; salida: los cambios). Se prueba dejando una escena fuera: la regla se escribe con 7 y se predice la 8.ª. Entra al modelo como sección nueva. | Acierto contra el remake, con un umbral fijado antes (propuesta: L1 y L2 ≥ 6/8, L3 ≥ 3 de las escenas donde hay meta al final del eje) | No: es papel, o una herramienta chica |
| lv4 mature | Aplicar L3 + L5 (o L2) a las salas de DAC en el visor | Rango expresivo sobre las 88 salas (por ejemplo, el % de salas cuya meta queda alta y visible en k0) y la toma emparejada de Aurhea o del bosque | Sí: se pregunta antes, con objetivo y lectura |
| lv5 evolved | El lugar es la entrada de la toma y reemplaza el polish hecho a mano | Cuántos rasgos de L / M salen solos | Sí |

**Techo realista sin un remake de EvoDun:** lv3 está asegurado; lv4 depende de que el rango expresivo cuente como
ganancia, porque para DAC no hay remake con el que comparar.

**Sobre la toma.** También tiene juez: los pares dicen dónde puso la cámara el remake (eje C7, 6/8) y qué agregó
delante (C4, con predictor en 3/8). Se evalúa igual, prediciendo la escena que no se usó. El juez es más débil:
son 8 fotogramas en perspectiva, no mapas.

**La prueba de incremento es la transformación local:** se toma una regla, se escribe como operador y se mira si
predice el remake que no se usó. Si acierta, sube a lv3; si no, la regla se corrige o se descarta (dos pasadas como
máximo).

## 6. Corrección de [U] (A609–A610)

**Lo que estaba mal en §5.** Las reglas L1–L5 son reales, pero son una taxonomía de cambios: describen *qué* cambió,
no *cómo* se transforma. HT1 es sobre transformaciones, y una regla que no se puede ejecutar no prueba transformación
ni da ganancia. Por la regla de [U] (sin ganancia no se prueba), TL como estaba en §5 no se lleva adelante.

**Lo natural: reproducir la transformación.** Y ya la reproducimos tres veces, a mano, sin verlo así: los scripts
`refs/dq3/aurheas_fountain/derived/derive_roles.py` (198 líneas), `refs/dq3/forest_plains/annotated/derive_roles.py`
(218) y `refs/dq3/throne_aliahan/derive_roles.py` (79) toman un mapa viejo top-down y producen el pack que el visor
convierte en escena. Los tres hacen los mismos pasos:

1. leer el recorte del mapa y su grilla (Aurhea la aprende de los bloques);
2. clasificar cada baldosa por su firma de color (agua, roca, camino, flor, árbol, pasto);
3. armar zonas por piezas conectadas (`MIN_PIECE`) o por sectores;
4. dar altura por clase o zona (agua < tierra < meta: la península de Aurhea a 60, la tarima del trono en subniveles);
5. marcar camino y meta (POI).

Lo que cada script tiene **a mano y propio** son los umbrales de color, las reglas geométricas de sector y las alturas
puestas a ojo. Lo **compartido** es la transformación local: firma de la baldosa → clase → rol y altura.

**HT1 a un nivel más:** extraer de los tres scripts un solo operador local, sin reglas por mapa, y comprobar si
reproduce cada mapa.
- **Ganancia:** el operador es la herramienta de M6 (relieve automático desde el trazado, hoy «?» por falta de método)
  y la entrada que el generador de EvoDun puede alimentar con un trazado del mismo tipo.
- **Juez:** escribir el operador con dos mapas y aplicarlo al tercero; comparar baldosa por baldosa con el pack hecho a
  mano (clase y altura) y la escena con la toma emparejada del remake (M4 ya existe).
- **Descarte (fijado antes):** si el operador sin ajustes por mapa no reproduce la mayoría de las baldosas del mapa
  que quedó fuera, la conversión de DQ3 es autoral por mapa y HT1 se queda en lv2.
