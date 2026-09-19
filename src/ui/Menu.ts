import Phaser from 'phaser';
import { FUENTE } from '../config';
import type { Control } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';

/** Lista vertical de opciones con el corazón como cursor (título, selección, game over). */
export class Menu {
  private textos: Phaser.GameObjects.Text[];
  private cursor: Phaser.GameObjects.Image;
  indice = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    opciones: string[],
    private control: Control,
    private alElegir: (i: number) => void,
    separacion = 44,
  ) {
    this.textos = opciones.map((o, i) =>
      scene.add.text(x, y + i * separacion, o, { fontFamily: FUENTE, fontSize: '34px', color: '#ffffff' }).setOrigin(0, 0.5),
    );
    this.cursor = scene.add.image(x - 26, y, 'corazon').setScale(1.4);
    this.pintar();
  }

  private pintar() {
    this.textos.forEach((t, i) => t.setColor(i === this.indice ? '#ffff00' : '#ffffff'));
    this.cursor.setY(this.textos[this.indice].y);
  }

  update() {
    const n = this.textos.length;
    const antes = this.indice;
    if (this.control.arriba()) this.indice = (this.indice + n - 1) % n;
    if (this.control.abajo()) this.indice = (this.indice + 1) % n;
    if (this.indice !== antes) {
      sfx.mover();
      this.pintar();
    }
    if (this.control.confirmar()) {
      sfx.confirmar();
      this.alElegir(this.indice);
    }
  }

  destruir() {
    this.textos.forEach((t) => t.destroy());
    this.cursor.destroy();
  }
}
