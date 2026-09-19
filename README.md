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

1. Copia las imágenes a `public/assets/personajes/nott/` y `public/assets/personajes/vaal/`.
2. Pon las rutas en [src/data/personajes.ts](src/data/personajes.ts):

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
| [src/data/historia.ts](src/data/historia.ts) | Prólogo, escenas de historia, final, dedicatoria y créditos |
| [src/data/salas.ts](src/data/salas.ts) | Cada zona: diálogos, letreros, recuerdos (¡pongan recuerdos reales!), regalos y jefes |
| [src/data/batallas.ts](src/data/batallas.ts) | Acciones de ACTUAR, respuestas, ataques, vida y textos de victoria |
| [src/data/objetos.ts](src/data/objetos.ts) | Objetos que curan |

## Estructura del código

| Archivo | Qué hace |
|---|---|
| `src/flujo.ts` | El orden de la historia (`PASOS`) |
| `src/estado.ts` | La partida: modo, personaje, HP, objetos y guardado |
| `src/sistema/entrada.ts` | Controles de 1 y 2 jugadores (teclado y táctil) |
| `src/ui/tactil.ts` | Cruceta y botones en pantalla para celular |
| `src/scenes/MapaScene.ts` | Caminar por las zonas |
| `src/scenes/BatallaScene.ts` | Batallas: turnos, barra de ataque y patrones para esquivar |
| `src/scenes/HuidaScene.ts` | La huida final |
| `src/sistema/texturas.ts` | Dibujos provisionales mientras no haya modelos |

## Publicarlo

El juego se publica solo en **GitHub Pages** cada vez que se sube algo a la rama `main`
(ver [.github/workflows/deploy.yml](.github/workflows/deploy.yml)):

**https://nottvk.github.io/sanvalentii/**

La primera vez hay que activarlo una sola vez en GitHub: **Settings → Pages → Source: GitHub Actions**.

Para actualizarlo después de hacer cambios:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

En la pestaña **Actions** del repo se ve el progreso; tarda 1 o 2 minutos.
