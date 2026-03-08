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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          address: string | null
          assigned_sale: string | null
          branch_type: string | null
          clinic_name: string
          company_name: string | null
          created_at: string
          current_devices: string | null
          customer_status: string
          email: string | null
          entity_type: string | null
          grade: string | null
          id: string
          lead_source: string | null
          notes: string | null
          phone: string | null
          single_or_chain: string | null
          tax_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_sale?: string | null
          branch_type?: string | null
          clinic_name: string
          company_name?: string | null
          created_at?: string
          current_devices?: string | null
          customer_status?: string
          email?: string | null
          entity_type?: string | null
          grade?: string | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          single_or_chain?: string | null
          tax_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_sale?: string | null
          branch_type?: string | null
          clinic_name?: string
          company_name?: string | null
          created_at?: string
          current_devices?: string | null
          customer_status?: string
          email?: string | null
          entity_type?: string | null
          grade?: string | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          single_or_chain?: string | null
          tax_id?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          account_id: string
          activity_date: string
          activity_type: string
          assigned_to: string[] | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          is_done: boolean | null
          location: string | null
          notes: string | null
          opportunity_id: string
          priority: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          account_id: string
          activity_date: string
          activity_type?: string
          assigned_to?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_done?: boolean | null
          location?: string | null
          notes?: string | null
          opportunity_id: string
          priority?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          account_id?: string
          activity_date?: string
          activity_type?: string
          assigned_to?: string[] | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_done?: boolean | null
          location?: string | null
          notes?: string | null
          opportunity_id?: string
          priority?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          email: string | null
          id: string
          is_decision_maker: boolean | null
          line_id: string | null
          name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_decision_maker?: boolean | null
          line_id?: string | null
          name: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_decision_maker?: boolean | null
          line_id?: string | null
          name?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      demos: {
        Row: {
          account_id: string | null
          confirmed: boolean
          created_at: string
          demo_date: string | null
          demo_note: string | null
          fl20_shots: number | null
          fl30_shots: number | null
          fl45_shots: number | null
          id: string
          location: string | null
          opportunity_id: string | null
          products_demo: string[] | null
          reminded: boolean | null
          report_data: Json | null
          report_submitted: boolean
          rm_i49_tips: number | null
          rm_n49_tips: number | null
          sd15_shots: number | null
          sd30_shots: number | null
          sd45_shots: number | null
          visited_by: string[] | null
        }
        Insert: {
          account_id?: string | null
          confirmed?: boolean
          created_at?: string
          demo_date?: string | null
          demo_note?: string | null
          fl20_shots?: number | null
          fl30_shots?: number | null
          fl45_shots?: number | null
          id?: string
          location?: string | null
          opportunity_id?: string | null
          products_demo?: string[] | null
          reminded?: boolean | null
          report_data?: Json | null
          report_submitted?: boolean
          rm_i49_tips?: number | null
          rm_n49_tips?: number | null
          sd15_shots?: number | null
          sd30_shots?: number | null
          sd45_shots?: number | null
          visited_by?: string[] | null
        }
        Update: {
          account_id?: string | null
          confirmed?: boolean
          created_at?: string
          demo_date?: string | null
          demo_note?: string | null
          fl20_shots?: number | null
          fl30_shots?: number | null
          fl45_shots?: number | null
          id?: string
          location?: string | null
          opportunity_id?: string | null
          products_demo?: string[] | null
          reminded?: boolean | null
          report_data?: Json | null
          report_submitted?: boolean
          rm_i49_tips?: number | null
          rm_n49_tips?: number | null
          sd15_shots?: number | null
          sd30_shots?: number | null
          sd45_shots?: number | null
          visited_by?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "demos_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demos_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      installations: {
        Row: {
          account_id: string | null
          cartridges_installed: string | null
          created_at: string
          district: string | null
          has_rm_handpiece: boolean | null
          id: string
          install_date: string | null
          product_id: string | null
          province: string | null
          region: string | null
          serial_number: string | null
          status: string | null
          warranty_days: number | null
          warranty_expiry: string | null
        }
        Insert: {
          account_id?: string | null
          cartridges_installed?: string | null
          created_at?: string
          district?: string | null
          has_rm_handpiece?: boolean | null
          id?: string
          install_date?: string | null
          product_id?: string | null
          province?: string | null
          region?: string | null
          serial_number?: string | null
          status?: string | null
          warranty_days?: number | null
          warranty_expiry?: string | null
        }
        Update: {
          account_id?: string | null
          cartridges_installed?: string | null
          created_at?: string
          district?: string | null
          has_rm_handpiece?: boolean | null
          id?: string
          install_date?: string | null
          product_id?: string | null
          province?: string | null
          region?: string | null
          serial_number?: string | null
          status?: string | null
          warranty_days?: number | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          actual_date: string | null
          created_at: string
          id: string
          installation_id: string
          maintenance_number: number
          photos: string[] | null
          report_file: string | null
          scheduled_date: string | null
          status: string | null
        }
        Insert: {
          actual_date?: string | null
          created_at?: string
          id?: string
          installation_id: string
          maintenance_number: number
          photos?: string[] | null
          report_file?: string | null
          scheduled_date?: string | null
          status?: string | null
        }
        Update: {
          actual_date?: string | null
          created_at?: string
          id?: string
          installation_id?: string
          maintenance_number?: number
          photos?: string[] | null
          report_file?: string | null
          scheduled_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "installations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          account_id: string
          assigned_sale: string | null
          authority_contact_id: string | null
          budget_range: string | null
          close_date: string | null
          competitors: string | null
          created_at: string
          customer_grade: string | null
          expected_value: number | null
          id: string
          interested_products: string[] | null
          needs: string[] | null
          next_activity_date: string | null
          next_activity_type: string | null
          notes: string | null
          opportunity_type: string | null
          order_frequency: string | null
          payment_method: string | null
          probability: number | null
          stage: string
          stuck_reason: string | null
        }
        Insert: {
          account_id: string
          assigned_sale?: string | null
          authority_contact_id?: string | null
          budget_range?: string | null
          close_date?: string | null
          competitors?: string | null
          created_at?: string
          customer_grade?: string | null
          expected_value?: number | null
          id?: string
          interested_products?: string[] | null
          needs?: string[] | null
          next_activity_date?: string | null
          next_activity_type?: string | null
          notes?: string | null
          opportunity_type?: string | null
          order_frequency?: string | null
          payment_method?: string | null
          probability?: number | null
          stage?: string
          stuck_reason?: string | null
        }
        Update: {
          account_id?: string
          assigned_sale?: string | null
          authority_contact_id?: string | null
          budget_range?: string | null
          close_date?: string | null
          competitors?: string | null
          created_at?: string
          customer_grade?: string | null
          expected_value?: number | null
          id?: string
          interested_products?: string[] | null
          needs?: string[] | null
          next_activity_date?: string | null
          next_activity_type?: string | null
          notes?: string | null
          opportunity_type?: string | null
          order_frequency?: string | null
          payment_method?: string | null
          probability?: number | null
          stage?: string
          stuck_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_authority_contact_id_fkey"
            columns: ["authority_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_files: {
        Row: {
          account_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          opportunity_id: string
          uploaded_by: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          opportunity_id: string
          uploaded_by?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          opportunity_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      opportunity_notes: {
        Row: {
          account_id: string
          content: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_pinned: boolean
          opportunity_id: string
          parent_id: string | null
        }
        Insert: {
          account_id: string
          content: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          opportunity_id: string
          parent_id?: string | null
        }
        Update: {
          account_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          opportunity_id?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "opportunity_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stage_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_stage: string
          id: string
          opportunity_id: string
          to_stage: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_stage: string
          id?: string
          opportunity_id: string
          to_stage: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_stage?: string
          id?: string
          opportunity_id?: string
          to_stage?: string
        }
        Relationships: []
      }
      payment_installments: {
        Row: {
          amount: number | null
          created_at: string
          due_date: string | null
          id: string
          installment_number: number
          paid_date: string | null
          payment_channel: string | null
          quotation_id: string
          receipt_sent: boolean | null
          slip_file: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number: number
          paid_date?: string | null
          payment_channel?: string | null
          quotation_id: string
          receipt_sent?: boolean | null
          slip_file?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          paid_date?: string | null
          payment_channel?: string | null
          quotation_id?: string
          receipt_sent?: boolean | null
          slip_file?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number | null
          category: string
          created_at: string
          description: string | null
          id: string
          product_code: string | null
          product_name: string
        }
        Insert: {
          base_price?: number | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          product_code?: string | null
          product_name: string
        }
        Update: {
          base_price?: number | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          product_code?: string | null
          product_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          id: string
          name: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id: string
          name?: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          account_id: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          invoice_sent: boolean | null
          leasing_doc: string | null
          payment_condition: string | null
          payment_status: string | null
          price: number | null
          product: string | null
          qt_attachment: string | null
          qt_date: string | null
          qt_number: string | null
          reject_reason: string | null
          sale_assigned: string | null
          submitted_at: string | null
        }
        Insert: {
          account_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          invoice_sent?: boolean | null
          leasing_doc?: string | null
          payment_condition?: string | null
          payment_status?: string | null
          price?: number | null
          product?: string | null
          qt_attachment?: string | null
          qt_date?: string | null
          qt_number?: string | null
          reject_reason?: string | null
          sale_assigned?: string | null
          submitted_at?: string | null
        }
        Update: {
          account_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          invoice_sent?: boolean | null
          leasing_doc?: string | null
          payment_condition?: string | null
          payment_status?: string | null
          price?: number | null
          product?: string | null
          qt_attachment?: string | null
          qt_date?: string | null
          qt_number?: string | null
          reject_reason?: string | null
          sale_assigned?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_plans: {
        Row: {
          account_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          notes: string | null
          objective: string | null
          plan_date: string
          products_presented: string | null
          start_time: string | null
          status: string
          visit_report_id: string | null
          visit_type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          plan_date: string
          products_presented?: string | null
          start_time?: string | null
          status?: string
          visit_report_id?: string | null
          visit_type?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          objective?: string | null
          plan_date?: string
          products_presented?: string | null
          start_time?: string | null
          status?: string
          visit_report_id?: string | null
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_plans_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_plans_visit_report_id_fkey"
            columns: ["visit_report_id"]
            isOneToOne: false
            referencedRelation: "visit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_reports: {
        Row: {
          account_id: string | null
          action: string | null
          check_in_at: string | null
          check_out_at: string | null
          clinic_name: string | null
          created_at: string
          created_by: string | null
          customer_type: string | null
          devices_in_use: string | null
          id: string
          issues: string | null
          location: string | null
          met_who: string | null
          new_contact_name: string | null
          new_contact_phone: string | null
          next_plan: string | null
          photo: string | null
          status: string | null
        }
        Insert: {
          account_id?: string | null
          action?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string | null
          devices_in_use?: string | null
          id?: string
          issues?: string | null
          location?: string | null
          met_who?: string | null
          new_contact_name?: string | null
          new_contact_phone?: string | null
          next_plan?: string | null
          photo?: string | null
          status?: string | null
        }
        Update: {
          account_id?: string | null
          action?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          clinic_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string | null
          devices_in_use?: string | null
          id?: string
          issues?: string | null
          location?: string | null
          met_who?: string | null
          new_contact_name?: string | null
          new_contact_phone?: string | null
          next_plan?: string | null
          photo?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_reports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
