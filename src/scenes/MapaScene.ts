import Phaser from 'phaser';
import { FUENTE } from '../config';
import type { Linea } from '../data/historia';
import { OBJETOS } from '../data/objetos';
import { JUGABLES, type PersonajeId } from '../data/personajes';
import { SALAS, type Interactivo, type Sala, type TipoDeco } from '../data/salas';
import { curarTodos, guardar, jugadores, partida } from '../estado';
import { avanzar } from '../flujo';
import { entrada, type Control } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';
import { claveSprite, escalarAAltura } from '../sistema/texturas';
import { DialogBox } from '../ui/DialogBox';

const VELOCIDAD = 160;
const ALTO_PERSONAJE = 72;
const DISTANCIA_INTERACTUAR = 60;
const TECHO = 96;
const RETRASO_SEGUIDOR = 16;

interface Jugador {
  id: PersonajeId;
  spr: Phaser.Physics.Arcade.Sprite;
  /** null = lo controla el juego (tu pareja en modo 1 jugador). */
  control: Control | null;
}

interface ObjetoMapa {
  def: Interactivo;
  img: Phaser.GameObjects.Image;
  usado: boolean;
}

/** Recorrer una zona: caminar, hablar, recoger regalos, tocar estrellas y encontrar al jefe. */
export class MapaScene extends Phaser.Scene {
  private sala!: Sala;
  private jug: Jugador[] = [];
  private objetos: ObjetoMapa[] = [];
  private solidos: Phaser.GameObjects.Zone[] = [];
  private dlg!: DialogBox;
  private aviso!: Phaser.GameObjects.Image;
  private jefe?: Phaser.GameObjects.Image;
  private bloqueado = true;
  private rastro: { x: number; y: number }[] = [];
  private suelo = 468;

  constructor() {
    super('Mapa');
  }

  init(data: { id: string }) {
    this.sala = SALAS[data.id];
    this.jug = [];
    this.objetos = [];
    this.solidos = [];
    this.rastro = [];
    this.jefe = undefined;
    this.bloqueado = true;
  }

  create() {
    const s = this.sala;
    this.suelo = s.agua ? 400 : 468;

    this.add.tileSprite(0, 0, s.ancho, 480, `suelo-${s.tema}`).setOrigin(0);
    this.add.tileSprite(0, 0, s.ancho, TECHO, `pared-${s.tema}`).setOrigin(0);
    if (s.agua) {
      const agua = this.add.tileSprite(0, 404, s.ancho, 76, 'agua').setOrigin(0);
      this.tweens.add({ targets: agua, tilePositionX: 64, duration: 3000, repeat: -1 });
    }

    this.physics.world.setBounds(8, TECHO - 8, s.ancho - 16, this.suelo - TECHO + 8);
    this.cameras.main.setBounds(0, 0, s.ancho, 480);

    this.crearDecoracion();
    this.crearInteractivos();
    this.crearJefe();
    this.crearJugadores();
    if (s.salida) {
      const flecha = this.add.text(s.salida - 10, 260, '>>', { fontFamily: FUENTE, fontSize: '40px', color: '#ffff00' });
      this.tweens.add({ targets: flecha, x: flecha.x + 10, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    }

    this.aviso = this.add.image(0, 0, 'corazon').setDepth(4000).setVisible(false);
    this.tweens.add({ targets: this.aviso, scale: 1.3, duration: 350, yoyo: true, repeat: -1 });
    this.dlg = new DialogBox(this);

    this.moverCamara();
    this.cameras.main.fadeIn(500);
    if (s.alEntrar) this.time.delayedCall(450, () => this.hablar(s.alEntrar!));
    else this.bloqueado = false;
  }

  // ---------- Construcción ----------

  private agregarSolido(img: Phaser.GameObjects.Image) {
    // La colisión es solo la base del objeto, para poder pasar por detrás
    const w = img.displayWidth * 0.8;
    const h = Math.max(10, img.displayHeight * 0.35);
    const z = this.add.zone(img.x, img.y - h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solidos.push(z);
  }

  private imagen(x: number, y: number, clave: string, escala = 2) {
    return this.add.image(x, y, clave).setOrigin(0.5, 1).setScale(escala).setDepth(y);
  }

  private crearDecoracion() {
    const s = this.sala;
    const rnd = new Phaser.Math.RandomDataGenerator([s.tema, String(s.ancho)]);
    const plano: TipoDeco[] = ['flor', 'orbe'];
    for (const { tipo, cantidad } of s.deco ?? []) {
      for (let i = 0; i < cantidad; i++) {
        const img = this.imagen(rnd.between(30, s.ancho - 30), rnd.between(TECHO + 24, this.suelo - 4), tipo);
        if (plano.includes(tipo)) img.setDepth(1);
        if (tipo === 'orbe') {
          img.setAlpha(0.35).setScale(1.5);
          this.tweens.add({ targets: img, y: img.y - 8, duration: rnd.between(900, 1500), yoyo: true, repeat: -1 });
        }
      }
    }
    for (const { tipo, x, y } of s.solidos ?? []) this.agregarSolido(this.imagen(x, y, tipo));
  }

  private crearInteractivos() {
    for (const def of this.sala.interactivos ?? []) {
      if (def.tipo === 'regalo' && def.clave && partida.recogidos.includes(def.clave)) continue;
      let img: Phaser.GameObjects.Image;
      switch (def.tipo) {
        case 'npc':
          img = escalarAAltura(this.imagen(def.x, def.y, claveSprite(def.actor!)), def.alto ?? 60);
          this.tweens.add({ targets: img, scaleY: img.scaleY * 1.04, duration: 700, yoyo: true, repeat: -1 });
          this.agregarSolido(img);
          break;
        case 'letrero':
          img = this.imagen(def.x, def.y, 'letrero');
          this.agregarSolido(img);
          break;
        case 'estrella':
          img = this.imagen(def.x, def.y, 'estrella').setDepth(def.y);
          this.tweens.add({ targets: img, alpha: 0.5, duration: 600, yoyo: true, repeat: -1 });
          break;
        case 'regalo':
          img = this.imagen(def.x, def.y, 'regalo');
          break;
        case 'recuerdo':
          img = this.imagen(def.x, def.y, 'orbe', 3);
          this.tweens.add({ targets: img, y: def.y - 10, duration: 1000, yoyo: true, repeat: -1 });
          break;
        default:
          img = this.add.image(def.x, def.y, '__WHITE').setVisible(false);
      }
      this.objetos.push({ def, img, usado: false });
    }
  }

  private crearJefe() {
    const j = this.sala.jefe;
    if (!j) return;
    this.jefe = escalarAAltura(this.imagen(j.x, j.y, claveSprite(j.actor)), j.alto);
    this.tweens.add({ targets: this.jefe, y: j.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.agregarSolido(this.jefe);
  }

  private crearJugadores() {
    const controlados = jugadores();
    for (const id of JUGABLES) {
      const { x, y } = this.sala.inicio[id];
      const spr = this.physics.add.sprite(x, y, claveSprite(id)).setOrigin(0.5, 1);
      escalarAAltura(spr, ALTO_PERSONAJE).setCollideWorldBounds(true);
      const { width: w, height: h } = spr.frame;
      spr.body!.setSize(w * 0.6, h * 0.22).setOffset(w * 0.2, h * 0.78);
      const idx = controlados.indexOf(id);
      this.jug.push({ id, spr, control: idx >= 0 ? entrada.jugador(idx) : null });
      this.physics.add.collider(spr, this.solidos);
    }
    // Se miran entre sí al empezar
    const [a, b] = this.jug;
    a.spr.setFlipX(a.spr.x > b.spr.x);
    b.spr.setFlipX(b.spr.x > a.spr.x);
  }

  // ---------- Juego ----------

  private hablar(lineas: Linea[], alTerminar?: () => void) {
    this.bloqueado = true;
    this.dlg.mostrar(lineas, () => {
      this.bloqueado = false;
      alTerminar?.();
    });
  }

  private get controlados() {
    return this.jug.filter((j) => j.control);
  }

  private moverCamara() {
    const xs = this.controlados.map((j) => j.spr.x);
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    this.cameras.main.setScroll(Phaser.Math.Clamp(cx - 320, 0, Math.max(0, this.sala.ancho - 640)), 0);
  }

  update(time: number, delta: number) {
    this.dlg.update(delta);
    for (const j of this.jug) j.spr.setDepth(j.spr.y);

    if (this.bloqueado || this.dlg.activo) {
      for (const j of this.jug) j.spr.setVelocity(0).setAngle(0);
      this.aviso.setVisible(false);
      return;
    }

    for (const j of this.controlados) this.moverJugador(j, time);
    this.moverSeguidor(time);
    this.moverCamara();
    this.limitarAPantalla();

    if (this.revisarEncuentro() || this.revisarJefe() || this.revisarSalida()) return;
    this.revisarInteracciones();
  }

  private moverJugador(j: Jugador, time: number) {
    const { x, y } = j.control!.eje();
    const v = new Phaser.Math.Vector2(x, y).normalize().scale(VELOCIDAD);
    j.spr.setVelocity(v.x, v.y);
    if (x !== 0) j.spr.setFlipX(x < 0);
    j.spr.setAngle(v.lengthSq() > 0 ? Math.sin(time / 70) * 4 : 0);
  }

  /** En modo 1 jugador, tu pareja te sigue (cuando ya están juntos). */
  private moverSeguidor(time: number) {
    const seguidor = this.jug.find((j) => !j.control);
    if (!seguidor || !this.sala.juntos) return;
    const lider = this.controlados[0].spr;
    const ultimo = this.rastro[this.rastro.length - 1];
    if (!ultimo || Phaser.Math.Distance.Between(ultimo.x, ultimo.y, lider.x, lider.y) > 3) {
      this.rastro.push({ x: lider.x, y: lider.y });
      if (this.rastro.length > RETRASO_SEGUIDOR) {
        const p = this.rastro.shift()!;
        seguidor.spr.setFlipX(p.x < seguidor.spr.x);
        seguidor.spr.setPosition(p.x, p.y).setAngle(Math.sin(time / 70) * 4);
        return;
      }
    }
    seguidor.spr.setAngle(0);
  }

  /** En 2 jugadores, nadie puede salirse de la pantalla y dejar atrás al otro. */
  private limitarAPantalla() {
    if (this.controlados.length < 2) return;
    const sx = this.cameras.main.scrollX;
    for (const j of this.controlados) j.spr.x = Phaser.Math.Clamp(j.spr.x, sx + 20, sx + 620);
  }

  private revisarEncuentro() {
    const e = this.sala.encuentro;
    if (!e) return false;
    const [a, b] = this.jug;
    if (Phaser.Math.Distance.Between(a.spr.x, a.spr.y, b.spr.x, b.spr.y) > 70) return false;
    const variante = partida.modo === 2 ? 'dos' : partida.p1;
    this.hablar(e[variante], () => this.terminar());
    return true;
  }

  private revisarJefe() {
    const j = this.sala.jefe;
    if (!j || !this.controlados.some((c) => j.x - c.spr.x < 170)) return false;
    this.cameras.main.flash(200, 255, 255, 255);
    this.hablar(j.lineas, () => this.terminar());
    return true;
  }

  private revisarSalida() {
    const salida = this.sala.salida;
    if (!salida || !this.controlados.some((c) => c.spr.x > salida)) return false;
    this.terminar();
    return true;
  }

  private terminar() {
    this.bloqueado = true;
    // Los HP y regalos quedan guardados para la siguiente zona
    guardar();
    avanzar(this);
  }

  private revisarInteracciones() {
    let cercano: ObjetoMapa | undefined;
    for (const j of this.controlados) {
      const o = this.objetoCercano(j);
      cercano ??= o;
      if (o && j.control!.confirmar()) return this.interactuar(o);
    }
    this.aviso.setVisible(!!cercano);
    if (cercano) this.aviso.setPosition(cercano.img.x, cercano.img.y - cercano.img.displayHeight - 14);
  }

  private objetoCercano(j: Jugador) {
    let mejor: ObjetoMapa | undefined;
    let dist = DISTANCIA_INTERACTUAR;
    for (const o of this.objetos) {
      const d = Phaser.Math.Distance.Between(j.spr.x, j.spr.y - 10, o.img.x, o.img.y - 10);
      if (d < dist) {
        dist = d;
        mejor = o;
      }
    }
    return mejor;
  }

  private interactuar(o: ObjetoMapa) {
    const { def } = o;
    const lineas = o.usado && def.despues ? def.despues : def.lineas;
    o.usado = true;

    if (def.tipo === 'estrella') {
      curarTodos();
      guardar();
      sfx.curar();
    }
    if (def.tipo === 'regalo' && def.objeto && def.clave) {
      partida.inventario.push(def.objeto);
      partida.recogidos.push(def.clave);
      guardar();
      sfx.regalo();
      this.objetos = this.objetos.filter((x) => x !== o);
      o.img.destroy();
      this.aviso.setVisible(false);
      return this.hablar([...lineas, { texto: `(Obtuvieron: ${OBJETOS[def.objeto].nombre}.)` }]);
    }
    this.hablar(lineas);
  }
}
