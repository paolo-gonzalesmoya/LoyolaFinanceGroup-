import { createClient } from "@/lib/supabase/server";

const BUCKET = "lead-fotos";
const SIGNED_URL_TTL_SEGUNDOS = 60 * 10;

// `lead.foto_dni_url` / `foto_recibo_url` guardan el path dentro del bucket
// privado (no una URL pública — el bucket no es público). Esto genera una
// URL firmada de corta duración para mostrar la imagen.
export async function getFotoSignedUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SEGUNDOS);
  return data?.signedUrl ?? null;
}

export async function subirFotoLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  tipo: "dni" | "recibo",
  file: File
) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${leadId}/${tipo}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) return null;
  return path;
}
