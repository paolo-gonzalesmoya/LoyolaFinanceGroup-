"use client";

import { useActionState } from "react";
import { crearNivelScore, cambiarActivoNivelScore } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function NuevoNivelScoreForm() {
  const [state, action, pending] = useActionState(crearNivelScore, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo nivel de score</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre_nivel">Nombre del nivel</Label>
              <Input id="nombre_nivel" name="nombre_nivel" placeholder="Excelente" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="score_min">Score mínimo</Label>
              <Input id="score_min" name="score_min" type="number" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="score_max">Score máximo</Label>
              <Input id="score_max" name="score_max" type="number" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tasa_interes">Tasa anual (%)</Label>
            <Input id="tasa_interes" name="tasa_interes" type="number" step="0.01" required />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando…" : "Crear nivel"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

type NivelRow = {
  id: string;
  nombre_nivel: string;
  score_min: number;
  score_max: number;
  tasa_interes: number;
  activo: boolean;
};

export function ListaNivelesScore({ niveles }: { niveles: NivelRow[] }) {
  return (
    <div className="divide-y rounded-md border">
      {niveles.map((nivel) => (
        <div key={nivel.id} className="flex items-center justify-between p-3 text-sm">
          <div>
            <p className="font-medium">
              {nivel.nombre_nivel} <span className="text-muted-foreground">· {nivel.score_min}–{nivel.score_max}</span>
            </p>
            <div className="mt-1 flex gap-1.5">
              <Badge variant="secondary">{nivel.tasa_interes}% anual</Badge>
              <Badge variant={nivel.activo ? "outline" : "destructive"}>{nivel.activo ? "Activo" : "Desactivado"}</Badge>
            </div>
          </div>
          <form action={cambiarActivoNivelScore.bind(null, nivel.id, !nivel.activo)}>
            <Button type="submit" size="sm" variant="ghost">
              {nivel.activo ? "Desactivar" : "Activar"}
            </Button>
          </form>
        </div>
      ))}
      {niveles.length === 0 && <p className="p-3 text-sm text-muted-foreground">Sin niveles todavía.</p>}
    </div>
  );
}
