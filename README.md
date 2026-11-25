# Pokémon Rojo Fuego — Edición Total

> ## ▶ Versión web (recomendada): [`docs/`](docs/)
> Juego **caminable** en el navegador (mapas de Kanto, hierba alta, entrenadores que te ven, Centro Pokémon con taza y caramelos,
> tienda, PC, Pokédex, menú START...). Abre [`docs/index.html`](docs/index.html) con doble clic, o publica la carpeta `/docs` con GitHub Pages.
> Detalles y controles: [`docs/README.md`](docs/README.md).
>
> La versión de **Processing** (`pokefuego/`, más abajo) es la primera versión del juego, con menús sobre un mapa; comparte el motor y los datos.

Un juego de Pokémon por turnos basado en **Rojo Fuego / Kanto**: 8 gimnasios, Alto Mando y Campeón.
Usa **todas las especies y formas de todas las generaciones, todas las megaevoluciones, movimientos,
habilidades y objetos**, pero con **únicamente dos mecánicas especiales: Megaevolución y Dinamax/Gigamax**,
y las dos **duran todo el combate** (no hay límite de 3 turnos).

## Cómo ejecutarlo

1. Instala Processing 3.5+ o 4.x.
2. Abre `pokefuego/pokefuego.pde` y pulsa **Run** (▶).
   (Los datos ya están en `pokefuego/data/`; no hace falta nada más.)

### Controles
| Acción | Teclas |
|---|---|
| Mover | Flechas o `W` `A` `S` `D` |
| Aceptar | `Z`, `Enter` o `Espacio` |
| Volver | `X`, `Retroceso` o `Esc` |
| **Megaevolución** (en combate, antes de elegir movimiento) | `M` |
| **Dinamax / Gigamax** (ídem) | `G` |

## Personalización (al empezar una partida)
Todo se elige en **Nueva partida**:
- **Dificultad:** *Normal* (IA sencilla, rivales más débiles), *Difícil* (IA que calcula daño y cambia a counters, jefes con Mega/Dinamax, EVs que crecen con tus medallas) o *Extremo* (rivales +3 niveles, EVs al máximo, todos pueden Megaevolucionar/Dinamaxear, captura más difícil, sin tope de nivel).
- **Nuzlocke** con reglas a medida: sólo la primera captura de cada zona, cláusula de duplicados, muerte permanente (cada una se puede activar o no).
- **Aleatorio** detallado: iniciales, Pokémon salvajes y entrenadores/jefes por separado; **fuerza parecida** a la original (sí/no); **habilidades** (originales / aleatorias de las 318 / aleatorias sólo con efecto en el juego); **movimientos** (por nivel / aleatorios inteligentes / totalmente aleatorios); **legendarios** (nunca / según nivel / siempre).
- **Reglas generales:** tope de nivel, objetos en combates de entrenador, preguntar apodo al capturar.
- **Personaje:** tu nombre, el nombre de tu rival y el color de gorra, camiseta y pelo.
- **Apodos** para tus Pokémon al capturarlos o desde Equipo → Poner apodo.

Otras mejoras: **Pokédex completa** (selecciona un Pokémon capturado: datos, habilidades, movimientos por nivel, otros movimientos, evolución y formas) y **Ayuda / Preguntas frecuentes** en el título y en el mapa.

## Taza del Centro Pokémon y Caramelo Nivelador
En cada **Centro Pokémon** hay una **taza** (menú de la ciudad). Si interactúas con ella te da un **Caramelo Nivelador**.
Dáselo a un Pokémon desde la Mochila (bolsillo *Mejoras*): calcula el **promedio de niveles de tu equipo** y sube a ese Pokémon
hasta ese nivel (aprende los movimientos y puede evolucionar). En dificultad difícil respeta el **tope de nivel** del próximo jefe.
La taza se rellena una vez por Centro Pokémon cada vez que consigues una **medalla nueva**.

## Megaevolución y Dinamax
- **Mega**: el Pokémon debe llevar su **piedra mega** (las dan los jefes, los entrenadores y la tienda de Ciudad Azulona).
  Incluye las 48 megas clásicas, las 2 regresiones primigenias (Orbe Rojo/Azul) y las megas de Leyendas Z-A.
- **Dinamax / Gigamax**: disponible para cualquier Pokémon (salvo los que no pueden). Multiplica sus PS por 1,5
  y convierte sus movimientos en **Movimientos Max** (con efectos de clima/terreno/estadísticas) o **G-Max** si es de una de las 34 especies Gigamax.
  Los de estado se convierten en **Protección Max**.
- **Una transformación por combate y por bando** (Mega *o* Dinamax). Ambas duran hasta que termina el combate.

## Contenido
| | |
|---|---|
| Especies y formas | **1416** (todas las gens, formas regionales, Mega, Gigamax, formas por objeto: Arceus, Silvally, Genesect, Zacian...) |
| Megaevoluciones | **91** (+2 primigenias) |
| Gigamax | **34** |
| Movimientos | **888** + Movimientos Max/G-Max |
| Habilidades | **318** (todas existen y se muestran; ~210 tienen efecto en combate) |
| Objetos | **582** de combate + pociones, balls, piedras, vitaminas... (la tienda "Gran Almacén" de Ciudad Azulona vende **todos**) |

### Qué está implementado en combate (y qué no)
Todos los datos (estadísticas, tipos, habilidades, movimientos que aprende cada especie por nivel/MT/tutor/huevo, cadenas evolutivas) son reales.
El **motor de combate es propio** y no implementa el 100 % de las mecánicas de los juegos oficiales:
- **Movimientos de daño (570):** todos funcionan (poder, tipo, precisión, prioridad, críticos, multigolpe, retroceso, drenaje, efectos
  secundarios, cargas/recarga, furia, golpes fijos/por nivel, OHKO, poder variable por peso/PS/velocidad, etc.).
- **Movimientos de estado (266):** ~144 implementados (estados, potenciar/bajar estadísticas, curación, clima, terreno, trampas,
  pantallas, Protección, Mofa, Espacio Raro...). Los demás (Sustituto, Rencor, Tinieblas...) **no hacen nada** y la IA/generador de
  equipos los evita.
- **Habilidades:** todas se muestran con su descripción; ~210 de 318 tienen efecto real (las más usadas: Intimidación, climas,
  absorciones, Robustez, Mold Breaker, Técnico, Adaptable, Velo Arena, etc.). Faltan las que dependen de mecánicas de dobles/formas raras.
- **Objetos:** bayas, restos, vidasfera, bandas/gafas Elección, chalecos, placas, potenciadores de tipo, orbes, piedras mega, etc.
  Muchos objetos "de nicho" existen pero no tienen efecto en combate.
- **Combates 1 vs 1** (sin dobles).
- **Idioma:** movimientos, habilidades y objetos se muestran en español con su descripción (extraídos de [WikiDex](https://www.wikidex.net/) con `tools/fetch_wikidex.py`; ~96 % de movimientos, 97 % de habilidades y 82 % de objetos; lo que falta, como las MT genéricas, queda en inglés). Los nombres de especies son los internacionales.
- **Sprites oficiales:** en el título elige **«Importar sprites de tu ROM»** y selecciona tu ROM de Pokémon Rojo Fuego o Verde Hoja (`.gba`, tu propia copia): el juego extrae los sprites oficiales de frente y espalda de los Pokémon 1-386 a `pokefuego/data/sprites/` (sólo en tu equipo; esa carpeta está en `.gitignore` porque son material de Nintendo/Game Freak). Con **«Importar sprites de Pokémon Añil»** eliges la carpeta de ese juego (la que contiene `Graphics` y `PBS`; sirve cualquier juego de Pokémon Essentials) y se importan los de Gen 4 en adelante, megas y formas (usa `PBS/pokemon_forms.txt` para saber qué es cada forma). Lo que siga sin sprite intenta descargarse de Pokémon Showdown; si no puede, muestra una Poké Ball con el número.

## Estructura
```
pokefuego/                 <- el sketch de Processing (abre pokefuego.pde)
  pokefuego.pde            bucle principal, entrada, utilidades de dibujo
  Screens.pde              título, mapa de Kanto, equipo, mochila, tienda, cajas, Pokédex...
  BattleScene.pde          escena de combate
  Setup.pde                nueva partida, opciones, personaje, apodos, Ayuda, Pokédex completa
  code/pokefuego-engine.jar  el motor de juego compilado (Processing lo carga solo)
  data/*.tsv               datos (generados con tools/)
engine/                    código fuente del motor (Java, paquete pokefuego.engine)
  Battle, Calc, AI, Game, Mon, Items, Effects, Data (Species, Move, Dex...)
tools/
  build_engine.sh    recompila engine/ -> pokefuego/code/pokefuego-engine.jar
  export_data.js     regenera los datos desde @pkmn/dex (npm i && node export_data.js)
  build_web.sh / build_web_data.js   compilan el motor a JavaScript (TeaVM) y empaquetan los datos para docs/
  web_smoke_test.js  prueba de humo del juego web (Playwright)
  fetch_wikidex.py   traducciones al español desde WikiDex (data/es_*.tsv)
  check.sh           simula miles de combates IA vs IA
  PlaySim.java       bot que juega partidas completas
  build_sketch.sh    compila el sketch contra core.jar sin abrir Processing
  gen_functional.py  regenera la lista de habilidades con efecto (Effects.FUNCTIONAL)
  UiTest*.java       pruebas de interfaz bajo Xvfb
```
Si modificas algo en `engine/`, ejecuta `tools/build_engine.sh` para regenerar el jar.

## Pruebas
```bash
tools/check.sh 2000      # 2000 combates aleatorios con Mega/Dinamax: debe terminar con "errores=0"
```

Los datos provienen de [@pkmn/dex](https://github.com/pkmn/ps) (Pokémon Showdown). Pokémon es marca de Nintendo/Game Freak/Creatures;
proyecto de fans sin fines de lucro.
