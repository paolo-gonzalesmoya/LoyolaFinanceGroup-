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
      campo_servicio: {
        Row: {
          categoria_id: string
          fecha_registro: string
          id: string
          nombre_campo: string
          opciones: string[] | null
          tipo_dato: Database["public"]["Enums"]["tipo_dato_campo"]
          unidad_medida: string | null
        }
        Insert: {
          categoria_id: string
          fecha_registro?: string
          id?: string
          nombre_campo: string
          opciones?: string[] | null
          tipo_dato?: Database["public"]["Enums"]["tipo_dato_campo"]
          unidad_medida?: string | null
        }
        Update: {
          categoria_id?: string
          fecha_registro?: string
          id?: string
          nombre_campo?: string
          opciones?: string[] | null
          tipo_dato?: Database["public"]["Enums"]["tipo_dato_campo"]
          unidad_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campo_servicio_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      categoria_servicio: {
        Row: {
          fecha_registro: string
          id: string
          nombre: string
        }
        Insert: {
          fecha_registro?: string
          id?: string
          nombre: string
        }
        Update: {
          fecha_registro?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      cliente: {
        Row: {
          auth_user_id: string | null
          correo: string | null
          direccion: string | null
          fecha_registro: string
          id: string
          lead_id: string
          nombre: string
          registrado_por: string
          ssn_itn_cifrado: string | null
          telefono: string | null
        }
        Insert: {
          auth_user_id?: string | null
          correo?: string | null
          direccion?: string | null
          fecha_registro?: string
          id?: string
          lead_id: string
          nombre: string
          registrado_por: string
          ssn_itn_cifrado?: string | null
          telefono?: string | null
        }
        Update: {
          auth_user_id?: string | null
          correo?: string | null
          direccion?: string | null
          fecha_registro?: string
          id?: string
          lead_id?: string
          nombre?: string
          registrado_por?: string
          ssn_itn_cifrado?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      comision_vendedor: {
        Row: {
          contrato_id: string
          estado: Database["public"]["Enums"]["estado_comision"]
          fecha_registro: string
          id: string
          monto: number
          porcentaje: number
          vendedor_id: string
        }
        Insert: {
          contrato_id: string
          estado?: Database["public"]["Enums"]["estado_comision"]
          fecha_registro?: string
          id?: string
          monto: number
          porcentaje: number
          vendedor_id: string
        }
        Update: {
          contrato_id?: string
          estado?: Database["public"]["Enums"]["estado_comision"]
          fecha_registro?: string
          id?: string
          monto?: number
          porcentaje?: number
          vendedor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comision_vendedor_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: true
            referencedRelation: "contrato"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comision_vendedor_vendedor_id_fkey"
            columns: ["vendedor_id"]
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
          downpayment_verificado_por: string | null
          fecha_registro: string
          id: string
          numero_cuotas: number
          registrado_por: string
          solicitud_id: string
          tasa_mensual: number
          vendedor_id: string
        }
        Insert: {
          downpayment_monto: number
          downpayment_pagado?: boolean
          downpayment_verificado_por?: string | null
          fecha_registro?: string
          id?: string
          numero_cuotas: number
          registrado_por: string
          solicitud_id: string
          tasa_mensual: number
          vendedor_id: string
        }
        Update: {
          downpayment_monto?: number
          downpayment_pagado?: boolean
          downpayment_verificado_por?: string | null
          fecha_registro?: string
          id?: string
          numero_cuotas?: number
          registrado_por?: string
          solicitud_id?: string
          tasa_mensual?: number
          vendedor_id?: string
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
          {
            foreignKeyName: "contrato_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion: {
        Row: {
          cliente_id: string
          elaborada_por: string
          fecha_registro: string
          id: string
          requiere_financiamiento: boolean
        }
        Insert: {
          cliente_id: string
          elaborada_por: string
          fecha_registro?: string
          id?: string
          requiere_financiamiento?: boolean
        }
        Update: {
          cliente_id?: string
          elaborada_por?: string
          fecha_registro?: string
          id?: string
          requiere_financiamiento?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "cliente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizacion_elaborada_por_fkey"
            columns: ["elaborada_por"]
            isOneToOne: false
            referencedRelation: "usuario"
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
      item_cotizacion: {
        Row: {
          cantidad: number
          cotizacion_id: string
          descripcion: string
          id: string
          precio_unitario: number
          subtotal: number | null
        }
        Insert: {
          cantidad?: number
          cotizacion_id: string
          descripcion: string
          id?: string
          precio_unitario: number
          subtotal?: number | null
        }
        Update: {
          cantidad?: number
          cotizacion_id?: string
          descripcion?: string
          id?: string
          precio_unitario?: number
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "item_cotizacion_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizacion"
            referencedColumns: ["id"]
          },
        ]
      }
      lead: {
        Row: {
          categoria_id: string
          correo: string | null
          direccion: string | null
          estado: Database["public"]["Enums"]["estado_lead"]
          fecha_registro: string
          foto_dni_url: string | null
          foto_recibo_url: string | null
          id: string
          nombre: string
          registrado_por: string
          telefono: string | null
          vendedor_id: string | null
        }
        Insert: {
          categoria_id: string
          correo?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          fecha_registro?: string
          foto_dni_url?: string | null
          foto_recibo_url?: string | null
          id?: string
          nombre: string
          registrado_por: string
          telefono?: string | null
          vendedor_id?: string | null
        }
        Update: {
          categoria_id?: string
          correo?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          fecha_registro?: string
          foto_dni_url?: string | null
          foto_recibo_url?: string | null
          id?: string
          nombre?: string
          registrado_por?: string
          telefono?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categoria_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      mandato_cobro: {
        Row: {
          cliente_id: string
          estado: Database["public"]["Enums"]["estado_mandato"]
          fecha_registro: string
          id: string
          stripe_payment_method_id: string
        }
        Insert: {
          cliente_id: string
          estado?: Database["public"]["Enums"]["estado_mandato"]
          fecha_registro?: string
          id?: string
          stripe_payment_method_id: string
        }
        Update: {
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
          consulta_score_id: string | null
          cotizacion_id: string
          decidido_por: string | null
          decision: Database["public"]["Enums"]["decision_credito"]
          fecha_registro: string
          id: string
          motivo_rechazo: string | null
        }
        Insert: {
          consulta_score_id?: string | null
          cotizacion_id: string
          decidido_por?: string | null
          decision?: Database["public"]["Enums"]["decision_credito"]
          fecha_registro?: string
          id?: string
          motivo_rechazo?: string | null
        }
        Update: {
          consulta_score_id?: string | null
          cotizacion_id?: string
          decidido_por?: string | null
          decision?: Database["public"]["Enums"]["decision_credito"]
          fecha_registro?: string
          id?: string
          motivo_rechazo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_credito_consulta_score_id_fkey"
            columns: ["consulta_score_id"]
            isOneToOne: false
            referencedRelation: "consulta_score"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_credito_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: true
            referencedRelation: "cotizacion"
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
      valor_campo_lead: {
        Row: {
          campo_servicio_id: string
          fecha_registro: string
          id: string
          lead_id: string
          registrado_por: string
          valor: string | null
        }
        Insert: {
          campo_servicio_id: string
          fecha_registro?: string
          id?: string
          lead_id: string
          registrado_por: string
          valor?: string | null
        }
        Update: {
          campo_servicio_id?: string
          fecha_registro?: string
          id?: string
          lead_id?: string
          registrado_por?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valor_campo_lead_campo_servicio_id_fkey"
            columns: ["campo_servicio_id"]
            isOneToOne: false
            referencedRelation: "campo_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valor_campo_lead_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valor_campo_lead_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_cliente_id: { Args: never; Returns: string }
      current_usuario_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_vendedor: { Args: never; Returns: boolean }
    }
    Enums: {
      decision_credito: "pendiente" | "aprobado" | "rechazado"
      estado_comision: "devengada" | "pagada" | "revertida"
      estado_cuota: "pendiente" | "pagada" | "vencida" | "en_mora"
      estado_lead:
        | "activo"
        | "asignado"
        | "en_proceso"
        | "convertido"
        | "descartado"
      estado_mandato: "activo" | "inactivo"
      estado_prestamo: "activo" | "pagado" | "cancelado"
      resultado_movimiento: "exitoso" | "reintento" | "fallido"
      rol_usuario: "admin" | "vendedor"
      tipo_dato_campo: "numero" | "texto" | "seleccion"
      tipo_movimiento: "cobro" | "mora" | "reembolso" | "ajuste"
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
      estado_comision: ["devengada", "pagada", "revertida"],
      estado_cuota: ["pendiente", "pagada", "vencida", "en_mora"],
      estado_lead: [
        "activo",
        "asignado",
        "en_proceso",
        "convertido",
        "descartado",
      ],
      estado_mandato: ["activo", "inactivo"],
      estado_prestamo: ["activo", "pagado", "cancelado"],
      resultado_movimiento: ["exitoso", "reintento", "fallido"],
      rol_usuario: ["admin", "vendedor"],
      tipo_dato_campo: ["numero", "texto", "seleccion"],
      tipo_movimiento: ["cobro", "mora", "reembolso", "ajuste"],
    },
  },
} as const
