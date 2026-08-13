import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStaffUser } from "@/lib/auth/session";
import { ssnLast4 } from "@/lib/crypto/ssn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevealSsn } from "./reveal-ssn";
import { ConsultaScore } from "./consulta-score";
import { DecisionCredito } from "./decision-credito";
import { SolicitudCreditoForm } from "./solicitud-form";
import { EliminarSolicitudButton } from "./eliminar-solicitud-button";
import { InvitarPortalButton } from "./invitar-portal";
import { ConfirmarClienteButton } from "./confirmar-cliente-button";
import { SimuladorTasas } from "./simulador-tasas";

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export default async function ClienteDetallePage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tasaSeleccionada = firstParam(resolvedSearchParams.tasa);
  const cuotasSeleccionadas = firstParam(resolvedSearchParams.cuotas);
  const usuario = await getStaffUser();
  if (!usuario || usuario.rol !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: cliente } = await supabase.from("cliente").select("*").eq("id", id).single();
  if (!cliente) notFound();

  const [{ data: solicitud }, { data: consultas }, { data: niveles }] = await Promise.all([
    supabase
      .from("solicitud_credito")
      .select("id, monto_solicitado, decision, motivo_rechazo")
      .eq("cliente_id", id)
      .maybeSingle(),
    supabase
      .from("consulta_score")
      .select("id, score, ingresos_mensuales, capacidad_pago, fecha_registro")
      .eq("cliente_id", id)
      .order("fecha_registro", { ascending: false }),
    supabase
      .from("niveles_score")
      .select("id, nombre_nivel, score_min, score_max, tasa_interes")
      .eq("activo", true)
      .order("score_min"),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{cliente.nombre}</h1>

      {!cliente.verificado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidad sin confirmar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Este cliente se registró solo desde la web — todavía puede simular, pero no puede cargar su SSN ni
              avanzar una solicitud real hasta que confirmes quién es.
            </p>
            <ConfirmarClienteButton clienteId={cliente.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Dirección:</span> {cliente.direccion ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Teléfono:</span> {cliente.telefono ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Correo:</span> {cliente.correo ?? "—"}
          </p>
          <p className="flex items-center gap-1">
            <span className="text-muted-foreground">SSN/ITN:</span>{" "}
            {cliente.ssn_itn_cifrado ? (
              <RevealSsn clienteId={cliente.id} mascara={ssnLast4(cliente.ssn_itn_cifrado)} />
            ) : (
              "—"
            )}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-muted-foreground">Portal del cliente:</span>
            {cliente.auth_user_id ? (
              <Badge variant="outline">Activo</Badge>
            ) : (
              <InvitarPortalButton clienteId={cliente.id} />
            )}
          </div>
        </CardContent>
      </Card>

      {cliente.ssn_itn_cifrado && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consulta de score (Experian)</CardTitle>
          </CardHeader>
          <CardContent>
            <ConsultaScore clienteId={cliente.id} consultas={consultas ?? []} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitud de financiamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!solicitud && cliente.verificado && <SolicitudCreditoForm clienteId={cliente.id} />}
          {!solicitud && !cliente.verificado && (
            <p className="text-sm text-muted-foreground">Confirma la identidad del cliente antes de crear una solicitud.</p>
          )}

          {solicitud && (
            <>
              <p className="text-sm">
                Monto solicitado: <span className="font-medium">${Number(solicitud.monto_solicitado).toFixed(2)}</span>{" "}
                · <Badge variant="outline">{solicitud.decision}</Badge>
              </p>
              {solicitud.motivo_rechazo && (
                <p className="text-sm text-muted-foreground">Motivo de rechazo: {solicitud.motivo_rechazo}</p>
              )}
              {solicitud.decision === "pendiente" && (
                <EliminarSolicitudButton clienteId={cliente.id} solicitudId={solicitud.id} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {solicitud && (
        <SimuladorTasas
          montoSolicitado={Number(solicitud.monto_solicitado)}
          niveles={niveles ?? []}
          scoreReal={consultas?.[0]?.score ?? null}
        />
      )}

      {solicitud?.decision === "pendiente" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisión de crédito</CardTitle>
          </CardHeader>
          <CardContent>
            <DecisionCredito input={{ clienteId: cliente.id, solicitudId: solicitud.id }} />
          </CardContent>
        </Card>
      )}

      {solicitud?.decision === "aprobado" && (
        <Button
          render={
            <Link
              href={
                tasaSeleccionada && cuotasSeleccionadas
                  ? `/clientes/${cliente.id}/contrato?tasa=${tasaSeleccionada}&cuotas=${cuotasSeleccionadas}`
                  : `/clientes/${cliente.id}/contrato`
              }
            />
          }
        >
          Ir a contrato
        </Button>
      )}
    </div>
  );
}
