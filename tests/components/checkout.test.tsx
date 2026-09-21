// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkout } from '../../src/components/Checkout';
import { calculateTotals, type CheckoutSession } from '../../src/checkout/model';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url === '/api/checkout/config') return new Response(JSON.stringify({ mode: 'mock', provider: 'webpay_plus_mock' }));
    return new Response(JSON.stringify({ error: 'No disponible' }), { status: 503 });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('una sesión incompleta no bloquea una nueva compra ni consulta una orden inválida', async () => {
  sessionStorage.setItem('blueprint-checkout-v1', JSON.stringify({ order: { id: 'incompleta' }, paymentToken: 'a'.repeat(64) }));
  render(<Checkout />);
  await screen.findByText('TIENDA DEMO · SIN COBROS REALES');
  expect(screen.getByText('Tu carrito está vacío. Agrega un producto para continuar.')).toBeTruthy();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test.each(['null', '{json roto', '[{"productId":"desconocido","quantity":1}]'])('carrito persistido inválido %s permite agregar y eliminar productos', async saved => {
  localStorage.setItem('blueprint-cart-v1', saved);
  const user = userEvent.setup();
  render(<Checkout />);
  await screen.findByText('TIENDA DEMO · SIN COBROS REALES');
  expect((screen.getByRole('button', { name: 'Continuar a Webpay Plus simulado' }) as HTMLButtonElement).matches(':disabled')).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Agregar Cepillo de vapor para mascotas' }));
  expect(screen.getByTestId('checkout-total').textContent).toContain('28.790');
  expect((screen.getByRole('button', { name: 'Continuar a Webpay Plus simulado' }) as HTMLButtonElement).matches(':disabled')).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Eliminar Cepillo de vapor para mascotas' }));
  expect(screen.queryByTestId('checkout-total')).toBeNull();
  await waitFor(() => expect(JSON.parse(localStorage.getItem('blueprint-cart-v1')!)).toEqual([]));
});

test('una configuración caída informa el error y mantiene deshabilitado el pago', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 500 }));
  const user = userEvent.setup();
  render(<Checkout />);
  expect((await screen.findByRole('alert')).textContent).toContain('No se pudo cargar la configuración');
  await user.click(screen.getByRole('button', { name: 'Agregar Cepillo de vapor para mascotas' }));
  expect((screen.getByRole('button', { name: 'Continuar a Webpay Plus' }) as HTMLButtonElement).matches(':disabled')).toBe(true);
});

test.each(['mock', 'sandbox', 'production'] as const)('una sesión válida %s se conserva si falla la consulta de estado', async mode => {
  const saved: CheckoutSession = {
    paymentToken: 'a'.repeat(64),
    order: {
      id: 'ee786241-ed63-498c-92ac-641409321324', mode,
      provider: mode === 'mock' ? 'webpay_plus_mock' : 'webpay_plus', status: 'pending',
      createdAt: '2026-09-20T00:00:00.000Z', expiresAt: '2026-09-20T00:30:00.000Z',
      totals: calculateTotals([{ productId: 'cepillo-vapor', quantity: 1 }]), dte39: null,
    },
  };
  sessionStorage.setItem('blueprint-checkout-v1', JSON.stringify(saved));
  render(<Checkout />);
  expect((await screen.findByRole('alert')).textContent).toContain('No pudimos verificar esta orden');
  expect(fetch).toHaveBeenCalledWith(`/api/checkout/status/${saved.order.id}`, expect.objectContaining({ headers: { Authorization: `Bearer ${saved.paymentToken}` } }));
  expect(screen.queryByRole('button', { name: 'Agregar Cepillo de vapor para mascotas' })).toBeNull();
  expect(JSON.parse(sessionStorage.getItem('blueprint-checkout-v1')!)).toEqual(saved);
});

test.each(['unmount', 'pagehide', 'beforeunload'])('cancela la consulta de configuración pendiente al recibir %s', async reason => {
  let signal: AbortSignal | undefined;
  vi.mocked(fetch).mockImplementation((_url, options) => {
    signal = options?.signal ?? undefined;
    return new Promise<Response>((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('Cancelado', 'AbortError')), { once: true });
    });
  });
  const { unmount } = render(<Checkout />);
  expect(signal?.aborted).toBe(false);
  if (reason === 'unmount') unmount();
  else window.dispatchEvent(new Event(reason));
  await waitFor(() => expect(signal?.aborted).toBe(true));
  expect(screen.queryByRole('alert')).toBeNull();
});
