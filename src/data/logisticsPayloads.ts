/**
 * Módulo Secundario de Payloads JSON y Flujos de Integración Courier en Chile 2026
 * Estructuras de APIs reales para Blue Express, Chilexpress, Starken y Chazki
 */

export interface CourierApiTemplate {
  id: string;
  name: string;
  endpoint: string;
  method: 'POST' | 'GET';
  description: string;
  authHeader: string;
  jsonPayload: string;
  sampleResponse: string;
}

export const COURIER_API_TEMPLATES: CourierApiTemplate[] = [
  {
    id: 'blue-express-create',
    name: 'Blue Express - Creación de Envío con Locker PUDO',
    endpoint: 'https://api.bluex.cl/v2/shipments',
    method: 'POST',
    description: 'Generación de orden de despacho a domicilio o a casillero inteligente PUDO 24/7 con etiqueta automática.',
    authHeader: 'Authorization: Bearer <BLUE_API_TOKEN_CHILE>',
    jsonPayload: JSON.stringify(
      {
        serviceType: 'PUDO_LOCKER',
        accountNumber: 'CL-AURA-8812',
        sender: {
          name: 'Aura Market SpA (Bodega Central)',
          rut: '77.481.920-3',
          phone: '+56987654321',
          originComunaCode: '13124' // Pudahuel
        },
        recipient: {
          name: 'Camila Vergara',
          rut: '18.432.109-K',
          email: 'camila.vergara@gmail.com',
          phone: '+56976543210'
        },
        destination: {
          destinationType: 'LOCKER_PUDO',
          pudoId: 'PUDO-METRO-TOBALABA-04',
          streetName: 'Av. Providencia',
          streetNumber: '2100',
          comunaCode: '13123', // Providencia
          regionCode: '13'
        },
        parcel: {
          weightKg: 0.95,
          dimensions: { lengthCm: 24, widthCm: 18, heightCm: 12 },
          declaredValueCLP: 35980,
          description: 'Accesorios Mascotas - Fuente de Agua 2L'
        },
        options: {
          smsNotification: true,
          generateZplLabel: true
        }
      },
      null,
      2
    ),
    sampleResponse: JSON.stringify(
      {
        status: 'SUCCESS',
        trackingNumber: 'BX-CL-994821034',
        labelUrl: 'https://api.bluex.cl/v2/labels/BX-CL-994821034.pdf',
        zplData: '^XA^FO50,50^ADN,36,20^FDBLUE EXPRESS...^FS^XZ',
        estimatedDeliveryDate: '2026-09-17',
        chargedAmountCLP: 2990
      },
      null,
      2
    )
  },
  {
    id: 'chilexpress-priority',
    name: 'Chilexpress - Cotización y Emisión Priority Día Hábil',
    endpoint: 'https://api.chilexpress.cl/transport-orders/v1/orders',
    method: 'POST',
    description: 'Emisión de orden de transporte corporativa con garantía de entrega antes de las 12:00 hrs del día hábil siguiente.',
    authHeader: 'Cache-Control: no-cache \nOcp-Apim-Subscription-Key: <CHILEXPRESS_KEY>',
    jsonPayload: JSON.stringify(
      {
        header: {
          certificateNumber: 88129,
          customerCardNumber: '1849204'
        },
        detail: {
          reference: 'PEDIDO-AURA-8812',
          serviceTypeCode: 1, // 1 = Priority 10:30/12:00, 2 = Express 19:00
          productTypeCode: 1, // Encomienda
          declaredValueCLP: 45000,
          requiresLabel: true
        },
        origin: {
          countyCoverageCode: 'STGO',
          streetName: 'San Pablo',
          streetNumber: '9900'
        },
        destination: {
          countyCoverageCode: 'PROV',
          streetName: 'Pedro de Valdivia',
          streetNumber: '1420',
          apartment: 'Depto 304'
        },
        package: {
          weight: 1.2,
          height: 15,
          width: 20,
          length: 25
        }
      },
      null,
      2
    ),
    sampleResponse: JSON.stringify(
      {
        statusCode: 200,
        statusDescription: 'Operación Exitosa',
        data: {
          transportOrderNumber: '99201482910',
          label: 'JVBERi0xLjQKJcTl8uXr... (Base64 PDF)',
          coverageAlert: 'Zona con entrega normal día hábil siguiente',
          totalRateCLP: 3600
        }
      },
      null,
      2
    )
  },
  {
    id: 'starken-recaudacion-cod',
    name: 'Starken - Envío con Cobro Contra Entrega (COD)',
    endpoint: 'https://api.starken.cl/v1/shipments/cash-on-delivery',
    method: 'POST',
    description: 'Despacho con recaudación en efectivo o POS al momento de entregar el paquete en destino o sucursal.',
    authHeader: 'Authorization: Bearer <STARKEN_TOKEN>',
    jsonPayload: JSON.stringify(
      {
        clientRut: '77481920-3',
        deliveryType: 'AGENCIA_SUCURSAL', // o 'DOMICILIO'
        agencyCodeDestination: 'AG-CONCEPCION-CENTRO-01',
        cashOnDelivery: {
          enabled: true,
          amountToCollectCLP: 38990,
          accountForDeposit: {
            bank: 'Banco Estado / Banco de Chile',
            accountType: 'Cuenta Corriente',
            accountNumber: '00129381920',
            rut: '77481920-3'
          }
        },
        bulto: {
          kilos: 2.4,
          altoCm: 25,
          anchoCm: 30,
          largoCm: 35,
          contenido: 'Artículos de Cocina y Hogar'
        }
      },
      null,
      2
    ),
    sampleResponse: JSON.stringify(
      {
        result: 'ORDEN_GENERADA',
        numeroOrdenStarken: '782910482',
        tarifaEnvioCLP: 3950,
        comisionRecaudacionCLP: 1500,
        sucursalRetiro: 'Starken Concepción - O\'Higgins 450'
      },
      null,
      2
    )
  },
  {
    id: 'chazki-sameday',
    name: 'Chazki / 99Minutos - Envío Same-Day RM (Corte 13:00)',
    endpoint: 'https://api.chazki.com/v1/shipments/express',
    method: 'POST',
    description: 'Ruta de entrega en el mismo día dentro del Gran Santiago con tracking de repartidor en tiempo real.',
    authHeader: 'x-api-key: <CHAZKI_SAMEDAY_KEY>',
    jsonPayload: JSON.stringify(
      {
        service: 'SAME_DAY',
        cutoffTime: '13:00:00',
        pickup: {
          address: 'Av. Las Condes 9400, Santiago',
          instructions: 'Retirar en conserjería Bodega 2'
        },
        dropoff: {
          address: 'Av. Vicuña Mackenna 4800, San Joaquín, RM',
          contactName: 'Matías Silva',
          contactPhone: '+56961234567'
        },
        parcelDetails: {
          weightKg: 0.6,
          declaredValueCLP: 29990
        }
      },
      null,
      2
    ),
    sampleResponse: JSON.stringify(
      {
        trackingCode: 'CHZ-RM-882109',
        status: 'DISPATCHED_TO_DRIVER',
        estimatedArrival: 'Hoy entre 16:30 y 19:30',
        liveTrackingUrl: 'https://track.chazki.com/CHZ-RM-882109'
      },
      null,
      2
    )
  }
];

export interface SequenceStep {
  step: number;
  title: string;
  actor: 'Cliente' | 'Tienda (Next.js)' | 'Courier API' | 'Repartidor' | 'Webhook';
  description: string;
  badge: string;
  icon: string;
  color: string;
}

export const LOGISTICS_SEQUENCE_STEPS: SequenceStep[] = [
  {
    step: 1,
    title: 'Checkout & Validación de Cobertura',
    actor: 'Tienda (Next.js)',
    description: 'El comprador ingresa Comuna y Calle. El sistema valida si califica para Same-Day RM o red PUDO y calcula la tarifa óptima.',
    badge: 'Step 1: Front-end',
    icon: 'ShoppingCart',
    color: 'emerald'
  },
  {
    step: 2,
    title: 'Generación de Guía & Etiqueta (API Courier)',
    actor: 'Courier API',
    description: 'Route Handler en servidor emite la orden de transporte, obtiene el número de seguimiento y el PDF en formato térmico 10x15 cm.',
    badge: 'Step 2: API Call',
    icon: 'FileText',
    color: 'blue'
  },
  {
    step: 3,
    title: 'Fulfillment & Despacho a Hub Central',
    actor: 'Repartidor',
    description: 'El paquete es empacado con cinta de seguridad, etiquetado y colectado por la furgoneta del courier hacia el centro de distribución.',
    badge: 'Step 3: First Mile',
    icon: 'Truck',
    color: 'amber'
  },
  {
    step: 4,
    title: 'En Ruta de Reparto & Webhook "Out for Delivery"',
    actor: 'Webhook',
    description: 'El courier dispara un webhook a `/api/webhooks/courier`. La tienda notifica automáticamente al comprador vía WhatsApp / SMS.',
    badge: 'Step 4: Webhook Event',
    icon: 'Radio',
    color: 'purple'
  },
  {
    step: 5,
    title: 'Entrega Conforme (POD) o Logística Inversa',
    actor: 'Cliente',
    description: 'Recepción con firma digital o foto de comprobante (POD). Si hubo morador ausente, se reprograma automáticamente al día siguiente.',
    badge: 'Step 5: Last Mile POD',
    icon: 'CheckCircle2',
    color: 'teal'
  }
];
