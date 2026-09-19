import { MercadoPagoCheckoutService } from './mercadopago-checkout';
import { getCheckoutService } from './checkout-service';
import { paymentConfig } from './payment-config';
import { WebpayCheckoutService } from './webpay-checkout';
let mp: MercadoPagoCheckoutService | undefined;
let live: WebpayCheckoutService | undefined;
export function getPaymentRuntime() {
  const config = paymentConfig();
  if (config.mode === 'mock') return { config, mock: getCheckoutService(), live: undefined };
  if (config.provider === 'mercadopago') {
    mp ??= new MercadoPagoCheckoutService(config);
    return { config, mp, live: undefined, mock: undefined };
  }
  live ??= new WebpayCheckoutService(config);
  return { config, live, mock: undefined };
}
