import Phaser from 'phaser';
import { FUENTE } from '../config';
import { APOYO, BATALLAS, type AccionBatalla, type DefBatalla, type Patron } from '../data/batallas';
import { ajustesDe, type Ajustes } from '../data/dificultad';
import { OBJETOS, type Objeto } from '../data/objetos';
import { ELENCO, pareja, type Expresion, type PersonajeId } from '../data/personajes';
import { HP_MAX, guardar, jugadores, partida } from '../estado';
import { avanzar } from '../flujo';
import { entrada, type Control } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';
import { escalarACaja, retratoDisponible } from '../sistema/texturas';
import { Typewriter } from '../ui/Typewriter';

type Estado = 'menu' | 'submenu' | 'texto' | 'apuntar' | 'transicion' | 'ataque' | 'fin';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Opcion {
  texto: string;
  color?: string;
  accion: () => void;
}
interface Miembro {
  id: PersonajeId;
  control: Control;
  hp: number;
  alma: Phaser.GameObjects.Image;
  invulnerable: number;
  caido: boolean;
}
interface Bala {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  /** Colisión rectangular (muros, enredaderas) en vez de circular. */
  rect?: boolean;
  cura?: boolean;
  inofensiva?: boolean;
  /** Si tiene `act`, la bala se mueve sola y desaparece cuando `vida` llega a 0. */
  act?: (b: Bala, dt: number) => void;
  t: number;
  vida?: number;
}

const CAJA_MENU: Rect = { x: 32, y: 250, w: 576, h: 140 };
const BOTONES = ['LUCHAR', 'ACTUAR', 'OBJETO', 'PIEDAD'];
const BOTON_Y = 426;
const BOTON_W = 132;
const BOTON_H = 44;
const botonX = (i: number) => 30 + i * 148;

const PIEDAD_MAX = 100;
const DANO_BASE = 22;
const DURACION_ATAQUE = 6000;
const VELOCIDAD_ALMA = 150;
const VOZ_NARRADOR = 300;
const NARANJA = 0xff8c00;
const AMARILLO = 0xffff00;
const ESTILO = { fontFamily: FUENTE, fontSize: '30px', color: '#ffffff' };
const ANCHO_PATRON: Partial<Record<Patron, number>> = { muros: 300, espiral: 260, apuntado: 240 };
/** Hacia dónde apunta cada textura de bala (para girarla en la dirección en que se mueve). */
const ORIENTACION: Record<string, number> = { espina: -Math.PI / 2, flecha: 0 };

const aleatorio = <T,>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)];

/** Batalla estilo Undertale para 1 o 2 almas: LUCHAR, ACTUAR, OBJETO, PIEDAD y esquivar. */
export class BatallaScene extends Phaser.Scene {
  private def!: DefBatalla;
  /** Multiplicadores del nivel de dificultad elegido. */
  private aj!: Ajustes;
  /** Vida y daño ya ajustados a la dificultad. */
  private hpMaxEnemigo = 0;
  private dano = 0;
  private estado: Estado = 'menu';
  private miembros: Miembro[] = [];
  private actor = 0;
  private boton = 0;
  private opcion = 0;
  private opciones: Opcion[] = [];
  private txtOpciones: Phaser.GameObjects.Text[] = [];

  private caja: Rect = { ...CAJA_MENU };
  private gCaja!: Phaser.GameObjects.Graphics;
  private gMascara!: Phaser.GameObjects.Graphics;
  private mascara!: Phaser.Display.Masks.GeometryMask;
  private gApuntar!: Phaser.GameObjects.Graphics;
  private txtCaja!: Phaser.GameObjects.Text;
  private tw!: Typewriter;
  private cola: string[] = [];
  private alTerminarTexto?: () => void;

  private gBotones!: Phaser.GameObjects.Graphics;
  private txtBotones: Phaser.GameObjects.Text[] = [];
  private gStats!: Phaser.GameObjects.Graphics;
  private txtStats: { nombre: Phaser.GameObjects.Text; etiqueta: Phaser.GameObjects.Text; hp: Phaser.GameObjects.Text }[] = [];
  private cursor!: Phaser.GameObjects.Image;
  private enemigo!: Phaser.GameObjects.Image;
  private globo!: Phaser.GameObjects.Container;
  private globoTxt!: Phaser.GameObjects.Text;

  private hpEnemigo = 0;
  private hpVisual = 0;
  private piedad = 0;
  private piedadVisual = 0;
  private fase2 = false;
  private fase2Pendiente = false;
  private respuesta?: string;
  private balas: Bala[] = [];
  /** Ataques activos en este turno (el jefe final puede lanzar varios a la vez). */
  private activos: { patron: Patron; proxima: number }[] = [];
  private tiempoAtaque = 0;
  private angulo = 0;
  private giro = 1;
  private turno = 0;
  private barraX = 0;

  constructor() {
    super('Batalla');
  }

  init(data: { id: string }) {
    this.def = BATALLAS[data.id];
    this.aj = ajustesDe(partida.dificultad, !!this.def.jefeFinal);
    this.hpMaxEnemigo = Math.round(this.def.hp * this.aj.vida);
    this.dano = Math.max(1, Math.round(this.def.ataque * this.aj.dano));
    Object.assign(this, {
      estado: 'menu', miembros: [], actor: 0, boton: 0, opciones: [], txtOpciones: [], txtBotones: [], txtStats: [],
      caja: { ...CAJA_MENU }, cola: [], hpEnemigo: this.hpMaxEnemigo, hpVisual: this.hpMaxEnemigo, piedad: 0, piedadVisual: 0,
      fase2: false, fase2Pendiente: false, respuesta: undefined, balas: [], turno: 0,
    });
  }

  create() {
    this.cameras.main.fadeIn(300);
    const d = this.def;

    this.enemigo = this.add.image(320, 125, retratoDisponible(this, d.enemigo));
    escalarACaja(this.enemigo, d.tamano);
    this.tweens.add({ targets: this.enemigo, y: 117, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(20, 6, ELENCO[d.enemigo].nombre.toUpperCase(), { ...ESTILO, fontSize: '24px', color: '#ffd84a' });
    if (d.hp > 0) this.add.text(20, 32, 'HP', { ...ESTILO, fontSize: '22px' });
    this.add.text(20, d.hp > 0 ? 54 : 32, d.etiqueta, { ...ESTILO, fontSize: '22px', color: '#ff6fa8' });
    this.gStats = this.add.graphics();

    const fondoGlobo = this.add.graphics();
    fondoGlobo.fillStyle(0xffffff).fillRoundedRect(0, 0, 200, 100, 10).fillTriangle(0, 38, -16, 48, 0, 58);
    this.globoTxt = this.add.text(10, 8, '', { ...ESTILO, fontSize: '22px', color: '#000000', wordWrap: { width: 182 } });
    this.globo = this.add.container(420, 50, [fondoGlobo, this.globoTxt]).setVisible(false).setDepth(20);

    this.gCaja = this.add.graphics();
    this.gMascara = this.make.graphics({}, false);
    this.mascara = this.gMascara.createGeometryMask();
    this.gApuntar = this.add.graphics().setDepth(5);
    this.txtCaja = this.add.text(CAJA_MENU.x + 24, CAJA_MENU.y + 16, '', {
      ...ESTILO,
      wordWrap: { width: CAJA_MENU.w - 48 },
      lineSpacing: 0,
    });
    this.tw = new Typewriter(this.txtCaja);

    jugadores().forEach((id, i) => {
      this.miembros.push({
        id,
        control: entrada.jugador(i),
        hp: Math.max(1, partida.hp[id]),
        alma: this.add.image(0, 0, 'corazon-blanco').setTint(ELENCO[id].alma!).setDepth(10).setVisible(false),
        invulnerable: 0,
        caido: false,
      });
      const x = 32 + i * 300;
      this.txtStats.push({
        nombre: this.add.text(x, 392, ELENCO[id].nombre.toUpperCase(), { ...ESTILO, fontSize: '24px' }),
        etiqueta: this.add.text(x + 64, 395, 'HP', { ...ESTILO, fontSize: '20px' }),
        hp: this.add.text(x + 196, 392, '', { ...ESTILO, fontSize: '24px' }),
      });
    });

    this.gBotones = this.add.graphics();
    BOTONES.forEach((b, i) =>
      this.txtBotones.push(
        this.add.text(botonX(i) + BOTON_W / 2 + 10, BOTON_Y + BOTON_H / 2, b, { ...ESTILO, fontSize: '28px' }).setOrigin(0.5),
      ),
    );
    this.cursor = this.add.image(0, 0, 'corazon-blanco').setScale(1.2).setDepth(10);

    this.dibujarCaja();
    this.volverAlMenu(d.inicio);
  }

  update(_: number, delta: number) {
    this.tw.update(delta);
    const k = Math.min(1, delta / 150);
    this.piedadVisual += (this.piedad - this.piedadVisual) * k;
    this.hpVisual += (this.hpEnemigo - this.hpVisual) * k;
    this.dibujarStats();

    switch (this.estado) {
      case 'menu':
        return this.updateMenu();
      case 'submenu':
        return this.updateSubmenu();
      case 'texto':
        return this.updateTexto();
      case 'apuntar':
        return this.updateApuntar(delta);
      case 'ataque':
        return this.updateAtaque(delta);
    }
  }

  // ---------- Utilidades ----------

  private get actual() {
    return this.miembros[this.actor];
  }

  /** Reemplaza {actor} y {pareja} por los nombres. */
  private fmt(texto: string) {
    const id = this.actual?.id ?? partida.p1;
    return texto.replaceAll('{actor}', ELENCO[id].nombre).replaceAll('{pareja}', ELENCO[pareja(id)].nombre);
  }

  private get vivos() {
    return this.miembros.filter((m) => !m.caido);
  }

  private get piedadLlena() {
    return this.piedad >= PIEDAD_MAX;
  }

  // ---------- Dibujo ----------

  private dibujarCaja() {
    const { x, y, w, h } = this.caja;
    this.gCaja.clear().fillStyle(0x000000).fillRect(x, y, w, h).lineStyle(5, 0xffffff).strokeRect(x, y, w, h);
    this.gMascara.clear().fillStyle(0xffffff).fillRect(x + 3, y + 3, w - 6, h - 6);
  }

  private dibujarStats() {
    const g = this.gStats.clear();
    const d = this.def;
    const barra = (y: number, valor: number, color: number, fondo: number) => {
      g.fillStyle(fondo).fillRect(110, y, 120, 12);
      g.fillStyle(color).fillRect(110, y, Math.max(0, valor) * 120, 12);
      g.lineStyle(2, 0xffffff).strokeRect(110, y, 120, 12);
    };
    if (d.hp > 0) barra(40, this.hpVisual / this.hpMaxEnemigo, 0x44dd44, 0x662222);
    barra(d.hp > 0 ? 62 : 40, this.piedadVisual / PIEDAD_MAX, this.piedadLlena ? AMARILLO : 0xff6fa8, 0x552233);

    const conTurno = this.miembros.length > 1 && ['menu', 'submenu', 'texto', 'apuntar'].includes(this.estado);
    this.miembros.forEach((m, i) => {
      const x = 32 + i * 300;
      g.fillStyle(0xff0000).fillRect(x + 96, 399, HP_MAX * 3, 18);
      g.fillStyle(AMARILLO).fillRect(x + 96, 399, m.hp * 3, 18);
      const t = this.txtStats[i];
      t.nombre.setColor(m.caido ? '#666666' : conTurno && i === this.actor ? '#ffff00' : '#ffffff');
      t.hp.setText(m.caido ? 'CAÍDO' : `${m.hp}/${HP_MAX}`);
    });
  }

  private dibujarBotones() {
    const g = this.gBotones.clear();
    const conSeleccion = this.estado === 'menu' || this.estado === 'submenu';
    BOTONES.forEach((_, i) => {
      const color = conSeleccion && i === this.boton ? AMARILLO : NARANJA;
      g.lineStyle(3, color).strokeRect(botonX(i), BOTON_Y, BOTON_W, BOTON_H);
      this.txtBotones[i].setColor(Phaser.Display.Color.IntegerToColor(color).rgba);
    });
  }

  private cambiarExpresion(exp?: Expresion) {
    if (!exp) return;
    this.enemigo.setTexture(retratoDisponible(this, this.def.enemigo, exp));
    escalarACaja(this.enemigo, this.def.tamano);
  }

  private tweenCaja(destino: Rect, alTerminar: () => void) {
    this.tweens.add({
      targets: this.caja,
      ...destino,
      duration: 350,
      ease: 'Quad.inOut',
      onUpdate: () => this.dibujarCaja(),
      onComplete: () => {
        this.dibujarCaja();
        alTerminar();
      },
    });
  }

  // ---------- Menú ----------

  private textoMenu() {
    return this.piedadLlena ? this.def.textoLleno : aleatorio(this.def.textosMenu);
  }

  private volverAlMenu(texto: string) {
    this.estado = 'menu';
    this.limpiarOpciones();
    this.txtCaja.setVisible(true);
    this.tw.iniciar(`* ${this.fmt(texto)}`, VOZ_NARRADOR);
    this.cursor.setVisible(true).setTint(ELENCO[this.actual.id].alma!);
    this.moverCursorABoton();
    this.dibujarBotones();
  }

  private moverCursorABoton() {
    this.cursor.setPosition(botonX(this.boton) + 20, BOTON_Y + BOTON_H / 2);
  }

  private updateMenu() {
    const c = this.actual.control;
    const antes = this.boton;
    if (c.izquierda()) this.boton = (this.boton + 3) % 4;
    if (c.derecha()) this.boton = (this.boton + 1) % 4;
    if (this.boton !== antes) {
      sfx.mover();
      this.moverCursorABoton();
      this.dibujarBotones();
    }
    if (c.confirmar()) {
      sfx.confirmar();
      this.abrirBoton();
    }
  }

  private abrirBoton() {
    const d = this.def;
    switch (this.boton) {
      case 0:
        return this.abrirSubmenu([
          {
            texto: ELENCO[d.enemigo].nombre,
            accion: () => (d.hp > 0 ? this.iniciarApuntar() : this.reaccionar(d.luchar!)),
          },
        ]);
      case 1:
        return this.abrirSubmenu(d.acciones.map((a) => ({ texto: a.nombre, accion: () => this.reaccionar(a) })));
      case 2:
        if (!partida.inventario.length) return this.narrar(['No les quedan objetos.'], () => this.volverAlMenu(this.textoMenu()));
        return this.abrirSubmenu(
          partida.inventario.slice(0, 6).map((id, i) => ({ texto: OBJETOS[id].nombre, accion: () => this.usarObjeto(i) })),
        );
      case 3:
        return this.abrirSubmenu([
          { texto: 'Perdonar', color: this.piedadLlena ? '#ffff00' : undefined, accion: () => this.perdonar() },
          { texto: 'Huir', accion: () => this.narrar(d.huir ?? ['¡No pueden huir!'], () => this.siguienteActor()) },
        ]);
    }
  }

  // ---------- Submenú en dos columnas ----------

  private posOpcion(i: number) {
    return { x: this.caja.x + 64 + (i % 2) * 260, y: this.caja.y + 16 + Math.floor(i / 2) * 40 };
  }

  private abrirSubmenu(opciones: Opcion[]) {
    this.estado = 'submenu';
    this.opciones = opciones;
    this.opcion = 0;
    this.txtCaja.setVisible(false);
    this.txtOpciones = opciones.map((o, i) => {
      const { x, y } = this.posOpcion(i);
      return this.add.text(x, y, `* ${o.texto}`, { ...ESTILO, color: o.color ?? '#ffffff' });
    });
    this.moverCursorAOpcion();
  }

  private moverCursorAOpcion() {
    const { x, y } = this.posOpcion(this.opcion);
    this.cursor.setPosition(x - 22, y + 17);
  }

  private limpiarOpciones() {
    this.txtOpciones.forEach((t) => t.destroy());
    this.txtOpciones = [];
  }

  private updateSubmenu() {
    const c = this.actual.control;
    const n = this.opciones.length;
    const i = this.opcion;
    let nueva = i;
    if (c.izquierda() && i % 2 === 1) nueva = i - 1;
    if (c.derecha() && i % 2 === 0 && i + 1 < n) nueva = i + 1;
    if (c.arriba() && i - 2 >= 0) nueva = i - 2;
    if (c.abajo() && i + 2 < n) nueva = i + 2;
    if (nueva !== i) {
      this.opcion = nueva;
      sfx.mover();
      this.moverCursorAOpcion();
    }
    if (c.confirmar()) {
      sfx.confirmar();
      const elegida = this.opciones[this.opcion];
      this.limpiarOpciones();
      elegida.accion();
    } else if (c.cancelar()) {
      this.volverAlMenu(this.textoMenu());
    }
  }

  // ---------- Texto narrado ----------

  private narrar(lineas: string[], alTerminar: () => void) {
    this.estado = 'texto';
    this.cola = lineas.map((l) => this.fmt(l));
    this.alTerminarTexto = alTerminar;
    this.cursor.setVisible(false);
    this.txtCaja.setVisible(true);
    this.dibujarBotones();
    this.siguienteTexto();
  }

  private siguienteTexto() {
    const linea = this.cola.shift();
    if (linea === undefined) return this.alTerminarTexto?.();
    this.tw.iniciar(`* ${linea}`, VOZ_NARRADOR);
  }

  private updateTexto() {
    if (entrada.todos.confirmar()) {
      if (this.tw.terminado) this.siguienteTexto();
      else this.tw.saltar();
    } else if (entrada.todos.cancelar()) {
      this.tw.saltar();
    }
  }

  // ---------- Turnos ----------

  /** Pasa al siguiente jugador; cuando ya actuaron todos, ataca el enemigo. */
  private siguienteActor() {
    if (this.def.hp > 0 && this.hpEnemigo <= 0) return this.ganar(false);
    if (this.fase2Pendiente) {
      this.fase2Pendiente = false;
      this.enemigo.setTint(0xffaaaa);
      return this.narrar(this.def.fase2!.dialogo, () => this.siguienteActor());
    }
    let i = this.actor + 1;
    while (i < this.miembros.length && this.miembros[i].caido) i++;
    if (i < this.miembros.length) {
      this.actor = i;
      this.volverAlMenu(this.textoMenu());
    } else {
      this.turnoEnemigo();
    }
  }

  /** En 1 jugador, a veces tu pareja te ayuda. */
  private conApoyo(lineas: string[]) {
    if (this.miembros.length > 1 || this.def.hp === 0 || Math.random() > 0.4) return lineas;
    const a = aleatorio(APOYO[pareja(this.actual.id)]);
    if (a.cura) this.actual.hp = Math.min(HP_MAX, this.actual.hp + a.cura);
    return [...lineas, a.texto];
  }

  private reaccionar(a: AccionBatalla) {
    const antes = this.piedad;
    this.piedad = Math.min(PIEDAD_MAX, this.piedad + a.piedad * this.aj.piedad);
    sfx.amor();
    this.cambiarExpresion(a.exp);
    if (a.respuesta) this.respuesta = a.respuesta;
    const lineas = [...a.narracion];
    if (antes < PIEDAD_MAX && this.piedadLlena) lineas.push(this.def.textoLleno);
    this.narrar(this.conApoyo(lineas), () => this.siguienteActor());
  }

  private usarObjeto(i: number) {
    const [id] = partida.inventario.splice(i, 1);
    const o: Objeto = OBJETOS[id];
    const curados = o.ambos ? this.miembros : [this.actual];
    for (const m of curados) {
      m.hp = Math.min(HP_MAX, (m.caido ? 0 : m.hp) + o.cura);
      if (m.caido) {
        m.caido = false;
        m.alma.setAlpha(1);
      }
    }
    sfx.curar();
    const quien = o.ambos && this.miembros.length > 1 ? 'Los dos recuperan' : '{actor} recupera';
    this.narrar([o.texto, `${quien} ${o.cura} HP.`], () => this.siguienteActor());
  }

  private perdonar() {
    if (!this.piedadLlena) {
      return this.narrar([`Intentan perdonar a ${ELENCO[this.def.enemigo].nombre}...`, 'pero todavía no es el momento.'], () =>
        this.siguienteActor(),
      );
    }
    this.ganar(true);
  }

  private ganar(perdonado: boolean) {
    this.estado = 'fin';
    sfx.victoria();
    this.cambiarExpresion('feliz');
    if (perdonado) this.tweens.add({ targets: this.enemigo, alpha: 0.5, duration: 800 });
    else this.tweens.add({ targets: this.enemigo, alpha: 0, scale: this.enemigo.scale * 1.3, duration: 1200 });

    const lineas = [...(perdonado || !this.def.victoriaDerrotar.length ? this.def.victoriaPerdonar : this.def.victoriaDerrotar)];
    if (this.def.premio) {
      partida.inventario.push(this.def.premio);
      lineas.push(`(Obtuvieron: ${OBJETOS[this.def.premio].nombre}.)`);
    }
    // Quien cayó se levanta al terminar la batalla
    for (const m of this.miembros) partida.hp[m.id] = m.caido ? 10 : m.hp;
    guardar();
    this.narrar(lineas, () => avanzar(this, true));
  }

  // ---------- LUCHAR: barra de precisión ----------

  private iniciarApuntar() {
    this.estado = 'apuntar';
    this.txtCaja.setVisible(false);
    this.cursor.setVisible(false);
    this.barraX = this.caja.x + 10;
  }

  private updateApuntar(delta: number) {
    const { x, y, w, h } = this.caja;
    const cx = x + w / 2;
    this.barraX += (w / 1.1) * (delta / 1000);
    const g = this.gApuntar.clear();
    for (let k = 0; k < 4; k++) {
      g.lineStyle(3, k % 2 ? 0x777777 : 0xffffff).strokeEllipse(cx, y + h / 2, (w - 40) * (1 - k * 0.24), (h - 30) * (1 - k * 0.24));
    }
    g.fillStyle(0x22ff66).fillRect(cx - 2, y + 10, 4, h - 20);
    g.fillStyle(0xffffff).fillRect(this.barraX - 5, y + 8, 10, h - 16);

    if (this.actual.control.confirmar()) return this.golpear((1 - Math.abs(this.barraX - cx) / (w / 2)) * 1);
    if (this.barraX > x + w - 10) this.golpear(0);
  }

  private golpear(precision: number) {
    this.estado = 'transicion';
    const critico = precision > 0.93;
    const dano = precision < 0.08 ? 0 : Math.round(DANO_BASE * (0.4 + 0.6 * precision) * (critico ? 1.5 : 1));
    this.tweens.add({ targets: this.gApuntar, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });

    this.time.delayedCall(450, () => {
      const texto = dano === 0 ? 'FALLO' : critico ? `¡${dano}!` : String(dano);
      const num = this.add
        .text(this.enemigo.x, this.enemigo.y - this.def.tamano / 2, texto, {
          ...ESTILO,
          fontSize: '48px',
          color: dano ? '#ff3344' : '#aaaaaa',
          stroke: '#000000',
          strokeThickness: 8,
        })
        .setOrigin(0.5)
        .setDepth(30);
      this.tweens.add({ targets: num, y: num.y - 40, alpha: 0, duration: 900, delay: 300, onComplete: () => num.destroy() });
      if (dano) {
        sfx.golpe();
        this.hpEnemigo = Math.max(0, this.hpEnemigo - dano);
        this.tweens.add({ targets: this.enemigo, x: 330, duration: 50, yoyo: true, repeat: 3, onComplete: () => this.enemigo.setX(320) });
        const f2 = this.def.fase2;
        if (f2 && !this.fase2 && this.hpEnemigo > 0 && this.hpEnemigo <= this.hpMaxEnemigo * f2.umbral) {
          this.fase2 = true;
          this.fase2Pendiente = true;
        }
      } else sfx.fallo();

      this.time.delayedCall(1000, () => {
        this.gApuntar.clear().setAlpha(1);
        const apoyo = this.conApoyo([]);
        if (apoyo.length) this.narrar(apoyo, () => this.siguienteActor());
        else this.siguienteActor();
      });
    });
  }

  // ---------- Turno del enemigo: esquivar ----------

  private turnoEnemigo() {
    this.estado = 'transicion';
    this.tw.iniciar('', VOZ_NARRADOR);
    this.txtCaja.setVisible(false);
    this.cursor.setVisible(false);
    this.dibujarBotones();

    const patrones = this.fase2 ? this.def.fase2!.patrones : this.def.patrones;
    const base = (this.fase2 ? this.def.fase2!.simultaneos : this.def.simultaneos) ?? 1;
    // Nunca más de 3 ataques a la vez: con más, la caja es imposible
    const simultaneos = Math.min(patrones.length, 3, base + this.aj.ataquesExtra);
    this.activos = Array.from({ length: simultaneos }, (_, i) => ({
      patron: patrones[(this.turno + i) % patrones.length],
      proxima: 500 + i * 250,
    }));
    const respuestas = this.fase2 ? this.def.fase2!.respuestas : this.def.respuestas;
    this.globoTxt.setText(this.fmt(this.respuesta ?? aleatorio(respuestas)));
    this.respuesta = undefined;
    this.globo.setVisible(true);

    const w = Math.max(...this.activos.map((a) => ANCHO_PATRON[a.patron] ?? 200)) + (this.vivos.length > 1 ? 80 : 0);
    const h = 150;
    this.tweenCaja({ x: 320 - w / 2, y: 390 - h, w, h }, () => this.empezarAtaque());
  }

  private empezarAtaque() {
    this.estado = 'ataque';
    this.tiempoAtaque = ((this.def.duracionAtaque ?? DURACION_ATAQUE) + (this.fase2 ? 1500 : 0)) * this.aj.duracion;
    this.angulo = Math.PI / 2;
    const { x, y, w, h } = this.caja;
    const vivos = this.vivos;
    vivos.forEach((m, i) => {
      const px = vivos.length === 1 ? x + w / 2 : x + (w * (i + 1)) / 3;
      m.alma.setVisible(true).setAlpha(1).setPosition(px, y + h * 0.65);
      m.invulnerable = 0;
    });
  }

  private crear(x: number, y: number, vx: number, vy: number, extra: Partial<Bala> = {}) {
    const cura = !extra.rect && !extra.inofensiva && Math.random() < 0.05;
    const clave = cura ? 'corazon-verde' : this.def.bala;
    // Las balas de algunos jefes van más rápido
    const rapidez = (this.def.velocidadBalas ?? 1) * (this.fase2 ? 1.15 : 1) * this.aj.velocidad;
    vx *= rapidez;
    vy *= rapidez;
    const img = this.add.image(x, y, clave).setMask(this.mascara);
    if (!cura && clave in ORIENTACION) img.setRotation(Math.atan2(vy, vx) - ORIENTACION[clave]);
    const b: Bala = { img, vx, vy, t: 0, cura, ...extra };
    this.balas.push(b);
    return b;
  }

  private generar(delta: number) {
    const dificultad =
      Math.min(1.6, 1 + this.turno * 0.07) * (this.fase2 ? 1.2 : 1) * (this.def.intensidad ?? 1) * this.aj.intensidad;
    for (const a of this.activos) {
      a.proxima -= delta * dificultad;
      if (a.proxima <= 0) a.proxima = this.disparar(a.patron);
    }
  }

  /** Lanza una bala (o grupo) del patrón y devuelve cuánto esperar hasta la siguiente, en ms. */
  private disparar(patron: Patron): number {
    const { x, y, w, h } = this.caja;
    const rnd = Phaser.Math.Between;

    switch (patron) {
      case 'lluvia':
        this.crear(rnd(x + 10, x + w - 10), y - 8, 0, rnd(110, 170));
        return 300;
      case 'lados': {
        const izq = Math.random() < 0.5;
        this.crear(izq ? x - 8 : x + w + 8, rnd(y + 12, y + h - 12), (izq ? 1 : -1) * rnd(110, 160), 0);
        return 360;
      }
      case 'apuntado': {
        const objetivo = aleatorio(this.vivos).alma;
        const lado = rnd(0, 2);
        const px = lado === 0 ? rnd(x, x + w) : lado === 1 ? x - 10 : x + w + 10;
        const py = lado === 0 ? y - 10 : rnd(y, y + h * 0.6);
        const v = new Phaser.Math.Vector2(objetivo.x - px, objetivo.y - py).normalize().scale(175);
        this.crear(px, py, v.x, v.y);
        return 620;
      }
      case 'espiral': {
        this.angulo += 0.28 * this.giro;
        if (this.angulo > Math.PI * 0.9 || this.angulo < Math.PI * 0.1) this.giro *= -1;
        this.crear(x + w / 2, y + 12, Math.cos(this.angulo) * 130, Math.sin(this.angulo) * 130);
        return 150;
      }
      case 'enredaderas':
        this.crearEnredadera(rnd(x + 16, x + w - 16));
        return 800;
      case 'muros':
        this.crearMuro();
        return 1400;
    }
  }

  /** Una advertencia roja abajo y, después, una enredadera que sube y baja. */
  private crearEnredadera(px: number) {
    const c = { ...this.caja };
    const alto = c.h * 0.62;
    const aviso = this.crear(px, c.y + c.h - 6, 0, 0, {
      inofensiva: true,
      act: (b, dt) => {
        b.t += dt;
        b.img.setAlpha(Math.floor(b.t * 10) % 2 ? 0.3 : 0.9);
        if (b.t > 0.55) {
          b.vida = 0;
          const vid = this.crear(px, c.y + c.h + alto / 2, 0, 0, {
            rect: true,
            act: (v, dt2) => {
              v.t += dt2;
              const k = Phaser.Math.Clamp(v.t / 0.18, 0, 1) - Phaser.Math.Clamp((v.t - 0.75) / 0.25, 0, 1);
              v.img.y = c.y + c.h + alto / 2 - alto * k;
              if (v.t > 1.05) v.vida = 0;
            },
          });
          vid.img.setTexture('bloque').setDisplaySize(18, alto).setTint(0x3fbf4f).setRotation(0);
        }
      },
    });
    aviso.img.setTexture('bloque').setDisplaySize(22, 8).setTint(0xff3355).setRotation(0);
  }

  /** Dos muros con un hueco que avanzan de derecha a izquierda. */
  private crearMuro() {
    const { x, y, w, h } = this.caja;
    const hueco = 58;
    const centro = Phaser.Math.Between(y + hueco / 2 + 10, y + h - hueco / 2 - 10);
    const tramos = [
      [y, centro - hueco / 2],
      [centro + hueco / 2, y + h],
    ];
    for (const [a, b] of tramos) {
      if (b - a < 2) continue;
      const m = this.crear(x + w + 10, (a + b) / 2, -125, 0, { rect: true });
      m.img.setTexture('bloque').setDisplaySize(14, b - a).setRotation(0);
    }
  }

  private updateAtaque(delta: number) {
    const dt = delta / 1000;
    const { x, y, w, h } = this.caja;

    for (const m of this.vivos) {
      const e = m.control.eje();
      m.alma.x = Phaser.Math.Clamp(m.alma.x + e.x * VELOCIDAD_ALMA * dt, x + 12, x + w - 12);
      m.alma.y = Phaser.Math.Clamp(m.alma.y + e.y * VELOCIDAD_ALMA * dt, y + 12, y + h - 12);
      m.invulnerable -= delta;
      m.alma.setAlpha(m.invulnerable > 0 && Math.floor(m.invulnerable / 100) % 2 ? 0.3 : 1);
    }

    this.generar(delta);

    for (const b of this.balas) {
      if (b.act) b.act(b, dt);
      else {
        b.img.x += b.vx * dt;
        b.img.y += b.vy * dt;
      }
      if (b.inofensiva || b.vida === 0) continue;
      for (const m of this.vivos) {
        if (!this.choca(b, m.alma)) continue;
        if (b.cura) {
          m.hp = Math.min(HP_MAX, m.hp + 3);
          sfx.curar();
          b.vida = 0;
        } else if (m.invulnerable <= 0) this.recibirDano(m);
      }
    }

    this.balas = this.balas.filter((b) => {
      const fuera = !b.act && (b.img.x < x - 40 || b.img.x > x + w + 40 || b.img.y < y - 40 || b.img.y > y + h + 40);
      if (fuera || b.vida === 0) b.img.destroy();
      return !(fuera || b.vida === 0);
    });

    if (this.estado !== 'ataque') return;
    this.tiempoAtaque -= delta;
    if (this.tiempoAtaque <= 0) this.finAtaque();
  }

  private choca(b: Bala, alma: Phaser.GameObjects.Image) {
    if (b.rect) {
      return Math.abs(alma.x - b.img.x) < b.img.displayWidth / 2 + 5 && Math.abs(alma.y - b.img.y) < b.img.displayHeight / 2 + 5;
    }
    return Phaser.Math.Distance.Between(b.img.x, b.img.y, alma.x, alma.y) < 11;
  }

  private recibirDano(m: Miembro) {
    m.hp -= this.dano + (this.fase2 ? (this.def.fase2!.danoExtra ?? 1) : 0);
    m.invulnerable = 1000;
    this.cameras.main.shake(120, 0.006);
    if (m.hp > 0) return sfx.dano();
    if (!this.def.puedePerder) {
      m.hp = 1;
      return sfx.dano();
    }
    m.hp = 0;
    m.caido = true;
    m.alma.setVisible(false);
    sfx.romper();
    if (!this.vivos.length) this.perder();
  }

  private limpiarBalas() {
    this.balas.forEach((b) => b.img.destroy());
    this.balas = [];
  }

  private finAtaque() {
    this.estado = 'transicion';
    this.limpiarBalas();
    this.globo.setVisible(false);
    this.miembros.forEach((m) => m.alma.setVisible(false));
    this.turno++;
    this.tweenCaja(CAJA_MENU, () => {
      this.actor = this.miembros.findIndex((m) => !m.caido);
      this.volverAlMenu(this.textoMenu());
    });
  }

  private perder() {
    this.estado = 'fin';
    this.limpiarBalas();
    this.globo.setVisible(false);
    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(900);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('GameOver'));
    });
  }
}
