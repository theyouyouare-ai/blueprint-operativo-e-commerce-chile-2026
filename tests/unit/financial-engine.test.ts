import { describe, it, expect } from 'vitest';
import {
  calculateLandedCost,
  calculateSuggestedPVP,
  calculateUnitEconomics,
  ACQUISITION_CHANNELS,
} from '../../src/lib/financial-engine';

describe('Motor Financiero - E-commerce Chile 2026', () => {
  const DEFAULT_EXCHANGE_RATE = 940;

  describe('calculateLandedCost', () => {
    it('verifica que la base CIF sume exactamente FOB (proveedor) + Flete internacional', () => {
      const supplierFOB = 25.5;
      const internationalShipping = 8.5;
      const expectedCIF = 34.0;

      const result = calculateLandedCost(supplierFOB, internationalShipping, 0, DEFAULT_EXCHANGE_RATE);

      expect(result.supplierCostUSD).toBe(supplierFOB);
      expect(result.shippingCostUSD).toBe(internationalShipping);
      expect(result.fobUSD).toBe(supplierFOB);
      expect(result.fleteUSD).toBe(internationalShipping);
      expect(result.cifUSD).toBe(expectedCIF);
    });

    it('confirma la conversión exacta bajo el tipo de cambio fijado (USD 1 = CLP 940)', () => {
      const supplierFOB = 10;
      const internationalShipping = 10;
      const cifUSD = 20;

      const result = calculateLandedCost(supplierFOB, internationalShipping, 0, DEFAULT_EXCHANGE_RATE);

      const expectedCifCLP = cifUSD * DEFAULT_EXCHANGE_RATE; // 20 * 940 = 18.800
      expect(result.cifCLP).toBe(expectedCifCLP);
      expect(result.cifCLP).toBe(18800);
    });

    it('comprueba el cálculo del Arancel Ad-Valorem (6%) y del IVA de importación (19% según Ley N° 21.713)', () => {
      const supplierFOB = 550; // CIF > 500 aplica arancel aduanero 6%
      const internationalShipping = 50;
      const cifUSD = 600;
      const cifCLP = cifUSD * DEFAULT_EXCHANGE_RATE; // 564.000 CLP

      const result = calculateLandedCost({
        supplierCostUSD: supplierFOB,
        shippingCostUSD: internationalShipping,
        exchangeRate: DEFAULT_EXCHANGE_RATE,
        tariffRatePct: 6,
        localDeliveryCLP: 0,
      });

      // Arancel 6% sobre CIF
      const expectedTariffCLP = Math.round(cifCLP * 0.06); // 33.840 CLP
      expect(result.tariffRatePct).toBe(6);
      expect(result.tariffCLP).toBe(expectedTariffCLP);
      expect(result.tariffCLP).toBe(33840);

      // IVA 19% sobre Base Imponible Aduanera (CIF + Arancel)
      const ivaBaseCLP = cifCLP + expectedTariffCLP; // 597.840 CLP
      const expectedIvaImportCLP = Math.round(ivaBaseCLP * 0.19); // 113.590 CLP
      expect(result.ivaRatePct).toBe(19);
      expect(result.ivaImportCLP).toBe(expectedIvaImportCLP);
      expect(result.ivaImportCLP).toBe(113590);

      // Costo Landed Total en Aduana = CIF + Arancel + IVA
      const expectedLandedCostCLP = cifCLP + expectedTariffCLP + expectedIvaImportCLP;
      expect(result.landedCostCLP).toBe(expectedLandedCostCLP);
      expect(result.landedCostCLP).toBe(711430);
    });

    it('calcula correctamente IVA 19% sin exención bajo Ley 21.713 para compras menores a US$ 500 (exención eliminada)', () => {
      // Importación pequeña: US$ 15 FOB + US$ 5 Flete = US$ 20 CIF (< US$ 41 y < US$ 500)
      // La Ley N° 21.713 cobra el 19% de IVA de manera obligatoria a todas las importaciones
      const result = calculateLandedCost(15, 5, 0, DEFAULT_EXCHANGE_RATE);

      expect(result.cifUSD).toBe(20);
      expect(result.tariffRatePct).toBe(0); // Régimen simplificado exento de arancel 6%
      expect(result.tariffCLP).toBe(0);

      const expectedIva = Math.round(18800 * 0.19); // 3.572 CLP
      expect(result.ivaImportCLP).toBe(expectedIva);
      expect(result.landedCostCLP).toBe(18800 + expectedIva); // 22.372 CLP
    });
  });

  describe('calculateSuggestedPVP', () => {
    it('garantiza que el precio despejado retorne un Margen Neto >= 20% tras deducir costos de adquisición (CAC) y pasarelas (~3.51%)', () => {
      const testCases = [
        { landedCLP: 12000, cacCLP: 3800, targetMarginPct: 20, gatewayPct: 3.51 },
        { landedCLP: 22000, cacCLP: 4500, targetMarginPct: 20, gatewayPct: 3.51 },
        { landedCLP: 35000, cacCLP: 5000, targetMarginPct: 22, gatewayPct: 3.51 },
        { landedCLP: 50000, cacCLP: 6500, targetMarginPct: 25, gatewayPct: 3.80 },
      ];

      for (const tc of testCases) {
        const pvp = calculateSuggestedPVP(
          tc.landedCLP,
          tc.cacCLP,
          tc.targetMarginPct,
          tc.gatewayPct
        );

        // Desglose de costos a partir del PVP sugerido
        const gatewayFeeCLP = pvp * (tc.gatewayPct / 100);
        const grossProfitCLP = pvp - tc.landedCLP;
        const netProfitCLP = grossProfitCLP - tc.cacCLP - gatewayFeeCLP;
        const netMarginPct = (netProfitCLP / pvp) * 100;

        // Comprobación de que el margen neto supera o iguala la meta estipulada
        expect(netMarginPct).toBeGreaterThanOrEqual(tc.targetMarginPct);
        // Formato de precio chileno comercial (terminación en 990 o número redondo)
        expect(pvp % 10).toBe(0);
      }
    });

    it('devuelve precio comercial mínimo de $9.990 CLP para productos de ultra bajo costo', () => {
      const lowCostPVP = calculateSuggestedPVP(1000, 500, 20, 3.51);
      expect(lowCostPVP).toBeGreaterThanOrEqual(9990);
    });
  });

  describe('calculateUnitEconomics', () => {
    it('calcula la estructura completa con Break-even ROAS y matriz de escenarios', () => {
      const result = calculateUnitEconomics({
        supplierCostUSD: 12,
        shippingCostUSD: 4,
        adChannel: 'meta_ads',
        targetNetMarginPct: 22,
        gatewayFeePct: 3.51,
        exchangeRate: 940,
        fixedCostsMonthlyCLP: 1000000,
      });

      expect(result.landed.cifUSD).toBe(16);
      expect(result.cacCLP).toBe(ACQUISITION_CHANNELS.meta_ads.recommendedCAC_CLP);
      expect(result.suggestedPvpCLP).toBeGreaterThan(result.landed.totalLandedCLP);
      expect(result.netMarginPct).toBeGreaterThanOrEqual(20);
      expect(result.breakevenRoas).toBeGreaterThan(1.0);
      expect(result.breakevenUnitsMonthly).toBeGreaterThan(0);
      expect(result.scenarios.length).toBe(5);
    });
  });
});
