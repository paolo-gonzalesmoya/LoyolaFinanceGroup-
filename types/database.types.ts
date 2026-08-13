export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          cliente_id: string | null
          fecha_registro: string
          id: string
          solicitud_credito_id: string | null
          tipo: Database["public"]["Enums"]["tipo_evento_auditoria"]
          usuario_id: string
        }
        Insert: {
          cliente_id?: string | null
          fecha_registro?: string
          id?: string
          solicitud_credito_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_evento_auditoria"]
          usuario_id: string
        }
        Update: {
          cliente_id?: string | null
          fecha_registro?: string
          id?: string
          solicitud_credito_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_evento_auditoria"]
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_solicitud_credito_id_fkey"
            columns: ["solicitud_credito_id"]
            isOneToOne: false
            referencedRelation: "solicitud_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente: {
        Row: {
          auth_user_id: string | null
          correo: string | null
          direccion: string | null
          fecha_registro: string
          id: string
          nombre: string
          registrado_por: string | null
          ssn_itn_cifrado: string | null
          stripe_customer_id: string | null
          tc_aceptado_en: string | null
          tc_version: string | null
          telefono: string | null
          verificado: boolean
          verificado_en: string | null
          verificado_por: string | null
        }
        Insert: {
          auth_user_id?: string | null
          correo?: string | null
          direccion?: string | null
          fecha_registro?: string
          id?: string
          nombre: string
          registrado_por?: string | null
          ssn_itn_cifrado?: string | null
          stripe_customer_id?: string | null
          tc_aceptado_en?: string | null
          tc_version?: string | null
          telefono?: string | null
          verificado?: boolean
          verificado_en?: string | null
          verificado_por?: string | null
        }
        Update: {
          auth_user_id?: string | null
          correo?: string | null
          direccion?: string | null
          fecha_registro?: string
          id?: string
          nombre?: string
          registrado_por?: string | null
          ssn_itn_cifrado?: string | null
          stripe_customer_id?: string | null
          tc_aceptado_en?: string | null
          tc_version?: string | null
          telefono?: string | null
          verificado?: boolean
          verificado_en?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      consulta_score: {
        Row: {
          capacidad_pago: number | null
          cliente_id: string
          fecha_registro: string
          id: string
          ingresos_mensuales: number | null
          registrado_por: string
          score: number | null
        }
        Insert: {
          capacidad_pago?: number | null
          cliente_id: string
          fecha_registro?: string
          id?: string
          ingresos_mensuales?: number | null
          registrado_por: string
          score?: number | null
        }
        Update: {
          capacidad_pago?: number | null
          cliente_id?: string
          fecha_registro?: string
          id?: string
          ingresos_mensuales?: number | null
          registrado_por?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consulta_score_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consulta_score_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato: {
        Row: {
          downpayment_monto: number
          downpayment_pagado: boolean
          downpayment_stripe_payment_intent_id: string | null
          downpayment_verificado_por: string | null
          fecha_registro: string
          id: string
          numero_cuotas: number
          registrado_por: string
          solicitud_id: string
          tasa_mensual: number
          tila_aceptado_en: string | null
        }
        Insert: {
          downpayment_monto: number
          downpayment_pagado?: boolean
          downpayment_stripe_payment_intent_id?: string | null
          downpayment_verificado_por?: string | null
          fecha_registro?: string
          id?: string
          numero_cuotas: number
          registrado_por: string
          solicitud_id: string
          tasa_mensual: number
          tila_aceptado_en?: string | null
        }
        Update: {
          downpayment_monto?: number
          downpayment_pagado?: boolean
          downpayment_stripe_payment_intent_id?: string | null
          downpayment_verificado_por?: string | null
          fecha_registro?: string
          id?: string
          numero_cuotas?: number
          registrado_por?: string
          solicitud_id?: string
          tasa_mensual?: number
          tila_aceptado_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_downpayment_verificado_por_fkey"
            columns: ["downpayment_verificado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_solicitud_id_fkey"
            columns: ["solicitud_id"]
            isOneToOne: true
            referencedRelation: "solicitud_credito"
            referencedColumns: ["id"]
          },
        ]
      }
      cuota: {
        Row: {
          estado: Database["public"]["Enums"]["estado_cuota"]
          fecha_vencimiento: string
          id: string
          monto: number
          numero: number
          prestamo_id: string
        }
        Insert: {
          estado?: Database["public"]["Enums"]["estado_cuota"]
          fecha_vencimiento: string
          id?: string
          monto: number
          numero: number
          prestamo_id: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["estado_cuota"]
          fecha_vencimiento?: string
          id?: string
          monto?: number
          numero?: number
          prestamo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuota_prestamo_id_fkey"
            columns: ["prestamo_id"]
            isOneToOne: false
            referencedRelation: "prestamo"
            referencedColumns: ["id"]
          },
        ]
      }
      mandato_cobro: {
        Row: {
          autopay_consentido_en: string | null
          cliente_id: string
          estado: Database["public"]["Enums"]["estado_mandato"]
          fecha_registro: string
          id: string
          stripe_payment_method_id: string
        }
        Insert: {
          autopay_consentido_en?: string | null
          cliente_id: string
          estado?: Database["public"]["Enums"]["estado_mandato"]
          fecha_registro?: string
          id?: string
          stripe_payment_method_id: string
        }
        Update: {
          autopay_consentido_en?: string | null
          cliente_id?: string
          estado?: Database["public"]["Enums"]["estado_mandato"]
          fecha_registro?: string
          id?: string
          stripe_payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandato_cobro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
        ]
      }
      movimiento_pago: {
        Row: {
          clave_idempotencia: string
          cuota_id: string
          fecha_registro: string
          id: string
          monto: number
          monto_capital: number | null
          monto_interes: number | null
          movimiento_original_id: string | null
          resultado: Database["public"]["Enums"]["resultado_movimiento"]
          stripe_event_id: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Insert: {
          clave_idempotencia: string
          cuota_id: string
          fecha_registro?: string
          id?: string
          monto: number
          monto_capital?: number | null
          monto_interes?: number | null
          movimiento_original_id?: string | null
          resultado: Database["public"]["Enums"]["resultado_movimiento"]
          stripe_event_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Update: {
          clave_idempotencia?: string
          cuota_id?: string
          fecha_registro?: string
          id?: string
          monto?: number
          monto_capital?: number | null
          monto_interes?: number | null
          movimiento_original_id?: string | null
          resultado?: Database["public"]["Enums"]["resultado_movimiento"]
          stripe_event_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_movimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "movimiento_pago_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "cuota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimiento_pago_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "saldo_cuota"
            referencedColumns: ["cuota_id"]
          },
          {
            foreignKeyName: "movimiento_pago_movimiento_original_id_fkey"
            columns: ["movimiento_original_id"]
            isOneToOne: false
            referencedRelation: "movimiento_pago"
            referencedColumns: ["id"]
          },
        ]
      }
      niveles_score: {
        Row: {
          activo: boolean
          dealer_fee_pct: number | null
          dealer_fee_socio_pct: number | null
          fecha_registro: string
          id: string
          nombre_nivel: string
          score_max: number
          score_min: number
          tasa_interes: number
        }
        Insert: {
          activo?: boolean
          dealer_fee_pct?: number | null
          dealer_fee_socio_pct?: number | null
          fecha_registro?: string
          id?: string
          nombre_nivel: string
          score_max: number
          score_min: number
          tasa_interes: number
        }
        Update: {
          activo?: boolean
          dealer_fee_pct?: number | null
          dealer_fee_socio_pct?: number | null
          fecha_registro?: string
          id?: string
          nombre_nivel?: string
          score_max?: number
          score_min?: number
          tasa_interes?: number
        }
        Relationships: []
      }
      notificacion: {
        Row: {
          cliente_id: string | null
          cuota_id: string | null
          destinatario: Database["public"]["Enums"]["destinatario_notificacion"]
          fecha_registro: string
          id: string
          leida: boolean
          mensaje: string
          tipo: Database["public"]["Enums"]["tipo_notificacion"]
        }
        Insert: {
          cliente_id?: string | null
          cuota_id?: string | null
          destinatario: Database["public"]["Enums"]["destinatario_notificacion"]
          fecha_registro?: string
          id?: string
          leida?: boolean
          mensaje: string
          tipo: Database["public"]["Enums"]["tipo_notificacion"]
        }
        Update: {
          cliente_id?: string | null
          cuota_id?: string | null
          destinatario?: Database["public"]["Enums"]["destinatario_notificacion"]
          fecha_registro?: string
          id?: string
          leida?: boolean
          mensaje?: string
          tipo?: Database["public"]["Enums"]["tipo_notificacion"]
        }
        Relationships: [
          {
            foreignKeyName: "notificacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacion_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "cuota"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacion_cuota_id_fkey"
            columns: ["cuota_id"]
            isOneToOne: false
            referencedRelation: "saldo_cuota"
            referencedColumns: ["cuota_id"]
          },
        ]
      }
      prestamo: {
        Row: {
          contrato_id: string
          estado: Database["public"]["Enums"]["estado_prestamo"]
          fecha_registro: string
          id: string
          mandato_cobro_id: string | null
          monto_financiado: number
        }
        Insert: {
          contrato_id: string
          estado?: Database["public"]["Enums"]["estado_prestamo"]
          fecha_registro?: string
          id?: string
          mandato_cobro_id?: string | null
          monto_financiado: number
        }
        Update: {
          contrato_id?: string
          estado?: Database["public"]["Enums"]["estado_prestamo"]
          fecha_registro?: string
          id?: string
          mandato_cobro_id?: string | null
          monto_financiado?: number
        }
        Relationships: [
          {
            foreignKeyName: "prestamo_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: true
            referencedRelation: "contrato"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestamo_mandato_cobro_id_fkey"
            columns: ["mandato_cobro_id"]
            isOneToOne: false
            referencedRelation: "mandato_cobro"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitud_credito: {
        Row: {
          cliente_id: string
          consulta_score_id: string | null
          decidido_por: string | null
          decision: Database["public"]["Enums"]["decision_credito"]
          fecha_registro: string
          id: string
          monto_solicitado: number
          motivo_rechazo: string | null
        }
        Insert: {
          cliente_id: string
          consulta_score_id?: string | null
          decidido_por?: string | null
          decision?: Database["public"]["Enums"]["decision_credito"]
          fecha_registro?: string
          id?: string
          monto_solicitado: number
          motivo_rechazo?: string | null
        }
        Update: {
          cliente_id?: string
          consulta_score_id?: string | null
          decidido_por?: string | null
          decision?: Database["public"]["Enums"]["decision_credito"]
          fecha_registro?: string
          id?: string
          monto_solicitado?: number
          motivo_rechazo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_credito_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_credito_consulta_score_id_fkey"
            columns: ["consulta_score_id"]
            isOneToOne: false
            referencedRelation: "consulta_score"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_credito_decidido_por_fkey"
            columns: ["decidido_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          activo: boolean
          auth_user_id: string | null
          correo: string
          fecha_registro: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          activo?: boolean
          auth_user_id?: string | null
          correo: string
          fecha_registro?: string
          id?: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          activo?: boolean
          auth_user_id?: string | null
          correo?: string
          fecha_registro?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: []
      }
    }
    Views: {
      saldo_cuota: {
        Row: {
          cuota_id: string | null
          monto_cuota: number | null
          saldo_pendiente: number | null
          total_cobrado: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_cliente_id: { Args: never; Returns: string }
      current_usuario_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      decision_credito: "pendiente" | "aprobado" | "rechazado"
      destinatario_notificacion: "admin" | "cliente"
      estado_cuota: "pendiente" | "pagada" | "vencida" | "en_mora"
      estado_mandato: "activo" | "inactivo"
      estado_prestamo: "activo" | "pagado" | "cancelado"
      resultado_movimiento: "exitoso" | "reintento" | "fallido"
      rol_usuario: "admin" | "vendedor"
      tipo_evento_auditoria:
        | "ver_ssn"
        | "consulta_score"
        | "aprobacion_credito"
        | "rechazo_credito"
      tipo_movimiento: "cobro" | "mora" | "reembolso" | "ajuste"
      tipo_notificacion:
        | "cobro_exitoso"
        | "cobro_fallido"
        | "entrada_mora"
        | "prestamo_cancelado"
        | "reembolso"
        | "credito_rechazado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      decision_credito: ["pendiente", "aprobado", "rechazado"],
      destinatario_notificacion: ["admin", "cliente"],
      estado_cuota: ["pendiente", "pagada", "vencida", "en_mora"],
      estado_mandato: ["activo", "inactivo"],
      estado_prestamo: ["activo", "pagado", "cancelado"],
      resultado_movimiento: ["exitoso", "reintento", "fallido"],
      rol_usuario: ["admin", "vendedor"],
      tipo_evento_auditoria: [
        "ver_ssn",
        "consulta_score",
        "aprobacion_credito",
        "rechazo_credito",
      ],
      tipo_movimiento: ["cobro", "mora", "reembolso", "ajuste"],
      tipo_notificacion: [
        "cobro_exitoso",
        "cobro_fallido",
        "entrada_mora",
        "prestamo_cancelado",
        "reembolso",
        "credito_rechazado",
      ],
    },
  },
} as const
