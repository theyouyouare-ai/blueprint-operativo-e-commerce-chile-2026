import React, { useEffect, useRef, useState } from 'react';
import { Download, Store } from 'lucide-react';
import { merchantSchema, SHOPIFY_CATALOG } from '../shopify/model';

export function ShopifyInstantGenerator() {
  const [form, setForm] = useState({ rut: '', storeName: 'Nova Chile Store', email: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const validation = merchantSchema.safeParse(form);
  const rutValid = merchantSchema.shape.rut.safeParse(form.rut).success;

  function update(field: keyof typeof form, value: string) {
    setForm(previous => ({ ...previous, [field]: value }));
    setError('');
    setStatus('');
  }

  async function download(kind: 'catalog' | 'theme') {
    if (!validation.success || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setStatus('Generando archivo…');
    try {
      const response = await fetch(`/api/shopify/download-${kind}`, {
        method: 'POST', mode: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
      });
      if (!response.ok) throw new Error('No se pudo generar el archivo. Revisa tus datos e inténtalo nuevamente.');
      const mime = kind === 'catalog' ? 'text/csv' : 'application/json';
      if (!response.headers.get('content-type')?.includes(mime)) throw new Error('El servidor devolvió un archivo inesperado. Inténtalo nuevamente.');
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = kind === 'catalog' ? 'catalogo-shopify-chile.csv' : 'tema-shopify-pro-chile.json';
      document.body.appendChild(link);
      try { link.click(); } finally {
        link.remove();
        // Give the browser time to start reading the download before releasing it.
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setStatus('Archivo generado. Revisa la descarga en tu navegador.');
    } catch (cause) {
      if (!controller.signal.aborted) {
        setStatus('');
        setError(cause instanceof Error && cause.name !== 'TimeoutError' ? cause.message : 'La descarga tardó demasiado. Inténtalo nuevamente.');
      }
    } finally {
      if (request.current === controller) request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const inputClass = 'mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600';
  return (
    <section className="space-y-6" aria-labelledby="shopify-title">
      <div className="rounded-2xl bg-stone-900 p-6 text-white sm:p-8">
        <Store className="mb-3 h-8 w-8 text-emerald-300" aria-hidden="true" />
        <h2 id="shopify-title" className="text-2xl font-bold sm:text-3xl">Generador Instantáneo de Tienda Shopify para Chile</h2>
        <p className="mt-3 max-w-3xl text-stone-300">Prepara cinco productos en CLP y una configuración de referencia para Dawn, con términos, devoluciones y garantía legal personalizados con el RUT de tu comercio.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-lg font-bold">1. Datos del comercio</h3>
          <p className="mt-2 text-sm text-stone-600">El RUT se valida por formato y dígito verificador. Se usa para generar tus archivos y no se guarda en el navegador.</p>
          <fieldset disabled={busy} className="mt-5 space-y-4 disabled:opacity-60">
            <div>
              <label htmlFor="shopify-rut" className="text-sm font-semibold">RUT del comercio *</label>
              <input id="shopify-rut" className={inputClass} value={form.rut} maxLength={16} placeholder="12.345.678-5" autoComplete="off" aria-invalid={Boolean(form.rut) && !rutValid} aria-describedby="shopify-rut-help" onChange={event => update('rut', event.target.value)} />
              <p id="shopify-rut-help" className={`mt-1 text-sm ${form.rut && !rutValid ? 'text-red-700' : 'text-stone-500'}`}>
                {!form.rut ? 'Ingresa un RUT válido para habilitar las descargas.' : rutValid ? 'Formato y dígito verificador válidos.' : 'RUT inválido. Revisa el formato y el dígito verificador.'}
              </p>
            </div>
            <div>
              <label htmlFor="shopify-name" className="text-sm font-semibold">Nombre o razón social *</label>
              <input id="shopify-name" className={inputClass} value={form.storeName} maxLength={100} onChange={event => update('storeName', event.target.value)} />
            </div>
            <div>
              <label htmlFor="shopify-email" className="text-sm font-semibold">Correo de atención (opcional)</label>
              <input id="shopify-email" type="email" className={inputClass} value={form.email} maxLength={254} onChange={event => update('email', event.target.value)} />
            </div>
            <div>
              <label htmlFor="shopify-address" className="text-sm font-semibold">Domicilio del proveedor (opcional)</label>
              <input id="shopify-address" className={inputClass} value={form.address} maxLength={200} onChange={event => update('address', event.target.value)} />
            </div>
          </fieldset>
          {rutValid && !validation.success && <p className="mt-3 text-sm text-red-700">Revisa el nombre del comercio y el formato del correo.</p>}
          <p className="mt-4 text-xs text-stone-500">Si omites correo o domicilio, quedarán marcados como pendientes. Completa estos datos antes de publicar las políticas.</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h3 className="text-lg font-bold">2. Catálogo inicial · Mascotas</h3>
          <p className="mt-2 text-sm text-stone-600">1 héroe + 3 complementarios + 1 adicional. Selección inicial con precios sugeridos; valida demanda, proveedor y margen antes de vender.</p>
          <ul className="mt-4 divide-y divide-stone-100">
            {SHOPIFY_CATALOG.map(product => (
              <li key={product.handle} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div><p className="font-semibold">{product.title}</p><p className="text-xs text-stone-500">{product.role === 'heroe' ? 'Héroe' : product.role === 'complementario' ? 'Complementario' : 'Adicional'}</p></div>
                <span className="whitespace-nowrap">{product.priceCLP.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">CSV UTF-8 · IVA incluido · Productos en borrador, sin fotos y con stock cero. Configura CLP e impuestos incluidos en Shopify antes de importar.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="text-lg font-bold">3. Descarga y configura Shopify</h3>
        <p className="mt-2 text-sm text-stone-700">El JSON contiene parámetros, instrucciones y plantillas legales. No es un tema instalable: agrega Dawn en Shopify y aplica la configuración desde su editor. Un tema completo se sube como ZIP; pagos, despacho y emisión de boletas se configuran por separado.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={!validation.success || busy} onClick={() => download('catalog')} className="flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />Descargar Catálogo CSV (5 Ganadores)
          </button>
          <button type="button" disabled={!validation.success || busy} onClick={() => download('theme')} className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />Descargar Tema Shopify Pro (.JSON)
          </button>
        </div>
        <p role="status" className="mt-3 text-sm text-stone-700">{status}</p>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      </div>
    </section>
  );
}
