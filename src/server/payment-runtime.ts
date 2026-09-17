import { getCheckoutService } from './checkout-service';
import { paymentConfig } from './payment-config';
import { WebpayCheckoutService } from './webpay-checkout';
let live: WebpayCheckoutService | undefined;
export function getPaymentRuntime() {
  const config = paymentConfig();
  if (config.mode === 'mock') return { config, mock: getCheckoutService(), live: undefined };
  live ??= new WebpayCheckoutService(config);
  return { config, live, mock: undefined };
}
