import { catalogProducts, type CatalogProduct } from '../server/catalog-data';

export type Category = { id: string; name: string; short: string; description: string; page: number; range: string; image: string; group: string };
export const categories: Category[] = [
  { id: 'botellas', name: 'Botellas', short: 'Botellas', description: 'Plásticas, de aluminio y térmicas para acompañar cada día.', page: 20, range: '20–27', image: 'botellas-varcun', group: 'Para el día a día' },
  { id: 'vasos', name: 'Vasos y jarras', short: 'Vasos y jarras', description: 'Vasos térmicos y jarras de cerámica con espacio para tu marca.', page: 28, range: '28–33', image: 'vasos-varcun', group: 'Para el día a día' },
  { id: 'oficina', name: 'Libretas, notas y artículos de oficina', short: 'Oficina y libretas', description: 'Libretas, notas y accesorios que llevan tu marca al escritorio.', page: 3, range: '3–11', image: 'oficina-varcun', group: 'En la oficina' },
  { id: 'bolsas', name: 'Bolsas', short: 'Bolsas', description: 'Manta, cambrel, yute y opciones reutilizables.', page: 53, range: '53–57', image: 'bolsas-varcun', group: 'Para llevar' },
  { id: 'gorras', name: 'Gorras', short: 'Gorras', description: 'Estilos Army, DryFit y LuxFit para personalizar.', page: 39, range: '39–43', image: 'gorras-varcun', group: 'Para llevar' },
  { id: 'maletines', name: 'Maletines y loncheras', short: 'Maletines y loncheras', description: 'Mochilas, maletines y loncheras para el trabajo y el camino.', page: 44, range: '44–52', image: 'maletines-varcun', group: 'Para llevar' },
  { id: 'electronicos', name: 'Electrónicos y accesorios', short: 'Tecnología', description: 'Parlantes Bluetooth, relojes y accesorios.', page: 58, range: '58–63', image: 'electronicos-varcun', group: 'Detalles útiles' },
  { id: 'eco', name: 'Eco Friendly', short: 'Eco Friendly', description: 'Bambú, cartón reciclado, manta y materiales reutilizables.', page: 71, range: '71–78', image: 'eco-varcun', group: 'Para el día a día' },
  { id: 'lapiceros', name: 'Lapiceros', short: 'Lapiceros', description: 'Plásticos, metálicos y de bambú para cada idea.', page: 12, range: '12–19', image: 'lapiceros', group: 'En la oficina' },
  { id: 'llaveros', name: 'Focos y llaveros', short: 'Focos y llaveros', description: 'Linternas LED y llaveros metálicos personalizables.', page: 34, range: '34–38', image: 'llaveros', group: 'Detalles útiles' },
  { id: 'herramientas', name: 'Multi-Herramientas', short: 'Multiherramientas', description: 'Alicates, sets y llaveros con herramientas.', page: 64, range: '64–67', image: 'herramientas', group: 'Detalles útiles' },
  { id: 'sublimacion', name: 'Sublimación', short: 'Sublimación', description: 'Botellas y gorras del catálogo para sublimar.', page: 68, range: '68–70', image: 'sublimacion', group: 'Para el día a día' },
  { id: 'otros', name: 'Otros', short: 'Más ideas', description: 'Sets de BBQ, vino y toallas de enfriamiento.', page: 79, range: '79–81', image: 'otros', group: 'Detalles útiles' },
];
export type Product = CatalogProduct;
export const products: Product[] = catalogProducts;
const featuredCodes = ['BO-2401', 'AO-2601', 'GO-1011', 'VA-2501'];
export const featuredProducts = featuredCodes.map(code => products.find(product => product.code === code)!);
export const productsInCategory = (id: string) => products.filter(product => product.categories.includes(id));
export const productImageHref = (product: Product) => `/images/${product.image}.webp`;
export const normalizeCatalogSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
export function searchProducts(categoryId: string, search: string) {
  const query = normalizeCatalogSearch(search);
  return productsInCategory(categoryId).filter(product => normalizeCatalogSearch(`${product.code} ${product.name} ${product.description}`).includes(query));
}
export const CATALOG_PDF_HREF = '/catalogo-varcun-2026.pdf';
export const catalogHref = (page = 1) => `${CATALOG_PDF_HREF}#page=${page}`;
