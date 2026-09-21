import Phaser from 'phaser';
import { FUENTE } from '../config';
import { FINAL } from '../data/historia';
import { borrarPartida } from '../estado';
import { entrada } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';
import { claveSprite, escalarAAltura } from '../sistema/texturas';

/** Velocidad a la que suben la carta y los créditos, en píxeles por segundo. */
const VELOCIDAD_CREDITOS = 32;

const ROSAS = [0xff6fa8, 0xff9ec4, 0xff3d7f, 0xffc2d9];

type Fase = 'mensaje' | 'creditos' | 'fin';

/** "Feliz San Valentín", la dedicatoria y los créditos. */
export class FinalScene extends Phaser.Scene {
  private fase: Fase = 'mensaje';
  private listo = false;
  private mensaje: Phaser.GameObjects.GameObject[] = [];
  private rollo?: Phaser.GameObjects.Container;
  private altoRollo = 0;

  constructor() {
    super('Final');
  }

  create() {
    this.fase = 'mensaje';
    this.listo = false;
    this.rollo = undefined;
    this.cameras.main.fadeIn(1500, 255, 255, 255);

    escalarAAltura(this.add.image(285, 290, claveSprite('nott')).setOrigin(0.5, 1), 100).setDepth(5);
    escalarAAltura(this.add.image(355, 290, claveSprite('vaal')).setOrigin(0.5, 1), 100).setDepth(5).setFlipX(true);
    const corazon = this.add.image(320, 165, 'corazon').setScale(2).setDepth(5);
    this.tweens.add({ targets: corazon, scale: 2.6, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.time.addEvent({ delay: 220, loop: true, callback: () => this.corazonFlotante() });
    this.time.delayedCall(1200, () => this.mostrarMensaje());
  }

  private corazonFlotante() {
    const c = this.add
      .image(Phaser.Math.Between(0, 640), 500, 'corazon-blanco')
      .setTint(Phaser.Utils.Array.GetRandom(ROSAS))
      .setScale(Phaser.Math.FloatBetween(1, 2.5))
      .setAlpha(0.8);
    this.tweens.add({
      targets: c,
      y: -20,
      x: c.x + Phaser.Math.Between(-40, 40),
      alpha: 0,
      duration: Phaser.Math.Between(3000, 5000),
      onComplete: () => c.destroy(),
    });
  }

  private texto(x: number, y: number, t: string, tam: number, color: string) {
    return this.add
      .text(x, y, t, { fontFamily: FUENTE, fontSize: `${tam}px`, color, align: 'center' })
      .setOrigin(0.5, 0)
      .setDepth(6);
  }

  private mostrarMensaje() {
    sfx.victoria();
    const titulo = this.texto(320, 50, FINAL.mensaje, 62, '#ff6fa8').setAlpha(0);
    const dedicatoria = this.texto(320, 320, FINAL.dedicatoria, 30, '#ffffff').setAlpha(0);
    const seguir = this.texto(320, 440, '[ ACEPTAR ]', 22, '#888888').setAlpha(0);
    this.mensaje = [titulo, dedicatoria, seguir];
    this.tweens.chain({
      tweens: [
        { targets: titulo, alpha: 1, duration: 1200 },
        { targets: dedicatoria, alpha: 1, duration: 1200 },
        { targets: seguir, alpha: 1, duration: 600, onComplete: () => (this.listo = true) },
      ],
    });
  }

  private mostrarCreditos() {
    this.fase = 'creditos';
    this.listo = false;
    this.tweens.add({ targets: this.mensaje, alpha: 0, duration: 600 });
    const fondo = this.add.rectangle(0, 0, 640, 480, 0x000000, 0.92).setOrigin(0).setDepth(7).setAlpha(0);
    this.tweens.add({ targets: fondo, alpha: 1, duration: 800 });

    // Primero la carta, después la lista de créditos, todo subiendo junto
    const titulo = this.add
      .text(0, 0, FINAL.tituloCarta, { fontFamily: FUENTE, fontSize: '44px', color: '#ff6fa8' })
      .setOrigin(0.5, 0);
    const carta = this.add
      .text(0, titulo.height + 30, FINAL.carta, {
        fontFamily: FUENTE,
        fontSize: '27px',
        color: '#ffffff',
        align: 'left',
        lineSpacing: 4,
        wordWrap: { width: 540 },
      })
      .setOrigin(0.5, 0);
    const lista = this.add
      .text(0, carta.y + carta.height + 140, FINAL.creditos.join('\n'), {
        fontFamily: FUENTE,
        fontSize: '30px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);
    this.rollo = this.add.container(320, 500, [titulo, carta, lista]).setDepth(8);
    this.altoRollo = lista.y + lista.height;
  }

  private terminarCreditos() {
    this.fase = 'fin';
    this.add
      .text(632, 472, 'ACEPTAR para volver al inicio', { fontFamily: FUENTE, fontSize: '18px', color: '#888888' })
      .setOrigin(1, 1)
      .setDepth(9);
    const fin = this.texto(320, 190, 'FIN', 80, '#ff6fa8').setDepth(8).setAlpha(0);
    this.tweens.add({ targets: fin, alpha: 1, duration: 1200, onComplete: () => (this.listo = true) });
    // La historia terminó: la próxima vez se empieza de nuevo
    borrarPartida();
  }

  update(_: number, delta: number) {
    if (this.fase === 'creditos' && this.rollo) {
      // Sube sola y despacio, para poder leer la carta con calma
      this.rollo.y -= (VELOCIDAD_CREDITOS * delta) / 1000;
      if (this.rollo.y + this.altoRollo < 170) {
        this.rollo.destroy();
        this.rollo = undefined;
        this.terminarCreditos();
      }
      return;
    }
    if (!this.listo || !entrada.todos.confirmar()) return;
    sfx.confirmar();
    if (this.fase === 'mensaje') return this.mostrarCreditos();
    if (this.fase === 'fin') {
      this.listo = false;
      this.cameras.main.fadeOut(900);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Titulo'));
    }
  }
}
