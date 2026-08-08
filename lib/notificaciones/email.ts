import "server-only";

// Adapter de envío de email — mismo patrón que lib/experian/client.ts: modo
// mock desde el día 1 (todavía no hay proveedor elegido/pagado), interfaz
// lista para enchufar uno real (Resend, Postmark, SES...) sin retrabajo en
// el resto del código.
export async function enviarEmailMock(destinatarioCorreo: string | null, asunto: string, mensaje: string) {
  if (!destinatarioCorreo) return;
  console.log(`[email mock] a=${destinatarioCorreo} asunto="${asunto}" mensaje="${mensaje}"`);
}
