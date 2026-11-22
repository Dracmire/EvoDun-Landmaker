# PP3, primera instancia: qué mapa da la red de profundidad de XChengCode

Instrumento de terceros, commit `4c37fbb`. No se juzga: solo se cuenta qué se ve y qué pasó.

## Qué corrí y con qué
- Red: MiDaS `dpt_beit_large_512`, pesos `dpt_beit_large_512.pt` (1 581 966 003 bytes, sha256 `9e9e900747e9e8b3112df716979219836a27716277b3d0dc53889cbba8b82328`), en CPU.
- Versiones que funcionaron: Python 3.10.22, torch 2.14.1 (rueda de PyPI con CUDA; el índice CPU de PyTorch está bloqueado aquí, no se usó GPU), torchvision 0.29.2, **timm 0.6.12**, numpy 2.2.6, opencv-python 5.1.0.95, scikit-learn 1.7.2, pandas 2.3.3, pillow 12.3.0.
- Máquina: Xeon 2,1 GHz, 4 núcleos, Linux 6.18. Tiempos: carga del modelo 5,1 s; profundidad 9,8 s (5F), 1,8 s (0202), 1,4 s (0137); k-means del repo 16–17 s con N=3 y 26 s con N=5, por cada llamada.
- Mi script `pp3_run.py` (fuera del repo) importa del clon `load_model`, `process` e `img_seg` sin editarlos y repite las líneas 28–53 de `depth_img_generator.run` para cargar el modelo una sola vez. No ejecuté `run.py`. Cada imagen se leyó con `convert("RGB")`, k-means con `np.random.seed(0)`, imagen y mapa inferno reducidos a 512×512 (INTER_CUBIC). Etiqueta = cuántas máscaras valen 0.
- Imágenes: el 5F del SNES (463×876, sha256 `460cd579…03b6` comprobado) y los fotogramas 0202 y 0137 del piso 2 (los de la Najimi).

## Qué se ve (hojas en esta carpeta; filas: original, gris, inferno / etiquetas de profundidad N=3, de color N=3, de profundidad N=5)
- **5F (`hoja_pp3_5f_snes.png`)**: el mapa de profundidad es muy suave. Es más oscuro arriba (el cielo, el más oscuro) y más claro abajo, con un degradado continuo de arriba abajo; se distingue el borde escalonado del castillo contra el cielo. Los muros, pilares y escalones internos aparecen apenas como bloques tenues; el suelo no se separa de los muros. Con N=3 y N=5 las etiquetas de profundidad salen como franjas horizontales con borde irregular (arriba azul oscuro = cielo; abajo verde, amarillo, violeta, rojo). Las etiquetas de color siguen el color del dibujo (cielo, piedra clara, punteado de piedra y suelo) con mucho grano.
- **0202 (pilares y escalera)**: la profundidad muestra los dos pilares y los bloques del primer plano como formas claras, el fondo oscuro y el minimapa como un disco plano a media luz. Las etiquetas de profundidad separan pilares/primer plano del fondo; las de color siguen la luz y las texturas, y el sello del canal y el minimapa salen en amarillo.
- **0137 (dragón y balaustrada)**: fondo oscuro con la balaustrada como relieve, un bloque muy claro en la esquina inferior derecha, el resto en tonos medios muy parecidos. Las etiquetas de profundidad salen en franjas horizontales; la franja negra superior del fotograma es su propia clase (arriba del todo).
- En el 5F la reducción a 512×512 aplasta el mapa (463×876 pasa a 512×512, mucho más ancho que alto en proporción); no lo corregí. Las etiquetas se ven devueltas a la proporción original con vecino más cercano.

## Qué falló o quedó sin probar
- Falló dos veces antes de funcionar: con timm 1.0.31 el modelo no carga (`Unexpected key(s) … attn.relative_position_index`), y timm 0.6.12 no importa en Python 3.12 (`mutable default … MaxxVitConvCfg … use default_factory`). Funcionó con Python 3.10.22 (bajado con `uv`) + timm 0.6.12. El disco se llenó una vez (instalación de torch con CUDA) y borré el entorno de 3.12.
- No corrí la parte de MAT (rellenado), `Fixing_mask.py` ni `RGBA_convertor.py`, ni se bajaron los pesos `Places_512_FullData.pkl`. El N=5 de color se calculó y se guardó, pero no entra en las hojas (el formato pedido tiene seis celdas).
- No probé otras versiones de torch/timm ni otras semillas.

## Dónde quedó lo pesado (no se commitea)
`~/pp3/out/`: `<clave>_depth_raw.npy`, `<clave>_depth_gray8.png`, `<clave>_depth_inferno.png`, `<clave>_in512.png`, `<clave>_inferno512.png`, `<clave>_labels_{d3,c3,d5,c5}.npy`, capas y máscaras `<clave>_{d3,c3,d5,c5}_layer{i}.png` / `_mask{i}.png`, `pp3_log.txt`, `pp3_times.json` (claves `f5snes`, `f2_0202`, `f2_0137`). Script: `~/pp3/pp3_run.py`; clon `~/pp3/xchengcode`; pesos `~/pp3/weights/`; registros `~/pp3/logs/`.
