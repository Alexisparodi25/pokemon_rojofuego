# Pokémon Rojo Fuego — Edición Total (versión web)

Juego de Pokémon para el navegador: **caminas por Kanto** (pueblos, rutas, hierba alta, cuevas, gimnasios, Alto Mando),
combates por turnos, menú START, Centro Pokémon, tienda, PC, Pokédex... con **todas las especies y formas, megaevoluciones,
movimientos, habilidades y objetos** y como únicas mecánicas especiales **Megaevolución y Dinamax/Gigamax** (duran todo el combate).

## Cómo jugar
- **En local:** abre `docs/index.html` con doble clic (Chrome, Edge o Firefox). No necesita instalar nada.
- **Online:** en GitHub, *Settings → Pages → Deploy from a branch → `main` / carpeta `/docs`*.

| Acción | Teclas |
|---|---|
| Moverte | Flechas o W/A/S/D (mantén **X** para correr) |
| Aceptar / hablar | Z, Espacio o Enter |
| Volver | X o Retroceso |
| Menú START | Esc o Tab |
| Mega / Dinamax (en combate) | **M** / **G** antes de elegir el movimiento |

En móvil aparecen botones táctiles.

## Modos y personalización (al empezar)
Dificultad **Normal / Difícil / Extremo**, **Nuzlocke** (con reglas sueltas), **Aleatorio** configurable (iniciales, salvajes, entrenadores,
habilidades, movimientos, legendarios, fuerza parecida), reglas generales (tope de nivel, objetos en combate, apodos), **personaje**
(nombre, rival, colores) y **apodos**.

## Centro Pokémon: taza y Caramelo Nivelador
En cada Centro Pokémon hay una **taza**: te da un Caramelo Nivelador (una vez por medalla nueva). Dáselo a un Pokémon desde la Mochila
(pestaña *Mejoras*) y sube hasta el nivel **promedio de tu equipo** (respetando el tope de nivel).

## Sprites oficiales
Todo ocurre **en tu navegador** (no se sube nada):
- En el título, **«Importar sprites de tu ROM»**: elige tu ROM de Pokémon Rojo Fuego o Verde Hoja (`.gba`). Se importan los sprites de Gen 1-3.
- **«Importar sprites de Pokémon Añil»**: elige la carpeta del juego (la que contiene `Graphics` y `PBS`): añade Gen 4+, megas y formas.
- Lo que falte se descarga de Pokémon Showdown (necesita internet) o se muestra como una Poké Ball.

Los sprites son material de Nintendo/Game Freak y no están incluidos en el repositorio.

## Cómo está hecho
- El **motor de combate y de partida** está en Java (`engine/`), compilado a JavaScript con [TeaVM](https://teavm.org/) → `docs/js/engine.js`.
  `web-src/` contiene la fachada que expone el motor al navegador.
- El resto (mapas, mundo, menús, combate en pantalla) es JavaScript sin dependencias: `docs/js/*.js`.
- Los datos (`pokefuego/data/*.tsv`, de @pkmn/dex y WikiDex) se empaquetan en `docs/js/data.js`.

Para regenerar: `node tools/build_web_data.js` y `tools/build_web.sh` (requiere JDK 17+ y Maven; la primera vez descarga TeaVM).
