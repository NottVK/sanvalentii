import Phaser from 'phaser';
import { FUENTE } from '../config';
import { cargarPartida, curarTodos, partida } from '../estado';
import { irAPaso } from '../flujo';
import { entrada } from '../sistema/entrada';
import { Typewriter } from '../ui/Typewriter';
import { Menu } from '../ui/Menu';

export class GameOverScene extends Phaser.Scene {
  private tw!: Typewriter;
  private menu?: Menu;

  constructor() {
    super('GameOver');
  }

  create() {
    this.menu = undefined;
    const titulo = this.add
      .text(320, 120, 'GAME OVER', { fontFamily: FUENTE, fontSize: '84px', color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: titulo, alpha: 1, duration: 1500 });

    const txt = this.add.text(80, 220, '', { fontFamily: FUENTE, fontSize: '30px', color: '#ffffff', wordWrap: { width: 480 } });
    this.tw = new Typewriter(txt);
    this.time.delayedCall(1600, () => this.tw.iniciar('¡No se rindan!\nNott... Vaal...\n¡Mantengan su DETERMINACIÓN!', 300));
    this.time.delayedCall(4200, () => {
      this.menu = new Menu(this, 250, 380, ['Reintentar', 'Volver al título'], entrada.todos, (i) => this.elegir(i));
    });
  }

  private elegir(i: number) {
    this.menu = undefined;
    if (i === 1) return this.scene.start('Titulo');
    // Se vuelve a como estaba todo al empezar la batalla, con la vida llena
    cargarPartida();
    curarTodos();
    irAPaso(this, partida.paso);
  }

  update(_: number, delta: number) {
    this.tw.update(delta);
    this.menu?.update();
  }
}
