import { z } from 'zod';

export const contentFields = [
  { key: 'topbar', group: 'General', label: 'Frase de la barra superior', value: 'Ideas que se ven. Marcas que se recuerdan.', max: 100 },
  { key: 'footer', group: 'General', label: 'Descripción del pie de página', value: 'Artículos promocionales e impresión\npara ideas que merecen hacerse realidad.', max: 240 },
  { key: 'heroTitle', group: 'Inicio', label: 'Título principal', value: 'Hacemos que\ntu marca', max: 90 },
  { key: 'heroHighlight', group: 'Inicio', label: 'Parte del título en turquesa', value: 'se quede.', max: 45 },
  { key: 'heroDescription', group: 'Inicio', label: 'Presentación', value: 'Convierte tu idea en algo que se ve, se usa y se recuerda. Productos personalizados para llevar tu marca mucho más lejos.', max: 380 },
  { key: 'introTitle', group: 'Inicio', label: 'Título de introducción', value: 'Una buena idea merece\nuna gran impresión.', max: 140 },
  { key: 'introDescription', group: 'Inicio', label: 'Texto de introducción', value: 'Elige el artículo. Imagina el diseño. Nosotros te ayudamos a darle forma, con productos y técnicas de personalización para tu empresa, evento o proyecto.', max: 600 },
  { key: 'catalogTitle', group: 'Catálogo', label: 'Título del catálogo', value: 'Un producto para', max: 100 },
  { key: 'catalogHighlight', group: 'Catálogo', label: 'Segunda parte del título', value: 'cada forma de conectar.', max: 100 },
  { key: 'catalogDescription', group: 'Catálogo', label: 'Presentación del catálogo', value: 'Explora nuestra oferta y encuentra ese detalle que hará hablar de tu marca.', max: 380 },
  { key: 'featuredDescription', group: 'Catálogo', label: 'Presentación de destacados', value: 'Una selección del catálogo 2026. Agrega tus favoritos y cuéntanos cómo quieres personalizarlos.', max: 380 },
  { key: 'pdfTitle', group: 'Catálogo', label: 'Título del bloque del PDF', value: 'Tu próxima idea\nestá en estas páginas.', max: 140 },
  { key: 'pdfDescription', group: 'Catálogo', label: 'Descripción del PDF', value: '13 categorías. Fichas de productos, colores, medidas y técnicas de impresión. Explora el catálogo completo a tu ritmo.', max: 500 },
  { key: 'servicesTitle', group: 'Personalización', label: 'Título', value: 'Tu identidad.', max: 90 },
  { key: 'servicesHighlight', group: 'Personalización', label: 'Segunda parte del título', value: 'Nuestra forma de imprimirla.', max: 100 },
  { key: 'servicesDescription', group: 'Personalización', label: 'Presentación', value: 'Cada material tiene su técnica. Encontramos la indicada para darle presencia a tu diseño.', max: 400 },
  { key: 'materialsDescription', group: 'Personalización', label: 'Impresión sobre materiales del cliente', value: 'Serigrafía, sublimación, litografía e impresión sobre materiales aportados por el cliente. Revisamos juntos el soporte y el acabado de tu proyecto.', max: 600 },
  { key: 'aboutTitle', group: 'Nosotros', label: 'Título', value: 'Nos gustan las marcas\nque dejan', max: 100 },
  { key: 'aboutHighlight', group: 'Nosotros', label: 'Parte del título en turquesa', value: 'huella.', max: 45 },
  { key: 'aboutFirst', group: 'Nosotros', label: 'Primer párrafo', value: 'Creemos en el poder de un detalle bien pensado: una libreta donde nace una idea, una botella que acompaña cada día o una bolsa que lleva tu marca a un nuevo lugar.', max: 1200 },
  { key: 'aboutSecond', group: 'Nosotros', label: 'Segundo párrafo', value: 'Por eso unimos artículos promocionales e impresión para transformar tus ideas en piezas que comunican quién eres.', max: 1200 },
  { key: 'quoteTitle', group: 'Cotizaciones', label: 'Título del formulario', value: 'Hagamos\nque tu marca', max: 90 },
  { key: 'quoteHighlight', group: 'Cotizaciones', label: 'Parte del título en turquesa', value: 'se vea.', max: 45 },
  { key: 'quoteDescription', group: 'Cotizaciones', label: 'Presentación', value: 'Cuéntanos qué tienes en mente. Un producto, un evento, una nueva marca… empecemos por tu idea.', max: 500 },
  { key: 'seoTitle', group: 'Al compartir', label: 'Título del enlace general', value: 'VARCUN | Hacemos que tu marca se quede', max: 120 },
  { key: 'seoDescription', group: 'Al compartir', label: 'Descripción del enlace general', value: 'Artículos promocionales e impresión para convertir tu idea en algo que se ve, se usa y se recuerda.', max: 320 },
] as const;

export type ContentKey = typeof contentFields[number]['key'];
export type SiteContent = Record<ContentKey, string>;
export const defaultContent = Object.fromEntries(contentFields.map(field => [field.key, field.value])) as SiteContent;
const shape = {} as Record<ContentKey, z.ZodType<string>>;
for (const field of contentFields) shape[field.key] = z.string().trim().min(1).max(field.max).refine(value => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value));
export const contentSchema = z.object(shape).strict().refine(data => new TextEncoder().encode(JSON.stringify(data)).length <= 20000, 'El contenido es demasiado largo.');
export function resolveContent(value: unknown): SiteContent {
  const parsed = contentSchema.safeParse({ ...defaultContent, ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}) });
  return parsed.success ? parsed.data : { ...defaultContent };
}
