import Phaser from 'phaser';
import { FUENTE } from '../config';
import { partida } from '../estado';
import type { Linea } from '../data/historia';
import { ELENCO } from '../data/personajes';
import { entrada } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';
import { escalarACaja, retratoDisponible } from '../sistema/texturas';
import { Typewriter } from './Typewriter';

const X = 24;
const Y = 324;
const W = 592;
const H = 136;
const RETRATO = 108;
const VOZ_NARRADOR = 300;

/** Caja de diálogo estilo Undertale: retrato a la izquierda, nombre y texto letra por letra. */
export class DialogBox {
  activo = false;
  private cont: Phaser.GameObjects.Container;
  private retrato: Phaser.GameObjects.Image;
  private nombre: Phaser.GameObjects.Text;
  private txt: Phaser.GameObjects.Text;
  private tw: Typewriter;
  private cola: Linea[] = [];
  private alTerminar?: () => void;
  private alCambiar?: (l: Linea) => void;

  constructor(private scene: Phaser.Scene) {
    const g = scene.add.graphics();
    g.fillStyle(0x000000).fillRect(X, Y, W, H);
    g.lineStyle(6, 0xffffff).strokeRect(X + 3, Y + 3, W - 6, H - 6);
    this.retrato = scene.add.image(X + 70, Y + H / 2, '__WHITE');
    this.nombre = scene.add.text(0, Y + 12, '', { fontFamily: FUENTE, fontSize: '22px', color: '#ffd84a' });
    this.txt = scene.add.text(0, Y + 36, '', { fontFamily: FUENTE, fontSize: '28px', color: '#ffffff', lineSpacing: 0 });
    this.tw = new Typewriter(this.txt);
    this.cont = scene.add
      .container(0, 0, [g, this.retrato, this.nombre, this.txt])
      .setDepth(5000)
      .setScrollFactor(0)
      .setVisible(false);
  }

  /** Muestra las líneas (filtradas según 1 o 2 jugadores) y llama a `alTerminar` al acabar. */
  mostrar(lineas: Linea[], alTerminar?: () => void, alCambiar?: (l: Linea) => void) {
    this.cola = lineas.filter((l) => !l.solo || l.solo === partida.modo);
    this.alTerminar = alTerminar;
    this.alCambiar = alCambiar;
    this.activo = true;
    this.cont.setVisible(true);
    this.siguiente();
  }

  private siguiente() {
    const linea = this.cola.shift();
    if (!linea) {
      this.activo = false;
      this.cont.setVisible(false);
      const cb = this.alTerminar;
      this.alTerminar = undefined;
      cb?.();
      return;
    }
    this.alCambiar?.(linea);
    if (linea.temblor) {
      this.scene.cameras.main.shake(400, 0.01);
      sfx.temblor();
    }
    if (linea.quien) {
      this.retrato.setTexture(retratoDisponible(this.scene, linea.quien, linea.exp)).setVisible(true);
      escalarACaja(this.retrato, RETRATO);
      this.nombre.setText(ELENCO[linea.quien].nombre).setX(X + 140);
      this.txt.setX(X + 140).setY(Y + 36).setWordWrapWidth(W - 165);
    } else {
      this.retrato.setVisible(false);
      this.nombre.setText('');
      this.txt.setX(X + 28).setY(Y + 20).setWordWrapWidth(W - 56);
    }
    this.tw.iniciar(`* ${linea.texto}`, linea.quien ? ELENCO[linea.quien].voz : VOZ_NARRADOR);
  }

  update(delta: number) {
    if (!this.activo) return;
    this.tw.update(delta);
    if (entrada.todos.confirmar()) {
      if (this.tw.terminado) this.siguiente();
      else this.tw.saltar();
    } else if (entrada.todos.cancelar()) {
      this.tw.saltar();
    }
  }
}
