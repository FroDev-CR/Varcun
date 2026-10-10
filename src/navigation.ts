import { useCallback, useEffect, useState } from 'react';

export const sitePages = [
  { id: 'inicio', href: '/', label: 'Inicio', title: 'Varcun · Tu idea, nuestra impresión' },
  { id: 'catalogo', href: '/catalogo', label: 'Catálogo', title: 'Catálogo de productos · Varcun' },
  { id: 'personalizacion', href: '/personalizacion', label: 'Personalización', title: 'Personalización e impresión · Varcun' },
  { id: 'nosotros', href: '/nosotros', label: 'Nosotros', title: 'Sobre nosotros · Varcun' },
  { id: 'cotizar', href: '/cotizar', label: 'Cotizar', title: 'Solicitar cotización · Varcun' },
] as const;

export type SitePage = typeof sitePages[number]['id'];
export type SiteLocation = { page: SitePage; href: string; hash: string };

const legacySections: Record<string, { page: SitePage; hash?: string }> = {
  '#inicio': { page: 'inicio' },
  '#catalogo': { page: 'catalogo' },
  '#destacados': { page: 'catalogo', hash: '#destacados' },
  '#servicios': { page: 'personalizacion' },
  '#proceso': { page: 'personalizacion', hash: '#proceso' },
  '#nosotros': { page: 'nosotros' },
  '#contacto': { page: 'cotizar' },
};

export function resolveSiteLocation(pathname: string, hash = ''): SiteLocation {
  const path = pathname.replace(/\/+$/, '') || '/';
  const legacy = path === '/' ? legacySections[hash] : undefined;
  const page = sitePages.find(item => legacy ? item.id === legacy.page : item.href === path) ?? sitePages[0];
  const anchor = legacy ? legacy.hash ?? '' : hash;
  return { page: page.id, href: `${page.href}${anchor}`, hash: anchor };
}

function readLocation() {
  return resolveSiteLocation(window.location.pathname, window.location.hash);
}

export function useSiteNavigation() {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    function syncLocation() {
      const next = readLocation();
      if (window.location.pathname === '/' && legacySections[window.location.hash]) {
        window.history.replaceState(null, '', next.href);
      }
      setLocation(next);
    }
    syncLocation();
    window.addEventListener('popstate', syncLocation);
    window.addEventListener('hashchange', syncLocation);
    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener('hashchange', syncLocation);
    };
  }, []);

  const navigate = useCallback((href: string) => {
    if (`${window.location.pathname}${window.location.hash}` !== href) {
      window.history.pushState(null, '', href);
    }
    setLocation(readLocation());
  }, []);

  return { location, navigate };
}
