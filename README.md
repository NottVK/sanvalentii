# Nuestra Historia 💖

Juego estilo Undertale con **Nott** y **Vaal**, hecho con **Vite + TypeScript + Phaser 3**.
Se juega en el navegador, en computadora o celular, con 1 o 2 jugadores.

## Cómo jugarlo

```bash
npm install     # solo la primera vez
npm run dev     # abre http://localhost:5173
```

`npm run dev` también muestra una dirección `Network` (p. ej. `http://192.168.x.x:5173`). Ábrela en el celular, conectado al mismo WiFi.

## Controles

| | Moverse | Aceptar | Cancelar |
|---|---|---|---|
| 1 jugador | Flechas o WASD | Z / Enter | X |
| 2 jugadores: Jugador 1 | W A S D | F | G |
| 2 jugadores: Jugador 2 | Flechas | K | L |
| Celular | Cruceta en pantalla | A | B |

En el celular, con 2 jugadores cada uno usa su lado de la pantalla (mejor con el teléfono horizontal).

## Dificultad

Antes de empezar se elige el nivel (se guarda con la partida):

| Nivel | Cómo se siente | El Olvido (jefe final) |
|---|---|---|
| **Fácil** | Para disfrutar la historia sin apuros | 170 de vida, 4 de daño, 1 ataque a la vez |
| **Normal** | Hay que esquivar de verdad | 242 de vida, 6 de daño, 2 ataques a la vez |
| **Difícil** | Balas rápidas y sin descanso | 297 de vida, 8 de daño, 3 ataques a la vez |

Nott y Vaal tienen 30 HP. Los números de cada nivel están en
[dificultad.ts](app/src/data/dificultad.ts): `ajustes` cambia todo el juego y `jefeFinal`
solo la batalla contra El Olvido.

## La historia

1. **Prólogo:** Nott y Vaal se pelean y El Olvido se los lleva al Subsuelo.
2. **Jardín Dormido:** despiertan separados y tienen que reunirse.
3. **Reencuentro:** en 1 jugador peleas contra tu pareja para perdonarse; en 2 jugadores pelean juntos contra El Orgullo.
4. **Claro:** Pétalo les explica cómo escapar.
5. **Bosque de Espinas:** jefe 1, Rosalía.
6. **Lago de Cristal:** jefe 2, el Cupido Oscuro.
7. **Torre del Olvido:** recuerdos y jefe final, El Olvido (con segunda fase).
8. **Huida:** el Subsuelo se derrumba y hay que correr esquivando rocas.
9. **Final:** despiertan juntos, "Feliz San Valentín" y créditos.

Las estrellas brillantes curan y **guardan la partida**; en el título aparece **Continuar**.

## Agregar sus modelos

1. Copia las imágenes a `app/public/assets/personajes/nott/` y `app/public/assets/personajes/vaal/`.
2. Pon las rutas en [src/data/personajes.ts](app/src/data/personajes.ts):

```ts
vaal: {
  nombre: 'Vaal',
  sprite: 'assets/personajes/vaal/sprite.png',      // cuerpo completo, para el mapa
  retratos: {
    normal: 'assets/personajes/vaal/normal.png',    // obligatorio si pones retratos
    feliz: 'assets/personajes/vaal/feliz.png',      // opcionales: feliz, sonrojado,
  },                                                //   triste, sorprendido
  ...
}
```

- Se recomiendan PNG con fondo transparente, de cualquier tamaño: el juego los escala solo.
- Si falta una expresión, se usa la `normal`.
- Si los modelos son pixel art, cambia `MODELOS_PIXEL_ART` a `true`.
- Lo mismo sirve para Pétalo, Glup y los jefes.

## Cambiar los textos

| Archivo | Qué tiene |
|---|---|
| [src/data/historia.ts](app/src/data/historia.ts) | Prólogo, escenas de historia, final, dedicatoria y créditos |
| [src/data/salas.ts](app/src/data/salas.ts) | Cada zona: diálogos, letreros, recuerdos (¡pongan recuerdos reales!), regalos y jefes |
| [src/data/batallas.ts](app/src/data/batallas.ts) | Acciones de ACTUAR, respuestas, ataques, vida y textos de victoria |
| [src/data/objetos.ts](app/src/data/objetos.ts) | Objetos que curan |

## Estructura del código

| Archivo | Qué hace |
|---|---|
| `app/` | Todo el código fuente |
| `app/src/flujo.ts` | El orden de la historia (`PASOS`) |
| `app/src/estado.ts` | La partida: modo, personaje, HP, objetos y guardado |
| `app/src/sistema/entrada.ts` | Controles de 1 y 2 jugadores (teclado y táctil) |
| `app/src/ui/tactil.ts` | Cruceta y botones en pantalla para celular |
| `app/src/scenes/MapaScene.ts` | Caminar por las zonas |
| `app/src/scenes/BatallaScene.ts` | Batallas: turnos, barra de ataque y patrones para esquivar |
| `app/src/scenes/HuidaScene.ts` | La huida final |
| `app/src/sistema/texturas.ts` | Dibujos provisionales mientras no haya modelos |

## Publicarlo

El juego ya publicado vive en la **raíz del repo** (`index.html` + `juego/`), porque GitHub Pages
publica la rama `main` tal cual. El workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
lo vuelve a armar y a subir solo cada vez que se sube un cambio:

**https://nottvk.github.io/sanvalentii/**

Para actualizarlo:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

En 1 o 2 minutos el link muestra la nueva versión (se ve el avance en la pestaña **Actions**).
Si quieres armarlo tú antes de subirlo, corre `npm run build` y súbelo junto con el resto.
