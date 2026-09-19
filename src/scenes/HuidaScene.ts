import Phaser from 'phaser';
import { FUENTE } from '../config';
import type { Linea } from '../data/historia';
import { JUGABLES, type PersonajeId } from '../data/personajes';
import { jugadores } from '../estado';
import { avanzar } from '../flujo';
import { entrada, type Control } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';
import { claveSprite, escalarAAltura } from '../sistema/texturas';
import { DialogBox } from '../ui/DialogBox';

const ANCHO = 2600;
const TECHO = 96;
const VELOCIDAD = 175;
const AVANCE_CAMARA = 80;

const INICIO: Linea[] = [
  { temblor: true, texto: '¡El techo se está cayendo!' },
  { quien: 'petalo', texto: '¡Sigan hacia la derecha y esquiven las rocas! ¡No se detengan!' },
];

interface Corredor {
  id: PersonajeId;
  spr: Phaser.GameObjects.Image;
  control: Control | null;
  aturdido: number;
}

/** El escape: la pantalla avanza sola, caen rocas y hay que llegar a la luz. */
export class HuidaScene extends Phaser.Scene {
  private dlg!: DialogBox;
  private corredores: Corredor[] = [];
  private corriendo = false;
  private terminado = false;
  private rastro: { x: number; y: number }[] = [];
  private progreso!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Huida');
  }

  create() {
    this.corredores = [];
    this.rastro = [];
    this.corriendo = false;
    this.terminado = false;

    this.add.tileSprite(0, 0, ANCHO, 480, 'suelo-torre').setOrigin(0);
    this.add.tileSprite(0, 0, ANCHO, TECHO, 'pared-torre').setOrigin(0);
    // La salida: luz al final del túnel
    const luz = this.add.graphics();
    for (let i = 0; i < 8; i++) luz.fillStyle(0xfff6d0, 0.12 * (i + 1)).fillRect(ANCHO - 200 + i * 25, 0, 200 - i * 25, 480);
    this.add.text(ANCHO - 170, 220, 'SALIDA', { fontFamily: FUENTE, fontSize: '40px', color: '#553300' });

    const controlados = jugadores();
    for (const id of JUGABLES) {
      const idx = controlados.indexOf(id);
      const spr = escalarAAltura(this.add.image(100, id === 'nott' ? 260 : 340, claveSprite(id)).setOrigin(0.5, 1), 72);
      this.corredores.push({ id, spr, control: idx >= 0 ? entrada.jugador(idx) : null, aturdido: 0 });
    }

    // Polvo que cae del techo
    this.add
      .particles(0, 0, 'bloque', {
        x: { min: 0, max: 640 },
        y: -10,
        speedY: { min: 80, max: 200 },
        scale: { min: 0.2, max: 0.5 },
        tint: 0x8a8a98,
        lifespan: 3000,
        frequency: 60,
      })
      .setScrollFactor(0)
      .setDepth(900);

    // Aviso y barra de progreso hacia la salida
    const aviso = this.add
      .text(320, 20, '¡CORRAN!  >>', { fontFamily: FUENTE, fontSize: '34px', color: '#ffff00', stroke: '#000000', strokeThickness: 6 })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1000);
    this.tweens.add({ targets: aviso, scale: 1.1, duration: 300, yoyo: true, repeat: -1 });
    this.progreso = this.add.graphics().setScrollFactor(0).setDepth(1000);

    this.cameras.main.setBounds(0, 0, ANCHO, 480);
    this.cameras.main.fadeIn(400);
    this.dlg = new DialogBox(this);
    this.time.delayedCall(400, () => this.dlg.mostrar(INICIO, () => this.empezar()));
  }

  private empezar() {
    this.corriendo = true;
    this.time.addEvent({ delay: 520, loop: true, callback: () => this.corriendo && this.caerRoca() });
    this.time.addEvent({ delay: 2200, loop: true, callback: () => this.corriendo && this.cameras.main.shake(300, 0.004) });
  }

  private caerRoca() {
    const sx = this.cameras.main.scrollX;
    const x = Phaser.Math.Between(sx + 160, sx + 620);
    const y = Phaser.Math.Between(TECHO + 40, 460);
    const sombra = this.add.image(x, y, 'sombra-suelo').setScale(0.3).setDepth(1);
    const roca = this.add.image(x, y - 400, 'roca').setScale(2).setOrigin(0.5, 1).setDepth(y);
    this.tweens.add({ targets: sombra, scale: 1.2, duration: 750 });
    this.tweens.add({
      targets: roca,
      y,
      duration: 750,
      ease: 'Quad.in',
      onComplete: () => {
        sfx.golpe();
        for (const c of this.corredores) {
          if (c.control && c.aturdido <= 0 && Math.abs(c.spr.x - x) < 30 && Math.abs(c.spr.y - y) < 20) this.aturdir(c);
        }
        this.tweens.add({ targets: [roca, sombra], alpha: 0, delay: 250, duration: 300, onComplete: () => (roca.destroy(), sombra.destroy()) });
      },
    });
  }

  private aturdir(c: Corredor) {
    c.aturdido = 700;
    sfx.dano();
    c.spr.setTint(0xff6666);
    this.tweens.add({ targets: c.spr, angle: 360, duration: 500, onComplete: () => c.spr.clearTint().setAngle(0) });
  }

  update(time: number, delta: number) {
    this.dlg.update(delta);
    for (const c of this.corredores) c.spr.setDepth(c.spr.y);
    if (!this.corriendo || this.terminado) return;

    const dt = delta / 1000;
    const cam = this.cameras.main;
    cam.setScroll(Math.min(ANCHO - 640, cam.scrollX + AVANCE_CAMARA * dt), 0);
    const sx = cam.scrollX;

    const controlados = this.corredores.filter((c) => c.control);
    for (const c of controlados) {
      c.aturdido -= delta;
      if (c.aturdido > 0) continue;
      const e = c.control!.eje();
      const v = new Phaser.Math.Vector2(e.x, e.y).normalize().scale(VELOCIDAD * dt);
      c.spr.x += v.x;
      c.spr.y = Phaser.Math.Clamp(c.spr.y + v.y, TECHO + 30, 470);
      if (e.x !== 0) c.spr.setFlipX(e.x < 0);
      if (c.spr.angle === 0 || v.lengthSq() > 0) c.spr.setAngle(v.lengthSq() > 0 ? Math.sin(time / 60) * 5 : 0);
      // La pantalla te empuja si te quedas atrás
      c.spr.x = Phaser.Math.Clamp(c.spr.x, sx + 20, Math.min(sx + 620, ANCHO - 20));
    }

    // En 1 jugador, tu pareja corre detrás de ti
    const seguidor = this.corredores.find((c) => !c.control);
    if (seguidor) {
      const lider = controlados[0].spr;
      this.rastro.push({ x: lider.x, y: lider.y });
      if (this.rastro.length > 14) {
        const p = this.rastro.shift()!;
        seguidor.spr.setPosition(Math.max(p.x, sx + 20), p.y).setFlipX(p.x < seguidor.spr.x);
      }
    }

    const avance = Math.max(...controlados.map((c) => c.spr.x)) / (ANCHO - 140);
    this.progreso.clear().fillStyle(0x333333).fillRect(170, 62, 300, 10).fillStyle(0xffff00).fillRect(170, 62, 300 * Math.min(1, avance), 10);

    if (controlados.some((c) => c.spr.x > ANCHO - 140)) {
      this.terminado = true;
      this.cameras.main.flash(600, 255, 255, 255);
      avanzar(this, true);
    }
  }
}
