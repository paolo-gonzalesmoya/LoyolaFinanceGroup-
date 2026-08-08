import { createClient } from "@/lib/supabase/server";

export async function getCategorias() {
  const supabase = await createClient();
  const { data } = await supabase.from("categoria_servicio").select("id, nombre").order("nombre");
  return data ?? [];
}

export async function getCamposDeCategoria(categoriaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campo_servicio")
    .select("id, nombre_campo, unidad_medida, tipo_dato, opciones")
    .eq("categoria_id", categoriaId)
    .order("nombre_campo");
  return data ?? [];
}
