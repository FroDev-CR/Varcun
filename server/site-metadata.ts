import { catalogProducts } from './catalog-data.js';

export const SITE_ORIGIN = 'https://varcun.com';
export const productHref = (code: string) => `/productos/${code.toLowerCase()}`;
export function productFromPath(pathname: string) {
  const match = /^\/productos\/([a-z0-9-]+)\/?$/i.exec(pathname);
  return match ? catalogProducts.find(product => product.code === match[1].toUpperCase()) : undefined;
}

const pages: Record<string, { title: string; description: string }> = {
  '/': { title: 'VARCUN | Hacemos que tu marca se quede', description: 'Artículos promocionales e impresión para convertir tu idea en algo que se ve, se usa y se recuerda.' },
  '/catalogo': { title: 'Catálogo de productos · Varcun', description: 'Explora las 110 referencias de nuestro catálogo: botellas, lapiceros, libretas, bolsas y más productos para personalizar con tu marca.' },
  '/personalizacion': { title: 'Personalización e impresión · Varcun', description: 'Serigrafía, sublimación, bordado, grabado láser y más opciones para dar forma a tu marca.' },
  '/nosotros': { title: 'Sobre nosotros · Varcun', description: 'Unimos artículos promocionales e impresión para transformar tus ideas en piezas que comunican quién eres.' },
  '/cotizar': { title: 'Solicitar cotización · Varcun', description: 'Cuéntanos tu proyecto y solicita una cotización de productos personalizados, sin compromiso de compra.' },
};

export function pageMetadata(pathname: string, content?: { seoTitle: string; seoDescription: string }) {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  const product = productFromPath(path);
  const page = Object.hasOwn(pages, path) ? pages[path] : undefined;
  const notFound = !product && !page;
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  return {
    title: isAdmin ? 'Administración · Varcun' : product ? `${product.name} · ${product.code} | Varcun` : path === '/' && content ? content.seoTitle : page?.title ?? 'Página no encontrada · Varcun',
    description: isAdmin ? 'Acceso privado a la administración de Varcun.' : product ? [product.description, product.detail, 'Personalízalo con tu marca. Solicita tu cotización en Varcun.'].filter(Boolean).join(' ').slice(0, 320) : path === '/' && content ? content.seoDescription : page?.description ?? 'Explora el catálogo de artículos promocionales de Varcun.',
    url: `${SITE_ORIGIN}${product ? productHref(product.code) : path}`,
    image: `${SITE_ORIGIN}/images/compartir/${product ? product.code.toLowerCase() : 'varcun'}-v1.jpg`,
    imageAlt: product ? `${product.name}, referencia ${product.code} · Varcun` : 'Logo Varcun · Tu idea, nuestra impresión',
    notFound,
  };
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);

export function metadataTags(metadata: ReturnType<typeof pageMetadata>) {
  const value = (key: keyof typeof metadata) => escapeHtml(String(metadata[key]));
  return `<title>${value('title')}</title>
    <meta name="description" content="${value('description')}" />
    <meta name="robots" content="${metadata.notFound ? 'noindex, follow' : 'index, follow'}" />
    <link rel="canonical" href="${value('url')}" />
    <meta property="og:locale" content="es_CR" />
    <meta property="og:site_name" content="Varcun" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${value('title')}" />
    <meta property="og:description" content="${value('description')}" />
    <meta property="og:url" content="${value('url')}" />
    <meta property="og:image" content="${value('image')}" />
    <meta property="og:image:secure_url" content="${value('image')}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="800" />
    <meta property="og:image:height" content="800" />
    <meta property="og:image:alt" content="${value('imageAlt')}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${value('title')}" />
    <meta name="twitter:description" content="${value('description')}" />
    <meta name="twitter:image" content="${value('image')}" />
    <meta name="twitter:image:alt" content="${value('imageAlt')}" />`;
}

export function renderPageHtml(template: string, pathname: string, content?: { seoTitle: string; seoDescription: string }) {
  return template.replace(/<!-- social-metadata:start -->[\s\S]*?<!-- social-metadata:end -->/, () => `<!-- social-metadata:start -->\n    ${metadataTags(pageMetadata(pathname, content))}\n    <!-- social-metadata:end -->`);
}
