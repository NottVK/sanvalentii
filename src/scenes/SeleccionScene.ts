import Phaser from 'phaser';
import { FUENTE } from '../config';
import { ELENCO, JUGABLES, pareja, type PersonajeId } from '../data/personajes';
import { nuevaPartida } from '../estado';
import { irAPaso } from '../flujo';
import { entrada } from '../sistema/entrada';
import { sfx } from '../sistema/sfx';
import { escalarACaja, retratoDisponible } from '../sistema/texturas';
import { Menu } from '../ui/Menu';
import { esTactil, montarTactil } from '../ui/tactil';

const DESCRIPCION: Record<PersonajeId, string> = {
  nott: 'Valiente y despistado.\nLlega tarde,\npero siempre llega.',
  vaal: 'Dulce, divertida\ny muy terca.\nNo la hagas enojar.',
};

type Fase = 'modo' | 'personaje' | 'controles' | 'saliendo';

const DESC_MODO = [
  'Elige a Nott o a Vaal. Tu pareja te acompañará.',
  'Cada uno controla a su personaje. ¡Jueguen juntos!',
];

/** Elegir 1 o 2 jugadores, y con qué personaje juega el jugador 1. */
export class SeleccionScene extends Phaser.Scene {
  private fase: Fase = 'modo';
  private modo: 1 | 2 = 1;
  private eleccion = 0;
  private menu?: Menu;
  private capa?: Phaser.GameObjects.Container;
  private desc?: Phaser.GameObjects.Text;
  private marcos: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('Seleccion');
  }

  create() {
    this.capa = undefined;
    this.eleccion = 0;
    this.cameras.main.fadeIn(400);
    this.mostrarModo();
  }

  private limpiar() {
    this.menu?.destruir();
    this.menu = undefined;
    this.capa?.destroy();
    this.capa = this.add.container();
    this.marcos = [];
    this.desc = undefined;
  }

  private texto(x: number, y: number, t: string, tam = 28, color = '#ffffff') {
    const obj = this.add.text(x, y, t, { fontFamily: FUENTE, fontSize: `${tam}px`, color, align: 'center' }).setOrigin(0.5);
    this.capa!.add(obj);
    return obj;
  }

  private mostrarModo() {
    this.fase = 'modo';
    this.limpiar();
    this.texto(320, 70, '¿Cuántos van a jugar?', 44);
    this.desc = this.texto(320, 330, DESC_MODO[0], 24, '#aaaaaa');
    this.menu = new Menu(this, 230, 190, ['1 Jugador', '2 Jugadores'], entrada.todos, (i) => {
      this.modo = i === 0 ? 1 : 2;
      this.mostrarPersonaje();
    }, 56);
  }

  private mostrarPersonaje() {
    this.fase = 'personaje';
    this.limpiar();
    this.texto(320, 50, this.modo === 2 ? 'Jugador 1, elige tu personaje' : 'Elige tu personaje', 40);

    JUGABLES.forEach((id, i) => {
      const x = 180 + i * 280;
      const marco = this.add.graphics();
      this.marcos.push(marco);
      this.capa!.add(marco);
      this.capa!.add(escalarACaja(this.add.image(x, 180, retratoDisponible(this, id)), 130));
      this.texto(x, 272, ELENCO[id].nombre, 40, '#ffd84a');
      this.texto(x, 322, DESCRIPCION[id], 22, '#cccccc');
    });
    this.texto(320, 440, '< >  para elegir      ACEPTAR para confirmar', 22, '#777777');
    this.pintarMarcos();
  }

  private pintarMarcos() {
    this.marcos.forEach((m, i) => {
      const x = 180 + i * 280;
      m.clear().lineStyle(4, i === this.eleccion ? 0xffff00 : 0x444444).strokeRect(x - 110, 100, 220, 260);
    });
  }

  private mostrarControles() {
    this.fase = 'controles';
    this.limpiar();
    const p1 = JUGABLES[this.eleccion];
    const p2 = pareja(p1);
    const n1 = ELENCO[p1].nombre;
    const n2 = ELENCO[p2].nombre;

    if (this.modo === 1) {
      this.texto(320, 60, `Juegas con ${n1}`, 42, '#ffd84a');
      this.texto(320, 110, `${n2} te acompañará en la aventura.`, 26, '#cccccc');
      this.texto(320, 210, 'Moverse: flechas o W A S D\nAceptar: Z o Enter\nCancelar: X', 30);
      if (esTactil()) this.texto(320, 320, 'En el celular: usa la cruceta y los botones A y B.', 24, '#aaaaaa');
    } else {
      this.texto(320, 50, 'Controles', 42, '#ffd84a');
      this.texto(320, 140, `JUGADOR 1 — ${n1}\nMoverse: W A S D    Aceptar: F    Cancelar: G`, 26);
      this.texto(320, 240, `JUGADOR 2 — ${n2}\nMoverse: flechas    Aceptar: K    Cancelar: L`, 26);
      if (esTactil()) {
        this.texto(320, 330, 'En el celular: el Jugador 1 usa la izquierda y el Jugador 2 la derecha.\n(Mejor con el teléfono horizontal.)', 22, '#aaaaaa');
      }
    }
    const aviso = this.texto(320, 420, '[ ACEPTAR para comenzar ]', 30, '#ffff00');
    this.tweens.add({ targets: aviso, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
  }

  private comenzar() {
    this.fase = 'saliendo';
    const p1 = JUGABLES[this.eleccion];
    nuevaPartida(this.modo, p1);
    entrada.configurar(this.modo);
    montarTactil(this.modo, [ELENCO[p1].nombre, ELENCO[pareja(p1)].nombre]);
    irAPaso(this, 0);
  }

  update() {
    const c = entrada.todos;
    if (this.fase === 'modo') {
      this.menu?.update();
      if (this.menu) this.desc?.setText(DESC_MODO[this.menu.indice]);
      if (c.cancelar()) {
        this.fase = 'saliendo';
        this.scene.start('Titulo');
      }
    } else if (this.fase === 'personaje') {
      if (c.izquierda() || c.derecha()) {
        this.eleccion = 1 - this.eleccion;
        sfx.mover();
        this.pintarMarcos();
      }
      if (c.confirmar()) {
        sfx.confirmar();
        this.mostrarControles();
      } else if (c.cancelar()) this.mostrarModo();
    } else if (this.fase === 'controles') {
      if (c.confirmar()) {
        sfx.confirmar();
        this.comenzar();
      } else if (c.cancelar()) this.mostrarPersonaje();
    }
  }
}
