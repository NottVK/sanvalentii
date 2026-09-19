import Phaser from 'phaser';
import { CINEMATICAS, type Fondo, type Linea } from '../data/historia';
import { avanzar } from '../flujo';
import { claveSprite, escalarAAltura, escalarACaja, retratoDisponible } from '../sistema/texturas';
import { DialogBox } from '../ui/DialogBox';

/** Escenas de historia: un fondo dibujado arriba y el diálogo abajo. */
export class CinematicaScene extends Phaser.Scene {
  private id = '';
  private dlg!: DialogBox;
  private fondo?: Phaser.GameObjects.Container;
  private fondoActual?: Fondo;

  constructor() {
    super('Cinematica');
  }

  init(data: { id: string }) {
    this.id = data.id;
    this.fondoActual = undefined;
    this.fondo = undefined;
  }

  create() {
    this.dlg = new DialogBox(this);
    this.cameras.main.fadeIn(600);
    this.time.delayedCall(500, () =>
      this.dlg.mostrar(CINEMATICAS[this.id], () => avanzar(this), (l: Linea) => l.fondo && this.cambiarFondo(l.fondo)),
    );
  }

  private cambiarFondo(f: Fondo) {
    if (f === this.fondoActual) return;
    this.fondoActual = f;
    const viejo = this.fondo;
    if (viejo) this.tweens.add({ targets: viejo, alpha: 0, duration: 500, onComplete: () => viejo.destroy() });
    this.fondo = this.add.container().setAlpha(0).setDepth(f === 'luz' ? 10 : 0);
    this.tweens.add({ targets: this.fondo, alpha: 1, duration: 600 });
    this.dibujar(f, this.fondo);
  }

  private dibujar(f: Fondo, c: Phaser.GameObjects.Container) {
    const g = this.add.graphics();
    c.add(g);
    const persona = (id: 'nott' | 'vaal', x: number, y: number, alto: number, flip = false) =>
      c.add(escalarAAltura(this.add.image(x, y, claveSprite(id)).setOrigin(0.5, 1), alto).setFlipX(flip));

    switch (f) {
      case 'noche': {
        g.fillStyle(0x0b0b22).fillRect(0, 0, 640, 320);
        // ventana con luna
        g.fillStyle(0x1c1c48).fillRect(440, 40, 120, 100);
        g.fillStyle(0xf6f0c8).fillCircle(520, 80, 22);
        g.fillStyle(0x1c1c48).fillCircle(510, 74, 18);
        g.lineStyle(4, 0x3a2a4a).strokeRect(440, 40, 120, 100).lineBetween(500, 40, 500, 140);
        // cama
        g.fillStyle(0x4a3a5a).fillRect(140, 210, 300, 70);
        g.fillStyle(0x7a5aa0).fillRect(150, 196, 280, 40);
        g.fillStyle(0xe6e0f0).fillRect(150, 190, 60, 20).fillRect(370, 190, 60, 20);
        persona('nott', 260, 240, 90, true);
        persona('vaal', 330, 240, 90);
        break;
      }
      case 'sombra': {
        g.fillStyle(0x000000).fillRect(0, 0, 640, 320);
        const ojo = escalarACaja(this.add.image(320, 160, retratoDisponible(this, 'olvido')), 240).setAlpha(0.8);
        c.add(ojo);
        this.tweens.add({ targets: ojo, scale: ojo.scale * 1.08, duration: 900, yoyo: true, repeat: -1 });
        break;
      }
      case 'subsuelo':
      case 'derrumbe': {
        g.fillStyle(f === 'derrumbe' ? 0x1a0d14 : 0x150d24).fillRect(0, 0, 640, 320);
        for (let i = 0; i < 40; i++) {
          const p = this.add.rectangle(
            Phaser.Math.Between(0, 640),
            Phaser.Math.Between(0, 320),
            3,
            3,
            f === 'derrumbe' ? 0x8a8a98 : 0xb48aff,
          );
          c.add(p);
          this.tweens.add({
            targets: p,
            y: f === 'derrumbe' ? p.y + 340 : p.y - 60,
            alpha: 0,
            duration: Phaser.Math.Between(1500, 3500),
            repeat: -1,
          });
        }
        persona('nott', 290, 290, 80);
        persona('vaal', 350, 290, 80, true);
        if (f === 'derrumbe') this.time.addEvent({ delay: 1400, loop: true, callback: () => this.cameras.main.shake(250, 0.006) });
        break;
      }
      case 'luz': {
        g.fillStyle(0xffffff).fillRect(0, 0, 640, 480);
        break;
      }
      case 'manana': {
        g.fillStyle(0xffd9a0).fillRect(0, 0, 640, 320);
        g.fillStyle(0xbfe6ff).fillRect(440, 40, 120, 100);
        g.fillStyle(0xfff3a0).fillCircle(520, 90, 24);
        g.lineStyle(4, 0xa07850).strokeRect(440, 40, 120, 100).lineBetween(500, 40, 500, 140);
        g.fillStyle(0xa07850).fillRect(140, 210, 300, 70);
        g.fillStyle(0xff9ec4).fillRect(150, 196, 280, 40);
        g.fillStyle(0xffffff).fillRect(150, 190, 60, 20).fillRect(370, 190, 60, 20);
        persona('nott', 275, 240, 90);
        persona('vaal', 315, 240, 90, true);
        const corazon = this.add.image(295, 130, 'corazon').setScale(2);
        c.add(corazon);
        this.tweens.add({ targets: corazon, y: 120, duration: 700, yoyo: true, repeat: -1 });
        break;
      }
      case 'negro':
        g.fillStyle(0x000000).fillRect(0, 0, 640, 320);
        break;
    }
  }

  update(_: number, delta: number) {
    this.dlg.update(delta);
  }
}
