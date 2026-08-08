"use client";

import { useState, useTransition } from "react";
import { solicitarConsultaScore } from "../actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Consulta = {
  id: string;
  score: number | null;
  ingresos_mensuales: number | null;
  capacidad_pago: number | null;
  fecha_registro: string;
};

export function ConsultaScore({ clienteId, consultas }: { clienteId: string; consultas: Consulta[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {consultas.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Ingresos mensuales</TableHead>
              <TableHead>Capacidad de pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultas.map((consulta) => (
              <TableRow key={consulta.id}>
                <TableCell>{new Date(consulta.fecha_registro).toLocaleString("es")}</TableCell>
                <TableCell>{consulta.score ?? "—"}</TableCell>
                <TableCell>${Number(consulta.ingresos_mensuales ?? 0).toFixed(2)}</TableCell>
                <TableCell>${Number(consulta.capacidad_pago ?? 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await solicitarConsultaScore(clienteId);
            setError(result.error);
          })
        }
      >
        {pending ? "Consultando…" : "Consultar score"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
