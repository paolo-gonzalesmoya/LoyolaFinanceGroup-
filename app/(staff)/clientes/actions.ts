"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffUser } from "@/lib/auth/session";
import { encryptSsn, decryptSsn } from "@/lib/crypto/ssn";
import { consultarScore } from "@/lib/experian/client";
import { TOPE_FINANCIAMIENTO_USD } from "@/lib/credito/reglas";
import { notificarCreditoRechazado } from "@/lib/notificaciones/registrar";

async function requireAdmin() {
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}

export async function crearCliente(_prevState: { error: string } | undefined, formData: FormData) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const correo = String(formData.get("correo") ?? "").trim() || null;
  const autorizado = formData.get("autorizado") === "on";
  const ssnItn = String(formData.get("ssn_itn") ?? "").trim();

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!autorizado) return { error: "Confirma que el cliente autorizó la captura de sus datos y la consulta de crédito." };
  if (!ssnItn) return { error: "El SSN/ITN es obligatorio." };

  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("cliente")
    .insert({
      nombre,
      direccion,
      telefono,
      correo,
      ssn_itn_cifrado: encryptSsn(ssnItn),
      registrado_por: usuario.id,
      // Admin ya validó a este cliente al cargarlo a mano — a diferencia
      // del auto-registro público, no necesita el paso de confirmación.
      verificado: true,
      verificado_por: usuario.id,
      verificado_en: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !cliente) {
    return { error: `No se pudo registrar el cliente: ${error?.message ?? "error desconocido"}` };
  }

  redirect(`/clientes/${cliente.id}`);
}

export async function revelarSsn(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado.", ssn: null };

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("cliente")
    .select("ssn_itn_cifrado")
    .eq("id", clienteId)
    .single();

  if (!cliente?.ssn_itn_cifrado) return { error: "No hay SSN/ITN guardado.", ssn: null };

  try {
    const ssn = decryptSsn(cliente.ssn_itn_cifrado);
    await supabase.from("auditoria").insert({ usuario_id: usuario.id, tipo: "ver_ssn", cliente_id: clienteId });
    return { error: null, ssn };
  } catch {
    return { error: "No se pudo descifrar el valor guardado.", ssn: null };
  }
}

export async function crearSolicitudCredito(
  clienteId: string,
  _prevState: { error: string } | undefined,
  formData: FormData
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const montoSolicitado = Number(formData.get("monto_solicitado"));
  if (!montoSolicitado || montoSolicitado <= 0) return { error: "El monto solicitado debe ser mayor a 0." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("solicitud_credito")
    .insert({ cliente_id: clienteId, monto_solicitado: montoSolicitado, decision: "pendiente" });

  if (error) return { error: `No se pudo crear la solicitud: ${error.message}` };

  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}`);
}

export async function eliminarSolicitudCredito(clienteId: string, solicitudId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: contrato } = await supabase.from("contrato").select("id").eq("solicitud_id", solicitudId).maybeSingle();
  if (contrato) return { error: "Esta solicitud ya tiene un contrato asociado — no se puede eliminar así." };

  const { error } = await supabase.from("solicitud_credito").delete().eq("id", solicitudId);
  if (error) return { error: `No se pudo eliminar la solicitud: ${error.message}` };

  revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
}

export async function solicitarConsultaScore(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: cliente } = await supabase
    .from("cliente")
    .select("nombre, ssn_itn_cifrado")
    .eq("id", clienteId)
    .single();

  if (!cliente?.ssn_itn_cifrado) return { error: "El cliente no tiene SSN/ITN registrado." };

  const resultado = await consultarScore({ nombre: cliente.nombre, ssnItn: decryptSsn(cliente.ssn_itn_cifrado) });

  const { error } = await supabase.from("consulta_score").insert({
    cliente_id: clienteId,
    score: resultado.score,
    ingresos_mensuales: resultado.ingresosMensuales,
    capacidad_pago: resultado.capacidadPago,
    registrado_por: usuario.id,
  });

  if (error) return { error: `No se pudo guardar la consulta: ${error.message}` };

  await supabase.from("auditoria").insert({ usuario_id: usuario.id, tipo: "consulta_score", cliente_id: clienteId });

  revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
}

export async function decidirCredito(
  input: { clienteId: string; solicitudId: string },
  decision: "aprobado" | "rechazado",
  motivoRechazo: string | null
) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  if (decision === "aprobado") {
    const { data: solicitud } = await supabase
      .from("solicitud_credito")
      .select("monto_solicitado")
      .eq("id", input.solicitudId)
      .single();
    const monto = Number(solicitud?.monto_solicitado ?? 0);

    if (monto > TOPE_FINANCIAMIENTO_USD) {
      return {
        error: `El monto solicitado ($${monto.toFixed(2)}) supera el tope de $${TOPE_FINANCIAMIENTO_USD.toLocaleString()}.`,
      };
    }
  }

  if (decision === "rechazado" && !motivoRechazo?.trim()) {
    return { error: "El motivo de rechazo es obligatorio." };
  }

  const { data: ultimaConsulta } = await supabase
    .from("consulta_score")
    .select("id")
    .eq("cliente_id", input.clienteId)
    .order("fecha_registro", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: actualizadas, error } = await supabase
    .from("solicitud_credito")
    .update({
      decision,
      decidido_por: usuario.id,
      motivo_rechazo: decision === "rechazado" ? motivoRechazo : null,
      consulta_score_id: ultimaConsulta?.id ?? null,
    })
    .eq("id", input.solicitudId)
    .eq("decision", "pendiente")
    .select("id");

  if (error) return { error: `No se pudo registrar la decisión: ${error.message}` };
  if (!actualizadas || actualizadas.length === 0) return { error: "Esta solicitud ya fue decidida." };

  await supabase.from("auditoria").insert({
    usuario_id: usuario.id,
    tipo: decision === "aprobado" ? "aprobacion_credito" : "rechazo_credito",
    cliente_id: input.clienteId,
    solicitud_credito_id: input.solicitudId,
  });

  if (decision === "rechazado") {
    const { data: clienteRow } = await supabase.from("cliente").select("correo").eq("id", input.clienteId).single();
    await notificarCreditoRechazado(supabase, {
      clienteId: input.clienteId,
      motivoRechazo: motivoRechazo ?? "",
      clienteCorreo: clienteRow?.correo ?? null,
    }).catch(() => {});
  }

  revalidatePath(`/clientes/${input.clienteId}`);
  return { error: null };
}

export async function confirmarCliente(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();

  const { data: actualizados, error } = await supabase
    .from("cliente")
    .update({ verificado: true, verificado_por: usuario.id, verificado_en: new Date().toISOString() })
    .eq("id", clienteId)
    .eq("verificado", false)
    .select("id");

  if (error) return { error: `No se pudo confirmar al cliente: ${error.message}` };
  if (!actualizados || actualizados.length === 0) return { error: "Este cliente ya estaba confirmado." };

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
}

export async function invitarClientePortal(clienteId: string) {
  const usuario = await requireAdmin();
  if (!usuario) return { error: "No autorizado." };

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("cliente").select("correo, auth_user_id").eq("id", clienteId).single();

  if (!cliente) return { error: "Cliente no encontrado." };
  if (!cliente.correo) return { error: "El cliente no tiene un correo registrado." };
  if (cliente.auth_user_id) return { error: "Este cliente ya tiene acceso al portal." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(cliente.correo, {
    redirectTo: `${siteUrl}/auth/callback?next=/portal/activar`,
  });

  if (error || !data.user) return { error: `No se pudo enviar la invitación: ${error?.message ?? "error desconocido"}` };

  const { error: updateError } = await supabase.from("cliente").update({ auth_user_id: data.user.id }).eq("id", clienteId);
  if (updateError) return { error: `La invitación se envió pero no se pudo enlazar la cuenta: ${updateError.message}` };

  revalidatePath(`/clientes/${clienteId}`);
  return { error: null };
}
