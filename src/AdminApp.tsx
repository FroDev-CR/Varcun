import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, Clock3, FilePenLine, Inbox, KeyRound, LogOut, Mail, RefreshCw, Search, ShieldCheck, Undo2 } from 'lucide-react';
import { contentFields, defaultContent, type SiteContent } from '../server/content';
import type { ContentRecord, ContentRevision, QuoteInbox, QuoteRecord } from '../server/admin-store';
import { categories, products, productImageHref } from './catalog';
import './admin.css';

type Session = { admin: { email: string }; expiresAt: string };
type Api = <T>(path: string, method?: string, body?: unknown) => Promise<T>;
const statuses = [{ id: 'nueva', label: 'Nueva' }, { id: 'en_revision', label: 'En revisión' }, { id: 'respondida', label: 'Respondida' }, { id: 'cerrada', label: 'Cerrada' }];
const date = (value: string) => new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Costa_Rica' }).format(new Date(value));
const message = (error: unknown) => error instanceof Error ? error.message : 'No pudimos completar la operación.';
const categoryName = (id: string) => categories.find(item => item.id === id)?.short ?? (id === 'material-cliente' ? 'Materiales del cliente' : 'Otro proyecto');

function AdminBrand() { return <a href="/admin" className="admin-brand"><img src="/logo-mark.svg" width="38" height="38" alt="" /><span>VARCUN<small>ADMINISTRACIÓN</small></span></a>; }

function Access({ api, onAccess, token, initialError }: { api: Api; onAccess: (session: Session) => void; token: string; initialError: string }) {
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (token && password !== form.get('confirmation')) { setError('Las contraseñas no coinciden.'); setBusy(false); return; }
    try { onAccess(await api<Session>(token ? '/activate' : '/login', 'POST', { email: String(form.get('email')).trim(), password, ...(token ? { token } : {}) })); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  return <div className="admin-access"><div className="admin-access-story"><AdminBrand /><div><span className="admin-eyebrow">TU MARCA, BIEN ORGANIZADA</span><h1>Las ideas llegan.<br /><span>Tú les das forma.</span></h1><p>Atiende tus cotizaciones y mantén los textos de Varcun al día, desde un mismo lugar.</p><div className="admin-access-features"><span><Inbox size={20} />Tu buzón de proyectos</span><span><FilePenLine size={20} />Tu web, con tus palabras</span><span><ShieldCheck size={20} />Acceso privado</span></div></div><small>Tu idea, nuestra impresión.</small></div><main className="admin-access-main"><form className="admin-access-form" onSubmit={submit}><span className="admin-lock"><KeyRound size={24} /></span><span className="admin-eyebrow">PANEL VARCUN</span><h2>{token ? 'Activa tu acceso.' : 'Qué bueno verte.'}</h2><p>{token ? 'Elige tu contraseña para entrar al panel. Este enlace solo puede usarse una vez.' : 'Entra con tu correo y contraseña de administrador.'}</p><label>Correo electrónico<input name="email" type="email" autoComplete="username" maxLength={254} required /></label><label>{token ? 'Crea una contraseña' : 'Contraseña'}<input name="password" type="password" autoComplete={token ? 'new-password' : 'current-password'} minLength={token ? 12 : 1} maxLength={128} required /></label>{token && <><small className="admin-help">Al menos 12 caracteres. Puedes usar una frase larga que recuerdes.</small><label>Confirma tu contraseña<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label></>}<p className="admin-error" role="alert">{error}</p><button className="admin-button admin-primary" disabled={busy}>{busy ? 'Comprobando…' : token ? 'Activar mi panel' : 'Entrar al panel'}<ArrowRight size={17} /></button><a className="admin-back-link" href="/"><ArrowLeft size={15} />Volver a la web</a></form></main></div>;
}

function QuoteDetail({ id, api, onSaved, onDirty }: { id: string; api: Api; onSaved: () => void; onDirty: (dirty: boolean) => void }) {
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [status, setStatus] = useState('nueva');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty = Boolean(quote && (status !== quote.status || notes !== quote.internal_notes));
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => event.preventDefault(); if (dirty) window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  useEffect(() => {
    let active = true; setQuote(null); setError(''); setSaved(false);
    api<{ quote: QuoteRecord }>(`/quotes/${id}`).then(({ quote }) => { if (active) { setQuote(quote); setStatus(quote.status); setNotes(quote.internal_notes); } }).catch(error => { if (active) setError(message(error)); });
    return () => { active = false; };
  }, [id, api]);
  async function save(event: FormEvent) {
    event.preventDefault(); if (!quote) return; setBusy(true); setSaved(false); setError('');
    try { const result = await api<{ quote: QuoteRecord }>(`/quotes/${id}`, 'PATCH', { status, internal_notes: notes, expectedUpdatedAt: quote.updated_at }); setQuote(result.quote); setStatus(result.quote.status); setNotes(result.quote.internal_notes); setSaved(true); onSaved(); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  if (!quote) return <div className="admin-empty" role="status">{error || 'Abriendo la cotización…'}</div>;
  const selectedProducts = quote.product_codes.map(code => products.find(product => product.code === code)).filter(product => product !== undefined);
  return <article className="admin-quote-detail"><div className="admin-detail-top"><span className="admin-eyebrow">COTIZACIÓN · {quote.id.slice(0, 8).toUpperCase()}</span><span className="admin-status" data-status={quote.status}>{statuses.find(item => item.id === quote.status)?.label}</span></div><h2>{quote.company || quote.name}</h2><p className="admin-muted">{date(quote.created_at)}</p><div className="admin-contact-grid"><div><small>CONTACTO</small><strong>{quote.name}</strong><a href={`mailto:${quote.email}`}>{quote.email}<ArrowUpRight size={13} /></a>{quote.phone && <a href={`tel:${quote.phone.replace(/[^+\d]/g, '')}`}>{quote.phone}</a>}</div><div><small>PROYECTO</small><strong>{categoryName(quote.category)}</strong><span>{quote.quantity.toLocaleString('es-CR')} unidades aprox.</span></div></div><div className="admin-message"><span className="admin-eyebrow">LO QUE TIENE EN MENTE</span><p>{quote.message}</p></div>{selectedProducts.length > 0 && <div className="admin-request-products"><span className="admin-eyebrow">PRODUCTOS SELECCIONADOS</span>{selectedProducts.map(product => <a key={product.code} href={`/productos/${product.code.toLowerCase()}`} target="_blank" rel="noopener noreferrer"><img src={productImageHref(product)} alt="" /><span>{product.name}<small>{product.code}</small></span><ArrowUpRight size={14} /></a>)}</div>}<form className="admin-followup" onSubmit={save}><h3>Seguimiento interno</h3><label>Estado<select value={status} onChange={event => { setStatus(event.target.value); setSaved(false); }}>{statuses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Notas internas<textarea value={notes} onChange={event => { setNotes(event.target.value); setSaved(false); }} rows={4} maxLength={4000} placeholder="Próximos pasos, detalles acordados, recordatorios…" /></label><small className="admin-help">Estas notas son privadas. El estado registra tu seguimiento; no envía un mensaje al cliente.</small><p role="status" className={error ? 'admin-error' : 'admin-success'}>{error || (saved ? 'Seguimiento guardado.' : '')}</p><button className="admin-button admin-primary" disabled={busy || (status === quote.status && notes === quote.internal_notes)}>{busy ? 'Guardando…' : 'Guardar seguimiento'}<Check size={16} /></button></form></article>;
}

function Mailbox({ api }: { api: Api }) {
  const [inbox, setInbox] = useState<QuoteInbox>({ quotes: [], total: 0, counts: {} });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todas');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailDirty, setDetailDirty] = useState(false);
  useEffect(() => {
    let active = true; setLoading(true);
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({ search, status, page: String(page) });
      api<QuoteInbox>(`/quotes?${params}`).then(value => { if (active) { setInbox({ ...value, counts: value.counts ?? {} }); setError(''); } }).catch(error => { if (active) setError(message(error)); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timeout); };
  }, [api, search, status, page, refresh]);
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === 'visible') setRefresh(value => value + 1); }, 60_000); return () => clearInterval(timer); }, []);
  return <><header className="admin-section-header"><div><span className="admin-eyebrow">DE UNA IDEA A UN PROYECTO</span><h1>Tu buzón de cotizaciones.</h1><p>Todo lo que llega desde tu web, listo para darle seguimiento.</p></div><button className="admin-button admin-secondary" onClick={() => setRefresh(value => value + 1)} disabled={loading}><RefreshCw size={15} />Actualizar</button></header><div className="admin-stats">{statuses.map((item, index) => <button key={item.id} data-active={status === item.id} onClick={() => { setStatus(status === item.id ? 'todas' : item.id); setPage(0); }}><span className={`admin-stat-icon icon-${index}`}>{index === 0 ? <Mail size={19} /> : index === 1 ? <Clock3 size={19} /> : <CheckCircle2 size={19} />}</span><span><small>{item.label === 'Nueva' ? 'Nuevas' : item.label === 'Respondida' ? 'Respondidas' : item.label === 'Cerrada' ? 'Cerradas' : item.label}</small><strong>{inbox.counts[item.id] ?? 0}</strong></span></button>)}</div><div className="admin-inbox"><section className="admin-inbox-list" aria-label="Cotizaciones recibidas"><div className="admin-inbox-toolbar"><label className="admin-search"><Search size={17} /><input aria-label="Buscar cotizaciones" placeholder="Nombre, correo o empresa" value={search} maxLength={120} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label><select aria-label="Filtrar por estado" value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="todas">Todos los estados</option>{statuses.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div><div className="admin-list-label"><span>{inbox.total} cotizaciones</span>{loading && <span role="status">Actualizando…</span>}</div>{error ? <p className="admin-error" role="alert">{error}</p> : !loading && inbox.quotes.length === 0 ? <div className="admin-empty"><Inbox size={32} /><h3>{search || status !== 'todas' ? 'Sin resultados con estos filtros.' : 'Tu próximo proyecto empieza aquí.'}</h3><p>{search || status !== 'todas' ? 'Prueba con otro nombre o estado.' : 'Las solicitudes de la web aparecerán en este buzón.'}</p></div> : inbox.quotes.map(quote => <button key={quote.id} className="admin-inbox-item" data-selected={selected === quote.id} onClick={() => { if (selected === quote.id) return; if (!detailDirty || window.confirm("Tienes cambios sin guardar. ¿Quieres abrir otra cotización?")) { setDetailDirty(false); setSelected(quote.id); } }}><div><strong>{quote.company || quote.name}</strong><span className="admin-status" data-status={quote.status}>{statuses.find(item => item.id === quote.status)?.label}</span></div><p>{categoryName(quote.category)} · {quote.quantity.toLocaleString('es-CR')} unidades</p><small>{quote.name} · {date(quote.created_at)}</small></button>)}<div className="admin-pagination"><button aria-label="Página anterior" disabled={page === 0 || loading} onClick={() => setPage(value => value - 1)}><ArrowLeft size={16} /></button><span>Página {page + 1}</span><button aria-label="Página siguiente" disabled={(page + 1) * 20 >= inbox.total || loading} onClick={() => setPage(value => value + 1)}><ArrowRight size={16} /></button></div></section><section className="admin-inbox-body" aria-label="Detalle de cotización">{selected ? <QuoteDetail key={selected} id={selected} api={api} onDirty={setDetailDirty} onSaved={() => setRefresh(value => value + 1)} /> : <div className="admin-empty admin-choose"><span className="admin-empty-icon"><Inbox size={32} /></span><h2>Una nueva conversación.</h2><p>Selecciona una cotización para ver el proyecto, los productos y los datos de contacto.</p></div>}</section></div></>;
}

function ContentEditor({ api }: { api: Api }) {
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [draft, setDraft] = useState<SiteContent>({ ...defaultContent });
  const [group, setGroup] = useState('Inicio');
  const [history, setHistory] = useState<ContentRevision[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const dirty = record ? contentFields.some(field => draft[field.key] !== record.data[field.key]) : false;
  useEffect(() => { let active = true; api<ContentRecord>('/content').then(value => { if (active) { setRecord(value); setDraft(value.data); } }).catch(error => setError(message(error))); api<{ revisions: ContentRevision[] }>('/content/history').then(value => { if (active) setHistory(value.revisions); }).catch(() => {}); return () => { active = false; }; }, [api]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; if (dirty) window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  async function publish(event: FormEvent) {
    event.preventDefault(); if (!record) return; setBusy(true); setError(''); setSuccess('');
    try { const value = await api<ContentRecord>('/content', 'PUT', { data: draft, version: record.version }); setRecord(value); setDraft(value.data); setSuccess('Cambios publicados. Ya puedes verlos en tu web.'); void api<{ revisions: ContentRevision[] }>('/content/history').then(value => setHistory(value.revisions)).catch(() => {}); }
    catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  }
  return <><header className="admin-section-header"><div><span className="admin-eyebrow">TU WEB, CON TUS PALABRAS</span><h1>Contenido de la web.</h1><p>Edita, revisa y publica. Cada cambio conserva la versión anterior.</p></div><a href="/" target="_blank" rel="noopener noreferrer" className="admin-button admin-secondary">Ver la web<ArrowUpRight size={15} /></a></header>{!record ? <div className="admin-empty" role="status">{error || 'Cargando los textos…'}</div> : <div className="admin-content-layout"><form className="admin-content-form" onSubmit={publish}><div className="admin-content-tabs">{[...new Set(contentFields.map(field => field.group))].map(value => <button type="button" key={value} data-active={group === value} onClick={() => setGroup(value)}>{value}</button>)}</div><div className="admin-editor-fields"><div className="admin-editor-heading"><h2>{group}</h2><span>{dirty ? 'Cambios sin publicar' : `Versión ${record.version}`}</span></div>{contentFields.filter(field => field.group === group).map(field => <label key={field.key}>{field.label}<textarea aria-label={field.label} rows={field.max > 300 ? 4 : 2} value={draft[field.key]} maxLength={field.max} required onChange={event => { setDraft(current => ({ ...current, [field.key]: event.target.value })); setSuccess(''); }} /><small>{draft[field.key].length} / {field.max} caracteres</small></label>)}<p className="admin-error" role="alert">{error}</p><p className="admin-success" role="status">{success}</p><div className="admin-publish-actions"><button className="admin-button admin-primary" disabled={!dirty || busy}>{busy ? 'Publicando…' : 'Publicar cambios'}<Check size={17} /></button><button type="button" className="admin-button admin-secondary" disabled={!dirty || busy} onClick={() => { setDraft(record.data); setSuccess(''); setError(''); }}><Undo2 size={15} />Descartar cambios</button></div><small className="admin-help">Los saltos de línea se conservan en los títulos. Los cambios se muestran al publicarlos.</small></div></form><aside className="admin-content-aside"><div className="admin-copy-preview"><span className="admin-eyebrow">VISTA PREVIA DEL INICIO</span><img src="/logo-mark.svg" width="43" height="43" alt="Varcun" /><h2>{draft.heroTitle}<br /><span>{draft.heroHighlight}</span></h2><p>{draft.heroDescription}</p><span className="admin-preview-chip">Encuentra tu producto ↗</span></div><div className="admin-history"><h3><Clock3 size={17} />Versiones anteriores</h3><p>Carga una versión como borrador y pulsa “Publicar cambios” cuando estés listo.</p>{history.length ? history.map(revision => <button key={revision.id} onClick={() => { setDraft(revision.data); setSuccess('Versión anterior cargada como borrador.'); setError(''); }}><span>Versión {revision.version}<small>{date(revision.updated_at!)}</small></span><ArrowDownToLine size={15} /></button>) : <small>Tus versiones aparecerán después del primer cambio.</small>}<button className="admin-original-copy" onClick={() => { setDraft({ ...defaultContent }); setSuccess('Textos originales cargados como borrador.'); setError(''); }}><Undo2 size={15} />Cargar textos originales</button></div></aside></div>}</>;
}

function Security({ api }: { api: Api }) {
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); setError(''); setSuccess('');
    if (values.get('newPassword') !== values.get('confirmation')) { setError('Las contraseñas nuevas no coinciden.'); return; }
    setBusy(true);
    try { await api('/password', 'POST', { currentPassword: values.get('currentPassword'), newPassword: values.get('newPassword') }); form.reset(); setSuccess('Contraseña actualizada. Las otras sesiones se cerraron.'); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <><header className="admin-section-header"><div><span className="admin-eyebrow">TU ACCESO PRIVADO</span><h1>Seguridad.</h1><p>Mantén tu cuenta protegida con una contraseña que solo tú conozcas.</p></div></header><form className="admin-security-form" onSubmit={submit}><h2>Cambiar contraseña</h2><label>Contraseña actual<input type="password" name="currentPassword" autoComplete="current-password" maxLength={128} required /></label><label>Nueva contraseña<input type="password" name="newPassword" autoComplete="new-password" minLength={12} maxLength={128} required /></label><label>Confirma la nueva contraseña<input type="password" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required /></label><small className="admin-help">Al menos 12 caracteres. Al cambiarla, las otras sesiones dejan de tener acceso.</small><p className="admin-error" role="alert">{error}</p><p className="admin-success" role="status">{success}</p><button className="admin-button admin-primary" disabled={busy}>{busy ? 'Guardando…' : 'Actualizar contraseña'}<KeyRound size={16} /></button></form></>;
}

export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState('');
  const [tab, setTab] = useState<'quotes' | 'content' | 'security'>('quotes');
  const [contentVisited, setContentVisited] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('activar') ?? '');
  const api = useCallback(async <T,>(path: string, method = 'GET', body?: unknown): Promise<T> => {
    const response = await fetch(`/api/admin${path}`, { method, credentials: 'same-origin', cache: 'no-store', ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
    const value = await response.json().catch(() => ({ message: 'No pudimos conectar con el panel.' }));
    if (!response.ok) { if (response.status === 401) setSession(null); throw new Error(value.message || 'No pudimos completar la operación.'); }
    return value as T;
  }, []);
  useEffect(() => {
    document.title = 'Administración · Varcun';
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
    let active = true;
    api<Session>('/session').then(value => { if (active) setSession(value); }).catch(error => { if (active && !message(error).includes('Inicia sesión')) setInitialError(message(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api]);
  async function logout() { try { await api('/logout', 'POST', {}); setSession(null); setToken(''); } catch (error) { setOperationError(message(error)); } }
  if (loading) return <div className="admin-app admin-loading" role="status"><img src="/logo-mark.svg" width="44" height="44" alt="" />Abriendo tu panel…</div>;
  if (!session) return <div className="admin-app"><Access api={api} token={token} initialError={initialError} onAccess={value => { setSession(value); setToken(''); setInitialError(''); }} /></div>;
  return <div className="admin-app admin-shell"><aside className="admin-sidebar"><AdminBrand /><span className="admin-sidebar-label">TU ESPACIO DE TRABAJO</span><nav aria-label="Administración"><button data-active={tab === 'quotes'} onClick={() => setTab('quotes')}><Inbox size={19} />Cotizaciones</button><button data-active={tab === 'content'} onClick={() => { setContentVisited(true); setTab('content'); }}><FilePenLine size={19} />Contenido de la web</button><button data-active={tab === 'security'} onClick={() => setTab('security')}><ShieldCheck size={19} />Seguridad</button></nav><div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noopener noreferrer">Visitar Varcun<ArrowUpRight size={16} /></a><div className="admin-account"><span>{session.admin.email.slice(0, 1).toUpperCase()}</span><div><strong>Administrador</strong><small>{session.admin.email}</small></div></div><button onClick={logout}><LogOut size={16} />Cerrar sesión</button></div></aside><main className="admin-workspace"><div className="admin-workspace-top"><span><span className="admin-online-dot" />Tu espacio privado</span><a href="/" target="_blank" rel="noopener noreferrer">varcun.com<ArrowUpRight size={13} /></a></div>{operationError && <p className="admin-error" role="alert">{operationError}</p>}<div hidden={tab !== 'quotes'}><Mailbox api={api} /></div>{contentVisited && <div hidden={tab !== 'content'}><ContentEditor api={api} /></div>}{tab === 'security' && <Security api={api} />}</main></div>;
}
