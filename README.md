# 卢沟桥 1937 — La Defensa del Puente

> **▶ Jugar ahora en el navegador (GitHub Pages):** https://traderxael.github.io/MarcoPolo1937/

FPS de campaña en Three.js ambientado en el **Incidente del Puente de Marco Polo** (卢沟桥事变, 7 de julio de 1937), hecho que inició la guerra total entre China y Japón.

## Cómo abrirlo

Doble clic en `ABRIR_JUEGO.bat`. Se inicia un servidor local y se abre el juego en el navegador.
Si prefieres hacerlo a mano:

```
cd "C:\Users\USUARIO\Desktop\MarcoPolo1937"
python -m http.server 8124
```

y abre `http://localhost:8124`.

## Controles

| Tecla | Acción |
|---|---|
| WASD | Moverse |
| Ratón | Mirar (requiere clic en "COMIENZA LA DEFENSA" para fijar el puntero) |
| Clic izquierdo | Disparar / atacar con dadao |
| Clic derecho / Q | Apuntar con precisión (ADS) |
| R | Recargar |
| C | Agacharse / cubrirse tras los sacos de arena |
| E | Usar caja de suministros y vendajes (junto a la posición china) |
| 1 / 2 / 3 o Rueda | Fusil Chiang Kai-shek / Mauser C96 / dadao |
| Mayús | Correr |
| M | Silenciar / activar audio |
| Espacio / Enter | Saltar cinemática 3D |
| Esc | Pausa (incluye sensibilidad del ratón y reinicio) |

## Características principales

- **Cinemáticas 3D en tiempo real:** secuencia de apertura sobre el río Yongding y Wanping, transiciones cinematográficas con bombardeo entre oleadas (noche a madrugada) y epílogo histórico interactivo (saltables con `Espacio`).
- **Combate táctico:** apuntado de precisión (ADS) con zoom y reducción de dispersión, cobertura agachado tras los sacos de arena, radar táctico del puente en el HUD, mensajes históricos por radio y caja de suministros reabastecible.
- **Aliados y arquetipos enemigos:** dos defensores chinos del 29.º Ejército cubren el puente abriendo fuego contra los atacantes; las fuerzas japonesas incluyen fusileros, asaltantes a la bayoneta y oficiales.
- **Atmósfera y audio:** bombardeo de artillería con destellos y temblor de cámara, sonido ambiente nocturno continuo y efectos de disparo, recarga, impactos y cornetas sintetizados vía Web Audio API.

## Fidelidad histórica

- **Escenario:** puente de Lugouqiao (Marco Polo) sobre el río Yongding y la ciudad amurallada de Wanping, con sus leones de piedra.
- **Bando del jugador:** 219.º Regimiento, 37.ª División, 29.º Ejército del Ejército Nacional Revolucionario, al mando del coronel Ji Xingwen (吉星文).
- **Armamento:** fusil Chiang Kai-shek (中正式, copia del Mauser Standardmodell de 7,92 mm), pistola Mauser C96 y dadao (大刀), arma cuerpo a cuerpo característica de la 29.ª Army.
- **Desenlace:** inalterable. El puente y Wanping cayeron; Beiping (Pekín) se rindió el 29 de julio y Tianjin el 30 de julio de 1937. Comenzaba la Guerra de Resistencia contra la Agresión Japonesa (抗日战争), que duró hasta 1945.
- La narración sigue la historiografía china del conflicto sin alterar los hechos documentados.

## Animación ("vida") de los personajes

Los modelos GLB son mallas únicas sin esqueleto, así que se animan por **deformación procedural en la GPU** (`makeLiving` + `onBeforeCompile`): un atributo `aPart` clasifica cada vértice como pierna izquierda/derecha, brazo izquierdo/derecho o torso, y un shader balancea las piernas y los brazos con desfase, aplica respiración al pecho y sacude al recibir un impacto.

- Enemigos: caminata con balanceo y desfase aleatorio por soldado, giro suave hacia el jugador (sin saltos), postura de apuntado cuando disparan, retroceso al disparar, **estremecimiento al ser heridos** y caída gradual al morir.
- Defensores chinos: respiración continua, cambio de peso y giro de cabeza; el caído permanece tumbado.

## Modelos 3D

Todos son **GLB generados con Hyper3D Rodin** (tier Gen-2.5-Low, 0,5 créditos cada uno), en `models/`:

- `soldado_japones.glb` — infantería japonesa (enemigos).
- `soldado_chino.glb` — soldado del 29.º Ejército junto a la posición del jugador.
- `leon_piedra.glb` — león guardián del puente de Lugouqiao.
- `torre_wanping.glb` — torre de la puerta de Wanping.
- `mauser_c96_ref.glb` — pistola Mauser C96, generada con **image-to-3D a partir de una foto real** de Wikimedia Commons (`referencias/mauser_c96_ref.jpg`).
- `dadao_ref.glb` — dadao, generado con **image-to-3D a partir de un dibujo histórico** (`referencias/dadao_ref.jpg`).
- `fusil_chiang.glb` — fusil Chiang Kai-shek (viewmodel). Se probaron dos versiones con foto real, pero salían peor visualmente, así que se conservó esta.

## Optimización

Los GLB se optimizaron con **glTF Transform** (`optimize --compress meshopt --simplify-ratio 0.1 --texture-size 512`): geometría simplificada, compresión Meshopt y texturas reducidas a 512 px. El juego carga `libs/meshopt_decoder.module.js` y llama a `loader.setMeshoptDecoder(...)` para decodificarlos.

- Modelos activos: **15,3 MB** (antes 130,6 MB → **-88 %**).
- Los originales sin optimizar se conservan en `models/_originales/` (169 MB) por si se quiere revertir.

La estructura del puente, arcos, muros, río y sacos de arena sigue siendo geometría procedural de Three.js. El juego funciona sin conexión una vez descargados `three.module.js`, `loaders/GLTFLoader.js`, `utils/BufferGeometryUtils.js` y la carpeta `models/`. Si algún GLB falla, se mantiene el modelo procedural de respaldo.
