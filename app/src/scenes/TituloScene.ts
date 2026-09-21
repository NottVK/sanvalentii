import Phaser from 'phaser';
import { FUENTE } from '../config';
import { SUBTITULO, TITULO } from '../data/historia';
import { ELENCO } from '../data/personajes';
import { cargarPartida, hayPartida, jugadores, partida } from '../estado';
import { irAPaso } from '../flujo';
import { entrada } from '../sistema/entrada';
import { claveSprite, escalarAAltura } from '../sistema/texturas';
import { Menu } from '../ui/Menu';
import { montarTactil } from '../ui/tactil';

export class TituloScene extends Phaser.Scene {
  private menu?: Menu;

  constructor() {
    super('Titulo');
  }

  create() {
    entrada.configurar(1);
    montarTactil(1);

    this.add.text(320, 100, TITULO, { fontFamily: FUENTE, fontSize: '72px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(320, 152, SUBTITULO, { fontFamily: FUENTE, fontSize: '24px', color: '#aaaaaa' }).setOrigin(0.5);

    escalarAAltura(this.add.image(250, 270, claveSprite('nott')), 84);
    escalarAAltura(this.add.image(390, 270, claveSprite('vaal')), 84).setFlipX(true);
    const corazon = this.add.image(320, 240, 'corazon').setScale(2.5);
    this.tweens.add({ targets: corazon, scale: 3, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const opciones = ['Nuevo juego'];
    if (hayPartida()) opciones.push('Continuar');
    this.menu = new Menu(this, 250, 360, opciones, entrada.todos, (i) => (i === 0 ? this.nuevo() : this.continuar()));

    this.cameras.main.fadeIn(600);
  }

  private nuevo() {
    this.menu = undefined;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Seleccion'));
  }

  private continuar() {
    this.menu = undefined;
    if (!cargarPartida()) return this.nuevo();
    entrada.configurar(partida.modo);
    montarTactil(partida.modo, jugadores().map((id) => ELENCO[id].nombre));
    irAPaso(this, partida.paso);
  }

  update() {
    this.menu?.update();
  }
}
