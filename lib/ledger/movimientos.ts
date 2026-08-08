import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Único módulo autorizado a escribir en movimiento_pago (ver Decisión de
// seguridad #4 del plan). Nada más en el repo debe hacer
// supabase.from("movimiento_pago").insert(...) directamente.

type AdminClient = SupabaseClient<Database>;
type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento"];
type ResultadoMovimiento = Database["public"]["Enums"]["resultado_movimiento"];

export async function registrarMovimiento(
  supabase: AdminClient,
  input: {
    cuotaId: string;
    tipo: TipoMovimiento;
    monto: number;
    stripeEventId?: string | null;
    claveIdempotencia: string;
    resultado: ResultadoMovimiento;
  }
): Promise<{ yaRegistrado: boolean; id: string | null }> {
  const { data, error } = await supabase
    .from("movimiento_pago")
    .insert({
      cuota_id: input.cuotaId,
      tipo: input.tipo,
      monto: input.monto,
      stripe_event_id: input.stripeEventId ?? null,
      clave_idempotencia: input.claveIdempotencia,
      resultado: input.resultado,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation en clave_idempotencia: este intento ya había
    // quedado registrado (el cron y el webhook llegaron al mismo resultado,
    // o un reintento de red repitió la llamada). Es el mecanismo de
    // idempotencia funcionando, no un error real.
    if (error.code === "23505") return { yaRegistrado: true, id: null };
    throw error;
  }

  return { yaRegistrado: false, id: data.id };
}

// Registra el resultado de un intento de cobro (lo llaman tanto el cron
// como el webhook, lo que llegue primero) y, si es un cobro de cuota
// exitoso (no una mora), la marca pagada. Idempotente por clave: si este
// intento ya se había registrado antes, no vuelve a tocar el estado.
export async function aplicarResultadoCobro(
  supabase: AdminClient,
  input: {
    cuotaId: string;
    tipo: TipoMovimiento;
    monto: number;
    exitoso: boolean;
    stripeEventId?: string | null;
    claveIdempotencia: string;
  }
): Promise<{ yaRegistrado: boolean }> {
  const { yaRegistrado } = await registrarMovimiento(supabase, {
    cuotaId: input.cuotaId,
    tipo: input.tipo,
    monto: input.monto,
    stripeEventId: input.stripeEventId,
    claveIdempotencia: input.claveIdempotencia,
    resultado: input.exitoso ? "exitoso" : "reintento",
  });

  if (!yaRegistrado && input.exitoso && input.tipo === "cobro") {
    await supabase.from("cuota").update({ estado: "pagada" }).eq("id", input.cuotaId);
  }

  return { yaRegistrado };
}
