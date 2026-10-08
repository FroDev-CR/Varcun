export type Category = { id: string; name: string; short: string; description: string; page: number; range: string; image: string; group: string };
export const categories: Category[] = [
  { id: 'botellas', name: 'Botellas', short: 'Botellas', description: 'Plásticas, de aluminio y térmicas para acompañar cada día.', page: 20, range: '20–27', image: 'botellas', group: 'Para el día a día' },
  { id: 'vasos', name: 'Vasos y jarras', short: 'Vasos y jarras', description: 'Vasos térmicos y jarras de cerámica con espacio para tu marca.', page: 28, range: '28–33', image: 'vasos', group: 'Para el día a día' },
  { id: 'oficina', name: 'Libretas, notas y artículos de oficina', short: 'Oficina y libretas', description: 'Libretas, notas y accesorios que llevan tu marca al escritorio.', page: 3, range: '3–11', image: 'oficina', group: 'En la oficina' },
  { id: 'bolsas', name: 'Bolsas', short: 'Bolsas', description: 'Manta, cambrel, yute y opciones reutilizables.', page: 53, range: '53–57', image: 'bolsas', group: 'Para llevar' },
  { id: 'gorras', name: 'Gorras', short: 'Gorras', description: 'Estilos Army, DryFit y LuxFit para personalizar.', page: 39, range: '39–43', image: 'gorras', group: 'Para llevar' },
  { id: 'maletines', name: 'Maletines y loncheras', short: 'Maletines y loncheras', description: 'Mochilas, maletines y loncheras para el trabajo y el camino.', page: 44, range: '44–52', image: 'maletines', group: 'Para llevar' },
  { id: 'electronicos', name: 'Electrónicos y accesorios', short: 'Tecnología', description: 'Parlantes Bluetooth, relojes y accesorios.', page: 58, range: '58–63', image: 'electronicos', group: 'Detalles útiles' },
  { id: 'eco', name: 'Eco Friendly', short: 'Eco Friendly', description: 'Bambú, cartón reciclado, manta y materiales reutilizables.', page: 71, range: '71–78', image: 'eco', group: 'Para el día a día' },
  { id: 'lapiceros', name: 'Lapiceros', short: 'Lapiceros', description: 'Plásticos, metálicos y de bambú para cada idea.', page: 12, range: '12–19', image: 'lapiceros', group: 'En la oficina' },
  { id: 'llaveros', name: 'Focos y llaveros', short: 'Focos y llaveros', description: 'Linternas LED y llaveros metálicos personalizables.', page: 34, range: '34–38', image: 'llaveros', group: 'Detalles útiles' },
  { id: 'herramientas', name: 'Multi-Herramientas', short: 'Multiherramientas', description: 'Alicates, sets y llaveros con herramientas.', page: 64, range: '64–67', image: 'herramientas', group: 'Detalles útiles' },
  { id: 'sublimacion', name: 'Sublimación', short: 'Sublimación', description: 'Botellas y gorras del catálogo para sublimar.', page: 68, range: '68–70', image: 'sublimacion', group: 'Para el día a día' },
  { id: 'otros', name: 'Otros', short: 'Más ideas', description: 'Sets de BBQ, vino y toallas de enfriamiento.', page: 79, range: '79–81', image: 'otros', group: 'Detalles útiles' },
];
export type Product = { code: string; name: string; category: string; detail: string; technique: string; page: number; image: string; label?: string };
export const products: Product[] = [
  { code: 'BO-2401', name: 'Botella térmica', category: 'botellas', detail: '800 ml · Tapa de seguridad', technique: 'Serigrafía / Grabado láser', page: 27, image: 'botella-termica', label: 'Para todos los días' },
  { code: 'AO-2601', name: 'Libreta Nature', category: 'oficina', detail: '9 × 14 cm · Libreta ecológica', technique: 'Serigrafía / Sticker', page: 4, image: 'libreta-nature', label: 'Una nueva idea' },
  { code: 'GO-1011', name: 'Gorra LuxFit', category: 'gorras', detail: 'Material deportivo · Cierre metálico', technique: 'Bordado', page: 43, image: 'gorra-luxfit', label: 'Lleva tu marca' },
  { code: 'VA-2501', name: 'Vaso térmico', category: 'vasos', detail: '30 oz · Acero inoxidable', technique: 'Serigrafía / Grabado láser', page: 29, image: 'vaso-termico' },
  { code: 'BP-2602', name: 'Bolsa de manta', category: 'bolsas', detail: '42 × 38 cm · Agarraderas largas', technique: 'Serigrafía', page: 75, image: 'bolsa-manta' },
  { code: 'LO-2301', name: 'Lonchera / hielera', category: 'maletines', detail: '31 × 26,5 × 19 cm · Insulación térmica', technique: 'Serigrafía', page: 50, image: 'lonchera' },
  { code: 'LA-2401', name: 'Lapicero de bambú', category: 'lapiceros', detail: '13,8 cm · Mecanismo pulsador', technique: 'Tampografía / Grabado láser', page: 14, image: 'lapicero-bambu' },
  { code: 'MU-1901', name: 'Set de herramientas', category: 'herramientas', detail: 'Estuche metálico con zipper', technique: 'Encapsulado', page: 66, image: 'herramientas' },
  { code: 'BO-2405', name: 'Botella para sublimar', category: 'sublimacion', detail: '800 ml · Aluminio blanco', technique: 'Serigrafía / Sublimación', page: 69, image: 'sublimacion' },
  { code: 'AO-2402', name: 'Libreta Coffee', category: 'eco', detail: '21 × 14 cm · Hojas rayadas', technique: 'Serigrafía / Sticker', page: 5, image: 'libreta-coffee' },
  { code: 'OT-2605', name: 'Set de BBQ', category: 'otros', detail: '4 piezas · Mangos de madera', technique: 'Grabado láser / Serigrafía', page: 80, image: 'bbq' },
  { code: 'OT-2601', name: 'Set de vino', category: 'otros', detail: '4 piezas · Estuche de madera', technique: 'Grabado láser / Serigrafía', page: 80, image: 'vino' },
];
export const catalogHref = (page = 1) => `/catalogo-2026.pdf#page=${page}`;
