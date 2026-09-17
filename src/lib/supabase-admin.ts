/**
 * SERVICIO ADMINISTRATIVO DE SUPABASE (EXCLUSIVO SERVER-SIDE)
 * 
 * Seguridad y Aislamiento de Credenciales:
 * - La variable `SUPABASE_SERVICE_ROLE_KEY` JAMÁS debe llevar el prefijo `VITE_` ni `NEXT_PUBLIC_`.
 * - Se ejecuta exclusivamente dentro del entorno Node.js / Express del servidor.
 * - Utiliza la clave de rol de servicio para realizar escrituras y consultas defensivas,
 *   evadiendo las restricciones de Row Level Security (RLS) de forma controlada.
 * - Todos los métodos están blindados con try/catch defensivo para garantizar continuidad
 *   operativa y cero fallos hacia el usuario final en caso de cortes de red o mantenimiento de DB.
 */

export interface SupabaseAdminConfig {
  url: string;
  serviceRoleKey: string;
}

export interface AdminInsertOptions {
  table: string;
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  onConflict?: string;
}

export interface AdminQueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Obtiene la configuración administrativa de Supabase desde process.env (Server-side)
 */
export function getSupabaseAdminConfig(): SupabaseAdminConfig | null {
  // Aseguramos que solo se lea en entorno Node (servidor)
  if (typeof window !== 'undefined') {
    console.error('[CRITICAL SECURITY ERROR] Intento de acceso a Supabase Admin en el cliente.');
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || serviceRoleKey.trim() === '') {
    return null;
  }

  return {
    url: url.replace(/\/$/, ''),
    serviceRoleKey: serviceRoleKey.trim()
  };
}

/**
 * Inserta registros directamente en Supabase con bypass administrativo de RLS.
 * Diseñado para auditorías tributarias Ley N° 21.713, eventos de conversión y logs de conciliación.
 */
export async function executeAdminInsert<T = unknown>(options: AdminInsertOptions): Promise<AdminQueryResult<T>> {
  const config = getSupabaseAdminConfig();
  if (!config) {
    // Modo offline / degradación silenciosa cuando la DB externa no está aprovisionada
    return {
      success: false,
      error: 'Supabase Service Role no configurado en process.env'
    };
  }

  try {
    const endpoint = `${config.url}/rest/v1/${options.table}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': config.serviceRoleKey,
      'Authorization': `Bearer ${config.serviceRoleKey}`,
      'Prefer': 'return=representation'
    };

    if (options.onConflict) {
      headers['Prefer'] = `resolution=merge-duplicates,return=representation`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers,
      body: JSON.stringify(options.data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Supabase Admin Warning] Error en inserción (${options.table}): HTTP ${response.status}`, errorText);
      return {
        success: false,
        status: response.status,
        error: errorText
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      status: response.status,
      data: responseData as T
    };

  } catch (error: unknown) {
    // Captura defensiva de errores de red para no interrumpir el flujo del usuario
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Supabase Admin Silent Fallback] Excepción en ${options.table}:`, message);
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Registra un evento de auditoría o conversión de forma segura y no bloqueante.
 */
export async function recordConversionEventAdmin(event: {
  eventId: string;
  eventName: string;
  grossAmountCLP: number;
  netRevenueCLP: number;
  ivaAmountCLP: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const result = await executeAdminInsert({
    table: 'conversion_events',
    data: {
      event_id: event.eventId,
      event_name: event.eventName,
      gross_amount_clp: event.grossAmountCLP,
      net_revenue_clp: event.netRevenueCLP,
      iva_amount_clp: event.ivaAmountCLP,
      currency: event.currency || 'CLP',
      metadata: event.metadata || {},
      created_at: new Date().toISOString()
    }
  });

  return result.success;
}

/**
 * Helper para verificar el estado de conexión del servicio administrativo
 */
export async function checkSupabaseAdminHealth(): Promise<{ configured: boolean; healthy: boolean; latencyMs: number }> {
  const startTime = Date.now();
  const config = getSupabaseAdminConfig();

  if (!config) {
    return { configured: false, healthy: false, latencyMs: 0 };
  }

  try {
    const res = await fetch(`${config.url}/rest/v1/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
      headers: {
        'apikey': config.serviceRoleKey,
        'Authorization': `Bearer ${config.serviceRoleKey}`
      }
    });

    return {
      configured: true,
      healthy: res.ok || res.status === 200 || res.status === 204,
      latencyMs: Date.now() - startTime
    };
  } catch {
    return {
      configured: true,
      healthy: false,
      latencyMs: Date.now() - startTime
    };
  }
}
