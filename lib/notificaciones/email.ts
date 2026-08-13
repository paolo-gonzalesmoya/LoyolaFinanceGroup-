import "server-only";
import { Resend } from "resend";

// Envío real de email vía Resend. Si todavía no hay API key configurada,
// cae a un log (modo mock) en vez de romper el flujo que llama a esto.
// Nunca lanza: el insert de `notificacion` (lo que ve staff/cliente dentro
// de la app) es la fuente de verdad y no debe fallar por un problema de
// envío de correo — ver lib/notificaciones/registrar.ts.
//
// Nota: sin un dominio propio verificado en Resend, el remitente por
// defecto (onboarding@resend.dev) solo puede mandar al correo con el que
// se creó la cuenta de Resend — cualquier otro destinatario rebota hasta
// que se verifique un dominio (ver docs/runbook.md).
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function enviarEmail(destinatarioCorreo: string | null, asunto: string, mensaje: string) {
  if (!destinatarioCorreo) return;

  if (!resend) {
    console.log(`[email mock] a=${destinatarioCorreo} asunto="${asunto}" mensaje="${mensaje}"`);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Loyola Finance Group <onboarding@resend.dev>",
      to: destinatarioCorreo,
      subject: asunto,
      text: mensaje,
    });
    if (error) console.error(`[email] no se pudo enviar a ${destinatarioCorreo}:`, error.message);
  } catch (err) {
    console.error(`[email] no se pudo enviar a ${destinatarioCorreo}:`, err);
  }
}
