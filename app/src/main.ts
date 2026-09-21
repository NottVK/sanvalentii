import Phaser from 'phaser';
import { ALTO, ANCHO } from './config';
import { entrada } from './sistema/entrada';
import { montarTactil } from './ui/tactil';
import { BootScene } from './scenes/BootScene';
import { TituloScene } from './scenes/TituloScene';
import { SeleccionScene } from './scenes/SeleccionScene';
import { CinematicaScene } from './scenes/CinematicaScene';
import { MapaScene } from './scenes/MapaScene';
import { BatallaScene } from './scenes/BatallaScene';
import { HuidaScene } from './scenes/HuidaScene';
import { GameOverScene } from './scenes/GameOverScene';
import { FinalScene } from './scenes/FinalScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: ANCHO,
  height: ALTO,
  parent: 'juego',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  input: { keyboard: false },
  scene: [
    BootScene,
    TituloScene,
    SeleccionScene,
    CinematicaScene,
    MapaScene,
    BatallaScene,
    HuidaScene,
    GameOverScene,
    FinalScene,
  ],
};

function iniciar() {
  montarTactil(1);
  const juego = new Phaser.Game(config);
  // Las pulsaciones duran un solo cuadro: así una tecla nunca se "guarda" para después
  juego.events.on(Phaser.Core.Events.POST_STEP, () => entrada.finCuadro());
  // Al achicar el juego (pantallas chicas) el escalado pixelado se come líneas de las letras: ahí se suaviza
  const ajustarNitidez = () => {
    if (juego.canvas) juego.canvas.style.imageRendering = juego.scale.displayScale.x > 1.01 ? 'auto' : 'pixelated';
  };
  juego.scale.on(Phaser.Scale.Events.RESIZE, ajustarNitidez);
  juego.events.once(Phaser.Core.Events.READY, ajustarNitidez);
  // window.juego queda disponible en la consola del navegador para depurar
  Object.assign(window, { juego });
}

// Espera a que cargue la fuente pixel antes de arrancar (si falla, arranca igual)
document.fonts.load('30px VT323').then(iniciar, iniciar);
