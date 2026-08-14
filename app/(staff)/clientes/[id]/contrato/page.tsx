import { notFound, redirect } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MandatoCobro } from "./mandato-cobro";
import { ContratoForm } from "./contrato-form";
import { VerificarDownpaymentButton } from "./verificar-downpayment";
import { CancelarPrestamoButton, ReembolsarButton } from "./acciones-cobranza";

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export default async function ContratoPage({ params, searchParams }: PageProps<"/clientes/[id]/contrato">) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tasaSugerida = firstParam(resolvedSearchParams.tasa);
  const cuotasSugeridas = firstParam(resolvedSearchParams.cuotas);
  const usuario = await getStaffUser();
  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "vendedor")) redirect("/dashboard");

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("cliente").select("*").eq("id", id).single();
  if (!cliente) notFound();

  const { data: solicitud } = await supabase
    .from("solicitud_credito")
    .select("id, decision, monto_solicitado")
    .eq("cliente_id", id)
    .maybeSingle();
  if (!solicitud || solicitud.decision !== "aprobado") redirect(`/clientes/${id}`);

  const [{ data: mandato }, { data: contrato }] = await Promise.all([
    supabase.from("mandato_cobro").select("id").eq("cliente_id", id).eq("estado", "activo").maybeSingle(),
    supabase.from("contrato").select("*").eq("solicitud_id", solicitud.id).maybeSingle(),
  ]);

  const total = Number(solicitud.monto_solicitado);

  // Si no vino una tasa elegida desde el simulador (query params), se
  // sugiere igual la del nivel que matchea el score más reciente del
  // cliente — el admin la ve seteada de una pero la puede editar.
  let tasaPorScore: string | null = null;
  if (!contrato && !tasaSugerida) {
    const [{ data: consulta }, { data: niveles }] = await Promise.all([
      supabase
        .from("consulta_score")
        .select("score")
        .eq("cliente_id", id)
        .order("fecha_registro", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("niveles_score").select("score_min, score_max, tasa_interes").eq("activo", true).order("score_min"),
    ]);
    const score = consulta?.score;
    const nivel = score != null ? niveles?.find((n) => score >= n.score_min && score <= n.score_max) : undefined;
    tasaPorScore = nivel ? String(nivel.tasa_interes) : null;
  }

  const { data: prestamo } = contrato
    ? await supabase.from("prestamo").select("id, monto_financiado, estado").eq("contrato_id", contrato.id).maybeSingle()
    : { data: null };

  const cuotas = prestamo
    ? (
        await supabase
          .from("cuota")
          .select("id, numero, fecha_vencimiento, monto, estado")
          .eq("prestamo_id", prestamo.id)
          .order("numero")
      ).data
    : null;

  const movimientos =
    cuotas && cuotas.length > 0
      ? (
          await supabase
            .from("movimiento_pago")
            .select("id, cuota_id, tipo, monto, resultado, fecha_registro, movimiento_original_id")
            .in(
              "cuota_id",
              cuotas.map((c) => c.id)
            )
            .order("fecha_registro", { ascending: false })
        ).data
      : null;

  const numeroPorCuotaId = new Map((cuotas ?? []).map((c) => [c.id, c.numero]));
  const idsYaReembolsados = new Set((movimientos ?? []).map((m) => m.movimiento_original_id).filter(Boolean));

  const ESTADO_CUOTA_VARIANT = {
    pendiente: "outline",
    pagada: "default",
    vencida: "secondary",
    en_mora: "destructive",
  } as const;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Contrato — {cliente.nombre}</h1>

      {!contrato && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <ContratoForm
              clienteId={cliente.id}
              solicitudId={solicitud.id}
              total={total}
              cuotasSugeridas={cuotasSugeridas}
              tasaSugerida={tasaSugerida ?? tasaPorScore}
            />
          </CardContent>
        </Card>
      )}

      {contrato && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {contrato.numero_cuotas} cuotas · {contrato.tasa_anual}% anual
            </p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Cliente aceptó el contrato:</span>
              <Badge variant={contrato.cliente_acepto_en ? "outline" : "secondary"}>
                {contrato.cliente_acepto_en ? "Sí" : "Pendiente"}
              </Badge>
            </p>
            <p>
              Downpayment: ${Number(contrato.downpayment_monto).toFixed(2)} —{" "}
              <Badge variant="outline">{contrato.downpayment_pagado ? "cobrado" : "pendiente"}</Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {contrato && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Método de cobro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mandato ? (
              <Badge variant="outline">Autorizado</Badge>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pendiente — lo autoriza el cliente desde su portal, después de aceptar el contrato.
              </p>
            )}
            {!mandato && usuario.rol === "admin" && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Respaldo: autorizar método de cobro manualmente
                  <ChevronDownIcon className="size-3.5 transition-transform duration-200 data-[panel-open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 rounded-md border border-dashed p-3">
                    <p className="text-xs text-muted-foreground">
                      Excepcional — solo si el cliente no puede hacerlo desde su propio portal.
                    </p>
                    <MandatoCobro clienteId={cliente.id} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {contrato && !contrato.downpayment_pagado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pago inicial (downpayment)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {mandato
                ? "Pendiente — lo paga el cliente desde su portal."
                : "El cliente todavía tiene que autorizar un método de cobro antes de poder pagarlo."}
            </p>
            {mandato && usuario.rol === "admin" && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  Respaldo: cobrar el downpayment manualmente
                  <ChevronDownIcon className="size-3.5 transition-transform duration-200 data-[panel-open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2 rounded-md border border-dashed p-3">
                    <p className="text-xs text-muted-foreground">
                      Excepcional — solo si el cliente no puede hacerlo desde su propio portal.
                    </p>
                    <VerificarDownpaymentButton input={{ clienteId: cliente.id, contratoId: contrato.id }} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {prestamo && cuotas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cronograma de cuotas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.numero}>
                    <TableCell>{c.numero}</TableCell>
                    <TableCell>{c.fecha_vencimiento}</TableCell>
                    <TableCell>${Number(c.monto).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={ESTADO_CUOTA_VARIANT[c.estado]}>{c.estado.replace("_", " ")}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-2 text-sm text-muted-foreground">
              Monto financiado: ${Number(prestamo.monto_financiado).toFixed(2)} ·{" "}
              <Badge variant={prestamo.estado === "activo" ? "outline" : "secondary"}>{prestamo.estado}</Badge>
            </p>
            {prestamo.estado === "activo" && (
              <div className="mt-2">
                <CancelarPrestamoButton clienteId={cliente.id} prestamoId={prestamo.id} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {movimientos && movimientos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de cobros</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cuota</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m) => {
                  const esReembolsable =
                    (m.tipo === "cobro" || m.tipo === "mora") && m.resultado === "exitoso" && !idsYaReembolsados.has(m.id);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>{numeroPorCuotaId.get(m.cuota_id) ?? "—"}</TableCell>
                      <TableCell className="capitalize">{m.tipo}</TableCell>
                      <TableCell>${Number(m.monto).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={m.resultado === "exitoso" ? "default" : m.resultado === "fallido" ? "destructive" : "secondary"}>
                          {m.resultado}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(m.fecha_registro).toLocaleString("es-PE")}</TableCell>
                      <TableCell>
                        {esReembolsable && <ReembolsarButton clienteId={cliente.id} movimientoId={m.id} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
