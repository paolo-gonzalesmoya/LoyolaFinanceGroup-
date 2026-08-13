// Texto placeholder — NO es el texto legal final. Sirve para que el
// mecanismo de aceptación (checkbox + versión + fecha guardados en
// cliente.tc_aceptado_en/tc_version) funcione mientras se confirma el
// texto real con un abogado. Reemplazar este contenido y subir TC_VERSION
// (en ./actions.ts) cuando eso pase — nunca presentar este texto como
// válido ante un cliente real.
// Versión del texto de abajo. Cuando el texto real (revisado por abogado)
// reemplace el borrador, subir este número para que quede trazable qué
// versión aceptó cada cliente.
export const TC_VERSION = "borrador-v1";

export const TC_TEXTO = `
Al crear tu cuenta en Loyola Finance Group, entiendes y aceptas que:

1. La información que ingreses (nombre, contacto, y más adelante tu SSN/ITN)
   se usa únicamente para evaluar tu solicitud de financiamiento con
   Loyola Capital.
2. Crear una cuenta no garantiza la aprobación de ningún financiamiento —
   tu solicitud se evalúa caso por caso.
3. Antes de que tu solicitud avance, un miembro de nuestro equipo confirma
   tu identidad.
4. Si autorizas cobro automático (autopay), lo haces mediante un
   consentimiento separado y explícito, no como parte de este registro.
5. Puedes consultar el estado de tu solicitud y tus pagos en todo momento
   desde tu portal.
`.trim();
