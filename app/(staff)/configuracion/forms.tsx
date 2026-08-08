"use client";

import { useActionState, useState } from "react";
import { crearCategoria, crearCampo } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NuevaCategoriaForm() {
  const [state, action, pending] = useActionState(crearCategoria, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nueva categoría</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear"}
          </Button>
        </form>
        {state?.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}

export function NuevoCampoForm({ categorias }: { categorias: { id: string; nombre: string }[] }) {
  const [state, action, pending] = useActionState(crearCampo, undefined);
  const [tipoDato, setTipoDato] = useState("numero");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo campo</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="categoria_id">Categoría</Label>
            <Select name="categoria_id" required>
              <SelectTrigger id="categoria_id" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    categorias.find((categoria) => categoria.id === value)?.nombre ?? "Elegí una categoría"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre_campo">Nombre del campo</Label>
              <Input id="nombre_campo" name="nombre_campo" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unidad_medida">Unidad de medida</Label>
              <Input id="unidad_medida" name="unidad_medida" placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tipo_dato">Tipo de dato</Label>
            <Select name="tipo_dato" defaultValue="numero" onValueChange={(value) => setTipoDato(value ?? "numero")}>
              <SelectTrigger id="tipo_dato" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    ({ numero: "Número", texto: "Texto", seleccion: "Selección" })[value ?? "numero"] ?? "Número"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numero">Número</SelectItem>
                <SelectItem value="texto">Texto</SelectItem>
                <SelectItem value="seleccion">Selección</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoDato === "seleccion" && (
            <div className="space-y-1.5">
              <Label htmlFor="opciones">Opciones (separadas por coma)</Label>
              <Input id="opciones" name="opciones" placeholder="Baño, Cocina, Recamara…" />
            </div>
          )}

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear campo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
