import { createContext, useContext, type AnchorHTMLAttributes } from 'react';
import { sitePages } from '../navigation';

export const SiteNavigationContext = createContext<(href: string) => void>(() => {});

export function SiteLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const navigate = useContext(SiteNavigationContext);
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.download !== undefined || (props.target && props.target !== '_self')) return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || !sitePages.some(page => page.href === url.pathname)) return;
    event.preventDefault();
    navigate(`${url.pathname}${url.hash}`);
  }} />;
}
