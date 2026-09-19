export interface Objeto {
  nombre: string;
  cura: number;
  texto: string;
  /** Cura a los dos personajes (y levanta al que haya caído). */
  ambos?: boolean;
}

export const OBJETOS = {
  chocolate: { nombre: 'Chocolate', cura: 12, texto: '{actor} come un chocolate. ¡Delicioso!' },
  galleta: { nombre: 'Galleta', cura: 8, texto: '{actor} come una galleta con forma de corazón.' },
  te: { nombre: 'Té tibio', cura: 15, texto: '{actor} toma un té tibio. Sabe a tardes juntos.' },
  rosa: { nombre: 'Rosa', cura: 20, texto: '{actor} huele la rosa. ¡Se llena de DETERMINACIÓN!' },
  pastel: { nombre: 'Pastel', cura: 15, texto: 'Nott y Vaal comparten un pastel.', ambos: true },
  bombon: { nombre: 'Bombones', cura: 10, texto: 'Nott y Vaal se reparten unos bombones.', ambos: true },
} satisfies Record<string, Objeto>;

export type ObjetoId = keyof typeof OBJETOS;

export const INVENTARIO_INICIAL: ObjetoId[] = ['chocolate', 'galleta'];
