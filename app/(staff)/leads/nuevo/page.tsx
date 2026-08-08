import { NuevoLeadForm } from "./form";
import { getCategorias } from "@/lib/leads/categorias";

export default async function NuevoLeadPage() {
  const categorias = await getCategorias();

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Nuevo lead</h1>
      <NuevoLeadForm categorias={categorias} />
    </div>
  );
}
