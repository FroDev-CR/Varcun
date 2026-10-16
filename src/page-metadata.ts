import { pageMetadata } from '../server/site-metadata';

export function updatePageMetadata(pathname: string, content?: { seoTitle: string; seoDescription: string }) {
  const metadata = pageMetadata(pathname, content);
  document.title = metadata.title;
  const tags = {
    'description': metadata.description,
    'robots': metadata.notFound ? 'noindex, follow' : 'index, follow',
    'og:title': metadata.title, 'og:description': metadata.description,
    'og:url': metadata.url, 'og:image': metadata.image, 'og:image:secure_url': metadata.image,
    'og:image:alt': metadata.imageAlt,
    'twitter:title': metadata.title, 'twitter:description': metadata.description,
    'twitter:image': metadata.image, 'twitter:image:alt': metadata.imageAlt,
  };
  for (const [name, content] of Object.entries(tags)) {
    const attribute = name.startsWith('og:') ? 'property' : 'name';
    const element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`) ?? document.head.appendChild(document.createElement('meta'));
    element.setAttribute(attribute, name);
    element.content = content;
  }
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]') ?? document.head.appendChild(document.createElement('link'));
  canonical.rel = 'canonical';
  canonical.href = metadata.url;
}
