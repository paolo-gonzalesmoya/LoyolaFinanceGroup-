import { createClient } from "@/lib/supabase/server";

const BUCKET = "avance-obra-fotos";
const SIGNED_URL_TTL_SEGUNDOS = 60 * 10;

// avance_obra.foto_url guarda el path dentro del bucket privado, no una URL
// pública — genera una URL firmada de corta duración para mostrarla.
export async function getAvanceObraFotoSignedUrl(path: string | null) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SEGUNDOS);
  return data?.signedUrl ?? null;
}

export async function subirFotoAvanceObra(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contratoId: string,
  avanceObraId: string,
  file: File
) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${contratoId}/${avanceObraId}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) return null;
  return path;
}
