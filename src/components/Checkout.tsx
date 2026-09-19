import React, { useEffect, useRef, useState } from 'react';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, CheckCircle2, Minus, Plus, Trash2 } from 'lucide-react';
import { PRODUCTS, FREE_SHIPPING_FROM_CLP, SHIPPING_CLP, calculateTotals, cartSchema, customerSchema, clp, type CartItem, type CheckoutSession, type PublicOrder } from '../checkout/model';

const CART_KEY = 'blueprint-cart-v1';
const SESSION_KEY = 'blueprint-checkout-v1';
function readCart(): CartItem[] {
  try { const result = cartSchema.safeParse(JSON.parse(localStorage.getItem(CART_KEY) || '[]')); return result.success ? result.data : []; } catch { return []; }
}
function readSession(): CheckoutSession | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return saved?.order?.id && /^[a-f0-9]{64}$/.test(saved.paymentToken) ? saved : null;
  } catch { return null; }
}
async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Servicio temporalmente no disponible');
  return body;
}
const inputClass = 'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400';

export function Checkout() {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const [session, setSession] = useState<CheckoutSession | null>(readSession);
  const [busy, setBusy] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'mock' | 'sandbox' | 'production' | null>(null);
  const [provider, setProvider] = useState('Webpay Plus');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(Boolean(session));
  const submission = useRef<{ body: string; key: string } | null>(null);
  const locked = useRef(false);
  useEffect(() => {
    api<{ mode: 'mock' | 'sandbox' | 'production'; provider: string }>('/api/checkout/config').then(config => { setPaymentMode(config.mode); setProvider(config.provider === 'mercadopago' ? 'Mercado Pago' : 'Webpay Plus'); }).catch(() => setError('No se pudo cargar la configuración de pagos. Recarga antes de continuar.'));
  }, []);
  useEffect(() => { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* Cart remains usable without storage. */ } }, [items]);
  const saveSession = (next: CheckoutSession | null) => {
    setSession(next);
    try { if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); else sessionStorage.removeItem(SESSION_KEY); } catch { /* In-memory flow remains available. */ }
  };
  useEffect(() => {
    const saved = readSession();
    if (!saved) { setChecking(false); return; }
    let cancelled = false;
    api<{ order: PublicOrder }>(`/api/checkout/status/${saved.order.id}`, { headers: { Authorization: `Bearer ${saved.paymentToken}` } })
      .then(({ order }) => { if (!cancelled) { saveSession({ ...saved, order }); if (order.status === 'paid') setItems([]); } })
      .catch(() => { if (!cancelled) { setError('No pudimos verificar esta orden. Consérvala y consulta su estado antes de intentar otro pago.'); } })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  const totals = session?.order.totals ?? (items.length ? calculateTotals(items) : null);
  const changeQuantity = (productId: string, delta: number) => {
    setItems(current => {
      const old = current.find(item => item.productId === productId);
      const quantity = Math.min(10, (old?.quantity || 0) + delta);
      return quantity <= 0 ? current.filter(item => item.productId !== productId) : old ? current.map(item => item.productId === productId ? { ...item, quantity } : item) : [...current, { productId, quantity }];
    });
  };
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || !items.length || session || !paymentMode) return;
    const customer = customerSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!customer.success) { setError(customer.error.issues.map(issue => issue.message).join('. ')); return; }
    locked.current = true; setBusy(true); setError('');
    const body = JSON.stringify({ items, customer: customer.data });
    if (submission.current?.body !== body) submission.current = { body, key: crypto.randomUUID() };
    try {
      const next = await api<CheckoutSession>('/api/checkout/process', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': submission.current.key }, body });
      saveSession(next);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo iniciar el pago'); }
    finally { setBusy(false); locked.current = false; }
  }
  async function confirm(outcome: 'approve' | 'reject') {
    if (!session || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const { order } = await api<{ order: PublicOrder }>('/api/checkout/mock-confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: session.order.id, paymentToken: session.paymentToken, outcome }) });
      saveSession({ ...session, order });
      if (order.status === 'paid') setItems([]);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo confirmar el pago'); }
    finally { setBusy(false); locked.current = false; }
  }
  async function refreshStatus() {
    if (!session || busy) return;
    setBusy(true); setError('');
    try {
      const { order } = await api<{ order: PublicOrder }>(`/api/checkout/status/${session.order.id}`, { headers: { Authorization: `Bearer ${session.paymentToken}` } });
      saveSession({ ...session, order });
      if (order.status === 'paid') setItems([]);
    } catch (err) { setError(err instanceof Error ? err.message : 'Estado pendiente de verificación'); }
    finally { setBusy(false); }
  }
  function redirectToPayment() {
    if (!session?.redirect) return;
    try {
      // Capability must survive full-page bank navigation. Do not proceed if storage is blocked.
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      const url = new URL(session.redirect.url);
      if (session.order.provider === 'mercadopago') {
        if (url.protocol !== 'https:' || !['www.mercadopago.cl', 'sandbox.mercadopago.cl'].includes(url.hostname) || url.port || url.username || url.password) throw new Error('Destino de pago inválido');
        window.location.assign(url.href); return;
      }
      const host = session.order.mode === 'production' ? 'webpay3g.transbank.cl' : 'webpay3gint.transbank.cl';
      if (url.protocol !== 'https:' || url.hostname !== host) throw new Error('Destino de pago inválido');
      const form = document.createElement('form');
      form.method = 'POST'; form.action = url.href;
      const token = document.createElement('input'); token.type = 'hidden'; token.name = 'token_ws'; token.value = session.redirect.token;
      form.appendChild(token); document.body.appendChild(form); form.submit();
    } catch { setError('No se puede guardar la sesión o abrir la pasarela de pago. Habilita el almacenamiento de este sitio.'); }
  }
  const mode = session?.order.mode ?? paymentMode;
  function restart() { saveSession(null); submission.current = null; setError(''); }

  return <div className="min-h-screen bg-stone-100 text-stone-900">
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={17} /> Volver al blueprint</a>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">{mode === 'production' ? `${provider.toUpperCase()} · PAGOS REALES` : mode === 'sandbox' ? `${provider.toUpperCase()} SANDBOX · SIN COBROS REALES` : mode === 'mock' ? 'TIENDA DEMO · SIN COBROS REALES' : 'VERIFICANDO ENTORNO DE PAGO'}</span>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Blueprint Chile / Tienda</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Tu compra, paso a paso.</h1>
      <p className="mt-3 max-w-2xl text-sm text-stone-600">Carrito, despacho y pago en pesos chilenos. Precios con IVA incluido.</p>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {error && session?.order.mode === 'mock' && <button onClick={restart} className="mt-3 text-sm font-semibold underline">Descartar sesión de prueba</button>}
      {checking ? <p role="status" className="mt-8">Recuperando tu orden…</p> : <div className="mt-8 grid items-start gap-7 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {!session && <>
            <section aria-label="Productos" className="grid gap-3 sm:grid-cols-3">
              {PRODUCTS.map(product => <article key={product.id} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-4">
                <span aria-hidden="true" className="mb-4 flex h-20 items-center justify-center rounded-xl bg-stone-50 text-4xl">{product.icon}</span>
                <h2 className="text-sm font-bold">{product.name}</h2><p className="mt-1 text-xs text-stone-500">{product.description}</p>
                <p className="mb-3 mt-auto pt-3 font-bold">{clp(product.priceCLP)}</p>
                <button disabled={busy || items.some(item => item.productId === product.id && item.quantity >= 10)} onClick={() => changeQuantity(product.id, 1)} className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40" aria-label={`Agregar ${product.name}`}>Agregar al carrito</button>
              </article>)}
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold"><ShoppingBag size={19} /> Tu carrito</h2>
              {!items.length ? <p className="mt-4 text-sm text-stone-500">Tu carrito está vacío. Agrega un producto para continuar.</p> : <ul className="mt-2 divide-y divide-stone-100">{items.map(item => {
                const product = PRODUCTS.find(product => product.id === item.productId)!;
                return <li key={item.productId} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="text-sm font-semibold">{product.name}</p><p className="text-xs text-stone-500">{clp(product.priceCLP)} / unidad</p></div>
                  <div className="flex items-center gap-3"><button disabled={busy} onClick={() => changeQuantity(item.productId, -1)} aria-label={`Reducir ${product.name}`} className="rounded border p-1.5"><Minus size={14}/></button><span aria-label={`Cantidad ${product.name}`}>{item.quantity}</span><button disabled={busy || item.quantity >= 10} onClick={() => changeQuantity(item.productId, 1)} aria-label={`Aumentar ${product.name}`} className="rounded border p-1.5 disabled:opacity-40"><Plus size={14}/></button><button disabled={busy} onClick={() => setItems(current => current.filter(row => row.productId !== item.productId))} aria-label={`Eliminar ${product.name}`} className="p-1.5 text-stone-500"><Trash2 size={15}/></button></div></li>;
              })}</ul>}
            </section>
            <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold">Datos de contacto y despacho</h2>
              <p className="mt-1 text-xs text-stone-500">{mode === 'production' ? 'Tus datos se utilizan para identificar y despachar tu compra.' : 'Usa datos ficticios para probar este entorno.'}</p>
              <fieldset disabled={busy || !items.length || !paymentMode} className="mt-5 grid gap-4 sm:grid-cols-2 disabled:opacity-50">
                <label className="text-sm font-medium sm:col-span-2">Nombre completo<input name="name" autoComplete="name" required minLength={3} maxLength={100} className={inputClass}/></label>
                <label className="text-sm font-medium">Tipo de documento<select name="documentType" className={inputClass}><option>RUT</option><option>DNI</option></select></label>
                <label className="text-sm font-medium">RUT / DNI<input name="document" required maxLength={24} placeholder="12.345.678-5" className={inputClass}/></label>
                <label className="text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass}/></label>
                <label className="text-sm font-medium">Teléfono (+569)<input name="phone" type="tel" autoComplete="tel" placeholder="+56912345678" required className={inputClass}/></label>
                <label className="text-sm font-medium sm:col-span-2">Dirección (calle, número y departamento)<input name="address" autoComplete="street-address" required minLength={5} maxLength={200} className={inputClass}/></label>
                <label className="text-sm font-medium">Comuna<input name="commune" autoComplete="address-level2" required minLength={2} maxLength={80} className={inputClass}/></label>
                <label className="text-sm font-medium">Región<input name="region" autoComplete="address-level1" required minLength={2} maxLength={80} className={inputClass}/></label>
                <button type="submit" className="mt-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-stone-950 disabled:opacity-40 sm:col-span-2">{busy ? 'Creando orden…' : paymentMode === 'mock' ? 'Continuar a Webpay Plus simulado' : `Continuar a ${provider}`}</button>
              </fieldset>
            </form>
          </>}
          {session && <section className="rounded-2xl border border-stone-200 bg-white p-6" aria-live="polite">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{session.order.mode === 'mock' ? 'Webpay Plus · Simulador' : `${provider} · ${session.order.mode}`}</span>
            <h2 className="mt-3 text-2xl font-bold">{session.order.status === 'paid' ? (session.order.mode === 'mock' ? 'Pago simulado aprobado' : `Pago aprobado por ${provider}`) : session.order.status === 'pending' ? (session.order.mode === 'mock' ? 'Confirma tu pago de prueba' : 'Orden pendiente de pago') : session.order.status === 'expired' ? 'La orden expiró' : (session.order.mode === 'mock' ? 'Pago simulado rechazado' : 'Pago no autorizado')}</h2>
            <p className="mt-3 break-all text-xs text-stone-500">Orden {session.order.id}</p>
            {session.order.status === 'pending' ? session.order.mode !== 'mock' ? <div className="mt-5 space-y-4"><p className="text-sm text-stone-600">{provider} recibe tus datos de pago en su sitio. El servidor verifica el resultado con el proveedor.</p><button disabled={busy} onClick={redirectToPayment} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white">Ir a {provider}</button><button disabled={busy} onClick={refreshStatus} className="ml-3 rounded-xl border px-5 py-3 text-sm font-semibold">Consultar estado del pago</button><p className="text-xs text-stone-500">Si ya pagaste, consulta el estado antes de volver al banco.</p></div> : <><p className="mt-5 text-sm text-stone-600">Elige el resultado que quieres probar. No se solicitan tarjetas ni se mueve dinero. La sesión dura 30 minutos.</p><div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} onClick={() => confirm('approve')} className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-40">{busy ? 'Procesando…' : 'Simular pago aprobado'}</button><button disabled={busy} onClick={() => confirm('reject')} className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-semibold disabled:opacity-40">Simular rechazo</button></div></> : <>
              {session.order.status === 'paid' && <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 className="mb-2"/><p>Orden confirmada. Desglose preparado para la posterior boleta electrónica DTE 39.</p><p className="mt-2 font-semibold">No se ha emitido ni enviado una boleta al SII.</p></div>}
              <button onClick={restart} className="mt-6 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white">{session.order.status === 'paid' ? session.order.mode === 'mock' ? 'Nueva compra de prueba' : 'Nueva compra' : 'Volver al checkout'}</button>
            </>}
          </section>}
        </div>
        <aside className="rounded-2xl border border-stone-200 bg-white p-6 lg:sticky lg:top-6" aria-label="Resumen financiero">
          <h2 className="text-lg font-bold">Resumen de tu compra</h2>
          {totals ? <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Productos netos</dt><dd>{clp(totals.productsNetCLP)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Gastos de envío netos</dt><dd>{clp(totals.shippingNetCLP)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-stone-100 pt-3"><dt>Neto (incluye envío)</dt><dd data-testid="checkout-net">{clp(totals.netCLP)}</dd></div>
            <div className="flex justify-between gap-3"><dt>IVA 19%</dt><dd data-testid="checkout-iva">{clp(totals.ivaCLP)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-stone-200 pt-4 text-xl font-extrabold"><dt>Total CLP</dt><dd data-testid="checkout-total">{clp(totals.totalCLP)}</dd></div>
          </dl> : <p className="mt-4 text-sm text-stone-500">Agrega productos para calcular tu total.</p>}
          <div className="mt-6 space-y-4 border-t border-stone-100 pt-5 text-xs text-stone-500"><p className="flex gap-2"><Truck size={17} className="shrink-0"/>Envío: {clp(SHIPPING_CLP)} con IVA. Gratis desde {clp(FREE_SHIPPING_FROM_CLP)} en productos.</p><p className="flex gap-2"><ShieldCheck size={17} className="shrink-0"/>El IVA está incluido, no se agrega dos veces. Neto = total ÷ 1,19, redondeado al peso.</p><p>Información tributaria: <a className="underline" href="https://www.sii.cl/factura_electronica/libros_boletas.pdf" target="_blank" rel="noreferrer">formato de boletas del SII</a>. El cálculo considera productos y envío afectos a IVA.</p></div>
        </aside>
      </div>}
    </main>
  </div>;
}
