import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, ArrowUpRight as CircleArrowUpRight, Check, CheckCircle2, ChevronDown, Layers3, Leaf, Menu, Minus, Palette, Plus, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { categories, products, catalogHref, CATALOG_PDF_HREF, type Category, type Product } from './catalog';
import { createRequestId } from './request-id';
import { BrandBackdrop } from '@/components/ui/brand-backdrop';

function Brand({ light = false }: { light?: boolean }) {
  return <a href="#inicio" className={`brand ${light ? 'brand-light' : ''}`} aria-label="Varcun, inicio"><img src="/logo-mark.svg" width="44" height="44" alt="" /><span><strong>VARCUN</strong><small>TU IDEA, NUESTRA IMPRESIÓN</small></span></a>;
}

const techniques = [
  { name: 'Serigrafía', text: 'Tu diseño sobre textiles, bolsas y artículos promocionales.', icon: Layers3, className: 'tech-print' },
  { name: 'Sublimación', text: 'Color y detalle sobre productos preparados para sublimar.', icon: Palette, className: 'tech-color' },
  { name: 'Bordado', text: 'Textura y presencia para las gorras de tu marca.', icon: Sparkles, className: 'tech-thread' },
  { name: 'Grabado láser', text: 'Una marca precisa en metal, bambú y madera.', icon: Layers3, className: 'tech-laser' },
  { name: 'Tampografía', text: 'Personalización para lapiceros y objetos pequeños.', icon: Palette, className: 'tech-pad' },
  { name: 'Sticker y encapsulado', text: 'Detalles gráficos para libretas, llaveros y accesorios.', icon: Sparkles, className: 'tech-resin' },
];

const questions = [
  ['¿Cómo solicito una cotización?', 'Explora las categorías, agrega a tu selección los productos que te interesan y completa el formulario. Indica cantidad, diseño y fecha deseada para que podamos revisar tu proyecto.'],
  ['¿Puedo llevar mis propios materiales?', 'Sí. También trabajamos la impresión sobre materiales aportados por el cliente. Cuéntanos qué material tienes para revisar su compatibilidad con el diseño y la técnica.'],
  ['¿Los productos se pueden personalizar?', 'El catálogo indica las técnicas disponibles para cada artículo. La personalización depende de su material y área de impresión; revisamos esos detalles al cotizar.'],
  ['¿Dónde puedo ver colores, medidas y capacidades?', 'Consulta el catálogo PDF 2026. Cada ficha incluye el código del producto y sus características. La disponibilidad de colores y cantidades se confirma al cotizar.'],
  ['¿Puedo comprar directamente desde la web?', 'La web te permite preparar una solicitud de cotización. La selección de productos no es una compra ni un compromiso de pago. Los detalles de tu pedido se confirman posteriormente.'],
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [allCategories, setAllCategories] = useState(false);
  const [group, setGroup] = useState('Todas');
  const [category, setCategory] = useState<Category | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formMessage, setFormMessage] = useState('');
  const [requestId, setRequestId] = useState(createRequestId);
  const [showSelection, setShowSelection] = useState(false);
  const [search, setSearch] = useState('');
  const [motionPaused, setMotionPaused] = useState(false);
  const [announce, setAnnounce] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
    document.documentElement.classList.add('enhanced-motion');
    return () => { observer.disconnect(); document.documentElement.classList.remove('enhanced-motion'); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('motion-paused', motionPaused);
    return () => document.body.classList.remove('motion-paused');
  }, [motionPaused]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (category && dialog && !dialog.open) {
      previousFocus.current = document.activeElement as HTMLElement;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    }
    if (!category && dialog?.open) dialog.close();
    return () => { document.body.style.overflow = ''; };
  }, [category]);

  function closeDialog() {
    dialogRef.current?.close();
    setCategory(null);
    previousFocus.current?.focus();
  }

  function toggleProduct(product: Product) {
    const exists = selection.includes(product.code);
    setSelection(current => exists ? current.filter(code => code !== product.code) : [...current, product.code]);
    setAnnounce(`${product.name} ${exists ? 'se quitó de' : 'se agregó a'} tu selección.`);
  }

  function quoteCategory(value: string) {
    setSelectedCategory(value);
    closeDialog();
    document.getElementById('contacto')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.getElementById('quote-name')?.focus({ preventScroll: true });
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    setFormStatus('sending');
    setFormMessage('');
    try {
      const response = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        requestId, name: data.get('name'), email: data.get('email'), phone: data.get('phone'), company: data.get('company'), category: data.get('category'), quantity: Number(data.get('quantity')), message: data.get('message'), consent: data.get('consent') === 'on', website: data.get('website'), products: selection,
      }) });
      const result = await response.json().catch(() => ({ message: 'No pudimos conectar. Inténtalo nuevamente en unos minutos.' }));
      if (!response.ok) throw new Error(result.message || 'No pudimos registrar tu solicitud. Inténtalo nuevamente.');
      setFormStatus('success');
      setFormMessage(`Recibimos tu solicitud. Tu referencia es ${requestId.slice(0, 8).toUpperCase()}.`);
      form.reset(); setSelection([]); setSelectedCategory(''); setRequestId(createRequestId());
    } catch (error) {
      setFormStatus('error');
      setFormMessage(error instanceof Error ? error.message : 'No pudimos conectar. Revisa tu conexión e inténtalo nuevamente.');
    }
  }

  const filteredCategories = categories.filter(item => (group === 'Todas' || item.group === group) && `${item.name} ${item.description}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')));
  const visibleCategories = group !== 'Todas' || search || allCategories ? filteredCategories : filteredCategories.slice(0, 8);
  const selectedProducts = products.filter(item => selection.includes(item.code));

  function productCard(product: Product) {
    const selected = selection.includes(product.code);
    return <article className="product-card" key={product.code}>
      <div className="product-picture"><span className="product-code">{product.code}</span><img src={`/images/producto-${product.image}.webp`} alt={product.name} width="400" height="400" loading="lazy" /><button className={`product-add ${selected ? 'selected' : ''}`} onClick={() => toggleProduct(product)} aria-label={`${selected ? 'Quitar' : 'Agregar'} ${product.name} ${selected ? 'de' : 'a'} mi selección`} aria-pressed={selected}>{selected ? <Check size={18} /> : <Plus size={18} />}</button></div>
      <div className="product-info"><span>{categories.find(item => item.id === product.category)?.short}</span><h3>{product.name}</h3><p>{product.detail}</p><a href={catalogHref(product.page)} target="_blank" rel="noopener noreferrer">Ver ficha en el catálogo <ArrowUpRight size={14} /></a></div>
    </article>;
  }

  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <div className="topbar"><BrandBackdrop paused={motionPaused} /><div className="site-container"><p>Ideas que se ven. Marcas que se recuerdan.</p><a href={catalogHref()} target="_blank" rel="noopener noreferrer">Catálogo 2026 <ArrowUpRight size={13} /></a></div></div>
    <header className="header"><div className="site-container header-inner"><Brand /><nav aria-label="Navegación principal" className="desktop-nav"><a href="#catalogo">Catálogo <ChevronDown size={13} /></a><a href="#servicios">Personalización</a><a href="#nosotros">Nosotros</a></nav><div className="header-actions"><button className="selection-button" aria-label={`Mi selección, ${selection.length} productos`} aria-expanded={showSelection} onClick={() => setShowSelection(!showSelection)}><Layers3 size={18} /><span className="selection-label">Mi selección</span><span className="selection-count">{selection.length}</span></button><a href="#contacto" className="button button-dark header-quote">Hablemos de tu idea <ArrowUpRight size={16} /></a><button className="menu-toggle" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div></div>
      {menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="Navegación móvil">{[['#catalogo', 'Catálogo'], ['#servicios', 'Personalización'], ['#nosotros', 'Nosotros'], ['#contacto', 'Solicitar cotización']].map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={18} /></a>)}</nav>}
      {showSelection && <div className="selection-panel"><div className="selection-heading"><h2>Tu selección <span>({selection.length})</span></h2><button onClick={() => setShowSelection(false)} aria-label="Cerrar selección"><X size={20} /></button></div>{selectedProducts.length ? <><ul>{selectedProducts.map(item => <li key={item.code}><img src={`/images/producto-${item.image}.webp`} alt="" /><span>{item.name}<small>{item.code}</small></span><button onClick={() => toggleProduct(item)} aria-label={`Quitar ${item.name}`}><X size={16} /></button></li>)}</ul><a href="#contacto" className="button button-dark" onClick={() => setShowSelection(false)}>Cotizar mi selección <ArrowRight size={16} /></a><p>Tu selección es una solicitud, sin compromiso de compra.</p></> : <p>Encuentra un producto que te guste y usa el botón + para agregarlo aquí.</p>}</div>}
    </header>

    <main id="contenido" tabIndex={-1}>
      <section id="inicio" className="hero">
        <BrandBackdrop className="hero-warp" paused={motionPaused} />
        <div className="site-container hero-grid"><div className="hero-content"><div className="eyebrow"><span className="status-dot" /> ARTÍCULOS PROMOCIONALES & IMPRESIÓN</div><h1>Hacemos que<br />tu marca<br /><span>se quede.</span><svg className="hero-underline" viewBox="0 0 360 18" aria-hidden="true"><path d="M3 12 Q160 -3 355 8" /></svg></h1><p>Convierte tu idea en algo que se ve, se usa y se recuerda. Productos personalizados para llevar tu marca mucho más lejos.</p><div className="hero-buttons"><a className="button button-aqua" href="#catalogo">Encuentra tu producto <ArrowUpRight size={19} /></a><a className="hero-secondary" href="#servicios">Descubre cómo lo hacemos <ArrowRight size={17} /></a></div><div className="hero-note"><span className="small-line" /><span>Tu idea. Tu estilo. Nuestra impresión.</span></div></div>
        <div className="hero-showcase" aria-label="Productos del catálogo Varcun"><div className="showcase-top"><span>EL SIGUIENTE CAPÍTULO DE TU MARCA</span><span>2026 <ArrowUpRight size={18} /></span></div><div className="hero-orbit" /><div className="hero-vertical" aria-hidden="true">HECHO PARA DESTACAR.</div><div className="hero-main-product motion-float"><img src="/images/producto-botella-termica.webp" alt="Botella térmica azul del catálogo, código BO-2401" width="420" height="600" fetchPriority="high" /></div><div className="hero-notebook"><img src="/images/producto-libreta-nature.webp" alt="Libreta Nature ecológica del catálogo" width="300" height="350" /></div><div className="hero-cap"><img src="/images/producto-gorra-luxfit.webp" alt="Gorra LuxFit azul marino del catálogo" width="320" height="220" /></div><div className="hero-stamp"><Sparkles size={24} /><span>PEQUEÑOS DETALLES.<br /><b>GRANDES MARCAS.</b></span></div><div className="product-tag"><span className="status-dot" /><span>Un objeto cotidiano.<br /><strong>Una conexión extraordinaria.</strong></span></div><a href="#destacados" className="showcase-bottom"><span>Una muestra de lo que podemos crear</span><CircleArrowUpRight size={24} /></a></div></div>
      </section>

      <div className="brand-ribbon" aria-hidden="true"><div className="site-container ribbon-inner"><span>TU MARCA EN CADA DETALLE</span><Sparkles /><span>DISEÑADO PARA CONECTAR</span><Sparkles /><span>HECHO PARA RECORDAR</span><Sparkles /></div></div>

      <section className="intro-strip"><div className="site-container intro-grid"><div><span className="section-kicker">MUCHO MÁS QUE UN LOGO</span><h2>Una buena idea merece<br />una gran impresión.</h2></div><p>Elige el artículo. Imagina el diseño. Nosotros te ayudamos a darle forma, con productos y técnicas de personalización para tu empresa, evento o proyecto.</p><div className="intro-facts"><div><strong>13<span> categorías</span></strong><small>Un mundo de posibilidades</small></div><div><strong>2026</strong><small>Tu próximo proyecto empieza aquí</small></div></div></div></section>

      <section id="catalogo" className="section catalog-section"><div className="site-container"><div className="section-heading" data-reveal><div><span className="section-kicker">ENCUENTRA TU PRÓXIMA IDEA</span><h2>Un producto para<br /><span>cada forma de conectar.</span></h2></div><div className="heading-side"><p>Explora nuestra oferta y encuentra ese detalle que hará hablar de tu marca.</p><a className="text-link" href={catalogHref()} target="_blank" rel="noopener noreferrer">Ver catálogo completo <ArrowUpRight size={17} /></a></div></div>
        <div className="catalog-toolbar"><div className="filter-buttons" role="group" aria-label="Filtrar categorías">{['Todas', 'Para el día a día', 'En la oficina', 'Para llevar', 'Detalles útiles'].map(value => <button key={value} aria-pressed={group === value} className={group === value ? 'active' : ''} onClick={() => setGroup(value)}>{value}</button>)}</div><label className="catalog-search"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar categoría" aria-label="Buscar categoría" /></label></div>
        <div className="category-grid">{visibleCategories.map((item, index) => <button key={item.id} className="category-card group" onClick={() => setCategory(item)} aria-label={`Explorar ${item.name}`}><div className="category-photo"><img src={`/images/${item.image}.webp`} alt="" width="550" height="420" loading="lazy" /><span className="category-index">{String(categories.indexOf(item) + 1).padStart(2, '0')}</span><span className="category-arrow"><ArrowUpRight size={22} /></span>{item.id === 'eco' && <span className="eco-tag"><Leaf size={13} /> ECO FRIENDLY</span>}</div><div className="category-caption"><h3>{item.short}</h3><span>{item.description}</span></div></button>)}</div>
        {!filteredCategories.length && <p className="empty-search" role="status">No encontramos esa categoría. Prueba con “botellas”, “gorras” o “bolsas”.</p>}
        <div className="catalog-bottom"><p><span className="status-dot" />{visibleCategories.length} de {filteredCategories.length} categorías</p>{group === 'Todas' && !search && <button className="button button-outline" onClick={() => setAllCategories(!allCategories)}>{allCategories ? 'Ver selección de categorías' : 'Explorar las 13 categorías'}{allCategories ? <Minus size={17} /> : <Plus size={17} />}</button>}</div>
      </div></section>

      <section id="destacados" className="section featured-section"><div className="site-container"><div className="section-heading" data-reveal><div><span className="section-kicker">INSPIRACIÓN PARA EMPEZAR</span><h2>Objetos de todos los días.<br /><span>Con algo de ti.</span></h2></div><div className="heading-side"><p>Una selección del catálogo 2026. Agrega tus favoritos y cuéntanos cómo quieres personalizarlos.</p><span className="selection-hint"><Plus size={15} /> Agrégalos a tu cotización</span></div></div><div className="product-grid">{products.slice(0, 4).map(productCard)}</div><div className="featured-note"><ShieldCheck size={17} /><p>Colores, disponibilidad, cantidades y personalización se confirman al cotizar.</p></div></div></section>

      <section id="servicios" className="section services-section"><div className="site-container"><div className="section-heading" data-reveal><div><span className="section-kicker">EL DETALLE HACE LA DIFERENCIA</span><h2>Tu identidad.<br /><span>Nuestra forma de imprimirla.</span></h2></div><div className="heading-side"><p>Cada material tiene su técnica. Encontramos la indicada para darle presencia a tu diseño.</p></div></div><div className="technique-grid">{techniques.map((item, index) => <article className="technique-card" key={item.name}><div className={`tech-art ${item.className}`} aria-hidden="true">{item.className === 'tech-pad' && <BrandBackdrop paused={motionPaused} />}<item.icon size={34} strokeWidth={1.2} /><span>V</span></div><div className="technique-text"><small>0{index + 1}</small><h3>{item.name}</h3><p>{item.text}</p></div></article>)}</div><div className="own-material" data-reveal><div className="material-icon"><Layers3 size={34} /></div><div><span className="section-kicker">TAMBIÉN PODEMOS EMPEZAR CON LO QUE YA TIENES</span><h3>Tú traes el material. Nosotros, la impresión.</h3><p>Serigrafía, sublimación, litografía e impresión sobre materiales aportados por el cliente. Revisamos juntos el soporte y el acabado de tu proyecto.</p></div><button className="button button-dark" onClick={() => quoteCategory('material-cliente')}>Cotizar mi material <ArrowUpRight size={17} /></button></div></div></section>

      <section id="nosotros" className="about-section"><BrandBackdrop paused={motionPaused} /><div className="site-container about-grid"><div className="about-photo"><img src="/images/eco-varcun.webp" alt="Bolsas y artículos reutilizables del catálogo 2026" width="800" height="720" loading="lazy" /><div className="about-image-note"><Sparkles size={22} /><span>Una idea tuya.<br /><strong>Algo que se vuelve real.</strong></span></div></div><div className="about-content" data-reveal><span className="section-kicker">SOMOS VARCUN</span><h2>Nos gustan las marcas<br />que dejan <span>huella.</span></h2><p>Creemos en el poder de un detalle bien pensado: una libreta donde nace una idea, una botella que acompaña cada día o una bolsa que lleva tu marca a un nuevo lugar.</p><p>Por eso unimos artículos promocionales e impresión para transformar tus ideas en piezas que comunican quién eres.</p><div className="about-values"><span><CheckCircle2 size={19} /> Productos para personalizar</span><span><CheckCircle2 size={19} /> Impresión sobre tus materiales</span><span><CheckCircle2 size={19} /> Un proyecto a tu medida</span></div><a href="#contacto" className="text-link">Hagamos algo que se recuerde <ArrowUpRight size={18} /></a></div></div></section>

      <section id="proceso" className="section process-section"><div className="site-container"><div className="process-heading" data-reveal><span className="section-kicker">DE TU IDEA A TUS MANOS</span><h2>Así empieza <span>algo bueno.</span></h2><p>Un camino claro para dar forma a tu próximo proyecto.</p></div><div className="process-grid">{[
        { title: 'Explora e inspírate', text: 'Recorre las categorías y consulta las fichas del catálogo.', icon: Search },
        { title: 'Cuéntanos tu idea', text: 'Comparte tu selección, cantidades y el diseño que tienes en mente.', icon: Palette },
        { title: 'Afinamos los detalles', text: 'Revisamos material, técnica de impresión y condiciones del proyecto.', icon: Layers3 },
        { title: 'Damos forma a tu marca', text: 'Con los detalles acordados, tu idea pasa a convertirse en algo real.', icon: Sparkles },
      ].map((step, index) => <article className="process-step" key={step.title}><div className="step-top"><span>0{index + 1}</span><step.icon size={23} strokeWidth={1.5} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div></section>

      <section className="catalog-banner"><BrandBackdrop paused={motionPaused} /><div className="site-container catalog-banner-inner"><div className="catalog-cover" aria-hidden="true"><img src="/images/catalogo-varcun-2026-cover.webp" alt="" width="595" height="842" loading="lazy" /></div><div><span className="section-kicker">TODAS LAS POSIBILIDADES, EN UN SOLO LUGAR</span><h2>Tu próxima idea<br />está en estas páginas.</h2><p>13 categorías. Fichas de productos, colores, medidas y técnicas de impresión. Explora el catálogo completo a tu ritmo.</p></div><div className="catalog-banner-actions"><a className="button button-aqua" href={CATALOG_PDF_HREF} download="Varcun-Catalogo-2026.pdf">Descargar catálogo <ArrowDownToLine size={18} /></a><a href={catalogHref()} target="_blank" rel="noopener noreferrer">Abrir en el navegador <ArrowUpRight size={15} /></a><small>PDF · 81 páginas · 21,3 MB</small></div></div></section>

      <section className="section faq-section"><div className="site-container faq-grid"><div data-reveal><span className="section-kicker">ANTES DE EMPEZAR</span><h2>Una idea clara.<br /><span>Sin dudas.</span></h2><p>Algunas respuestas para ayudarte a preparar tu proyecto.</p><a href="#contacto" className="text-link">Cuéntanos lo que necesitas <ArrowUpRight size={16} /></a></div><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={18} /></summary><p>{answer}</p></details>)}</div></div></section>

      <section id="contacto" className="section contact-section"><div className="site-container contact-grid"><div className="contact-copy" data-reveal><span className="section-kicker">TU SIGUIENTE GRAN IDEA EMPIEZA AQUÍ</span><h2>Hagamos<br />que tu marca<br /><span>se vea.</span><ArrowUpRight className="contact-big-arrow" strokeWidth={1} /></h2><p>Cuéntanos qué tienes en mente. Un producto, un evento, una nueva marca… empecemos por tu idea.</p><div className="contact-promise"><CheckCircle2 size={20} /><span>Una solicitud a tu medida.<br /><strong>Sin compromiso de compra.</strong></span></div><div className="contact-tags"><span>EMPRESAS</span><span>EVENTOS</span><span>EMPRENDIMIENTOS</span></div></div>
        <form className="quote-form" onSubmit={submitQuote} aria-label="Solicitar cotización"><div className="form-heading"><h3>Cuéntanos tu proyecto</h3><p>Los campos con * son obligatorios.</p></div>{selection.length > 0 && <div className="form-selection"><span>Tu selección</span><div>{selectedProducts.map(item => <button type="button" key={item.code} onClick={() => toggleProduct(item)} aria-label={`Quitar ${item.name} de la cotización`}>{item.code}<X size={13} /></button>)}</div></div>}<div className="form-grid"><label htmlFor="quote-name">Nombre *<input id="quote-name" name="name" autoComplete="name" placeholder="Tu nombre" minLength={2} maxLength={120} required /></label><label htmlFor="quote-company">Empresa<input id="quote-company" name="company" autoComplete="organization" placeholder="Empresa o proyecto" maxLength={120} /></label><label htmlFor="quote-email">Correo electrónico *<input id="quote-email" name="email" type="email" autoComplete="email" placeholder="nombre@empresa.com" maxLength={254} required /></label><label htmlFor="quote-phone">Teléfono<input id="quote-phone" name="phone" type="tel" autoComplete="tel" placeholder="Tu número de contacto" maxLength={30} /></label><label htmlFor="quote-category">¿Qué te interesa? *<select id="quote-category" name="category" required value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}><option value="" disabled>Elige una opción</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="material-cliente">Imprimir mis materiales</option><option value="otro-proyecto">Otro proyecto / necesito orientación</option></select></label><label htmlFor="quote-quantity">Cantidad aproximada *<input id="quote-quantity" name="quantity" type="number" inputMode="numeric" min="1" max="1000000" step="1" placeholder="Ej. 100" required /></label></div><label className="message-label" htmlFor="quote-message">Dale forma a tu idea *<textarea id="quote-message" name="message" rows={3} placeholder="Diseño, colores, fecha deseada o cualquier detalle que quieras compartir…" minLength={10} maxLength={4000} required /></label><label className="honeypot" aria-hidden="true">Sitio web<input name="website" tabIndex={-1} autoComplete="off" /></label><label className="consent"><input type="checkbox" name="consent" required /><span>Acepto que Varcun utilice estos datos para atender mi solicitud de cotización. *</span></label><button className="button button-dark form-submit" disabled={formStatus === 'sending'}>{formStatus === 'sending' ? 'Enviando tu solicitud…' : 'Empecemos mi proyecto'}<ArrowUpRight size={19} /></button><p className={`form-status ${formStatus}`} role={formStatus === 'error' ? 'alert' : 'status'} aria-live="polite">{formMessage}</p><p className="form-footnote"><ShieldCheck size={14} /> Tus datos se usan para atender este proyecto.</p></form>
      </div></section>
    </main>

    <footer className="footer"><BrandBackdrop paused={motionPaused} /><div className="site-container"><div className="footer-top"><div><Brand light /><p>Artículos promocionales e impresión<br />para ideas que merecen hacerse realidad.</p></div><div className="footer-links"><span>EXPLORA</span><a href="#catalogo">Nuestros productos</a><a href="#servicios">Personalización</a><a href="#nosotros">Sobre Varcun</a></div><div className="footer-links"><span>EMPIEZA ALGO</span><a href="#contacto">Solicita una cotización <ArrowUpRight size={14} /></a><a href={catalogHref()} target="_blank" rel="noopener noreferrer">Catálogo 2026 <ArrowUpRight size={14} /></a><button aria-pressed={motionPaused} onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? 'Reanudar animaciones' : 'Pausar animaciones'}</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Varcun. Todos los derechos reservados.</span><span>Tu idea, nuestra impresión. <Sparkles size={13} /></span><a href="#inicio" aria-label="Volver al inicio"><ArrowUpRight size={18} /></a></div></div></footer>

    <div className="sr-only" role="status" aria-live="polite">{announce}</div>
    <dialog ref={dialogRef} className="category-dialog" onCancel={closeDialog} onClose={() => { setCategory(null); document.body.style.overflow = ''; }} onClick={event => { if (event.target === event.currentTarget) closeDialog(); }} aria-labelledby="category-dialog-title">{category && <><div className="dialog-header"><span className="section-kicker">CATÁLOGO 2026 · PÁGINAS {category.range}</span><button onClick={closeDialog} aria-label="Cerrar categoría" autoFocus><X size={22} /></button></div><div className="dialog-intro"><img src={`/images/${category.image}.webp`} alt="" /><div><h2 id="category-dialog-title">{category.name}</h2><p>{category.description}</p><a href={catalogHref(category.page)} target="_blank" rel="noopener noreferrer" className="text-link">Ver todos en el catálogo <ArrowUpRight size={17} /></a></div></div>{products.some(item => item.category === category.id) ? <><p className="dialog-label">UNA SELECCIÓN PARA INSPIRARTE</p><div className="dialog-products">{products.filter(item => item.category === category.id).map(productCard)}</div></> : <p className="dialog-no-sample">Consulta las fichas completas de esta categoría en el PDF: productos, códigos, medidas y opciones de personalización.</p>}<div className="dialog-bottom"><span>La disponibilidad se confirma al cotizar.</span><button className="button button-dark" onClick={() => quoteCategory(category.id)}>Cotizar esta categoría <ArrowUpRight size={17} /></button></div></>}</dialog>
  </>;
}

export default App;
