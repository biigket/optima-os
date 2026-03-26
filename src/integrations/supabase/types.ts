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
      account_documents: {
        Row: {
          account_id: string
          created_at: string
          doc_label: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          doc_label?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          doc_label?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_documents_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_pinned: boolean
          priority: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          priority?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_pinned?: boolean
          priority?: string
          title?: string
        }
        Relationships: []
      }
      campaign_targets: {
        Row: {
          assigned_sale: string | null
          campaign_name: string
          clinic_name: string
          contact_status: string
          created_at: string
          device_type: string | null
          facebook: string | null
          id: string
          line_id: string | null
          notes: string | null
          phone: string | null
          priority_group: string | null
          products_used: string | null
          province: string | null
          visited_at: string | null
          zone: string | null
        }
        Insert: {
          assigned_sale?: string | null
          campaign_name?: string
          clinic_name: string
          contact_status?: string
          created_at?: string
          device_type?: string | null
          facebook?: string | null
          id?: string
          line_id?: string | null
          notes?: string | null
          phone?: string | null
          priority_group?: string | null
          products_used?: string | null
          province?: string | null
          visited_at?: string | null
          zone?: string | null
        }
        Update: {
          assigned_sale?: string | null
          campaign_name?: string
          clinic_name?: string
          contact_status?: string
          created_at?: string
          device_type?: string | null
          facebook?: string | null
          id?: string
          line_id?: string | null
          notes?: string | null
          phone?: string | null
          priority_group?: string | null
          products_used?: string | null
          province?: string | null
          visited_at?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      company_events: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          start_time: string | null
          title: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          start_time?: string | null
          title: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
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
      contracts: {
        Row: {
          account_id: string | null
          additional_notes: string | null
          appendix_items: Json | null
          buyer_address: string | null
          buyer_company_name: string | null
          buyer_id_expiry: string | null
          buyer_id_number: string | null
          buyer_phone: string | null
          buyer_representative_name: string | null
          buyer_signature: string | null
          contract_date: string
          contract_number: string
          created_at: string
          created_by: string | null
          delivery_address: string | null
          delivery_days: number | null
          deposit_amount: number | null
          deposit_date: string | null
          id: string
          installment_count: number | null
          payment_details: Json | null
          payment_method: string | null
          product_accessories: Json | null
          product_brand: string | null
          product_name: string | null
          product_origin: string | null
          product_quantity: number | null
          product_type: string
          qt_number: string | null
          quotation_id: string | null
          remaining_amount: number | null
          seller_representative_name: string | null
          seller_signature: string | null
          signed_at: string | null
          status: string
          total_price: number | null
          warranty_details: Json | null
          warranty_years: number | null
          witness_name: string | null
        }
        Insert: {
          account_id?: string | null
          additional_notes?: string | null
          appendix_items?: Json | null
          buyer_address?: string | null
          buyer_company_name?: string | null
          buyer_id_expiry?: string | null
          buyer_id_number?: string | null
          buyer_phone?: string | null
          buyer_representative_name?: string | null
          buyer_signature?: string | null
          contract_date?: string
          contract_number: string
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          delivery_days?: number | null
          deposit_amount?: number | null
          deposit_date?: string | null
          id?: string
          installment_count?: number | null
          payment_details?: Json | null
          payment_method?: string | null
          product_accessories?: Json | null
          product_brand?: string | null
          product_name?: string | null
          product_origin?: string | null
          product_quantity?: number | null
          product_type?: string
          qt_number?: string | null
          quotation_id?: string | null
          remaining_amount?: number | null
          seller_representative_name?: string | null
          seller_signature?: string | null
          signed_at?: string | null
          status?: string
          total_price?: number | null
          warranty_details?: Json | null
          warranty_years?: number | null
          witness_name?: string | null
        }
        Update: {
          account_id?: string | null
          additional_notes?: string | null
          appendix_items?: Json | null
          buyer_address?: string | null
          buyer_company_name?: string | null
          buyer_id_expiry?: string | null
          buyer_id_number?: string | null
          buyer_phone?: string | null
          buyer_representative_name?: string | null
          buyer_signature?: string | null
          contract_date?: string
          contract_number?: string
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          delivery_days?: number | null
          deposit_amount?: number | null
          deposit_date?: string | null
          id?: string
          installment_count?: number | null
          payment_details?: Json | null
          payment_method?: string | null
          product_accessories?: Json | null
          product_brand?: string | null
          product_name?: string | null
          product_origin?: string | null
          product_quantity?: number | null
          product_type?: string
          qt_number?: string | null
          quotation_id?: string | null
          remaining_amount?: number | null
          seller_representative_name?: string | null
          seller_signature?: string | null
          signed_at?: string | null
          status?: string
          total_price?: number | null
          warranty_details?: Json | null
          warranty_years?: number | null
          witness_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
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
      document_running_numbers: {
        Row: {
          doc_type: string
          id: string
          last_number: number
          year_month: string
        }
        Insert: {
          doc_type: string
          id?: string
          last_number?: number
          year_month: string
        }
        Update: {
          doc_type?: string
          id?: string
          last_number?: number
          year_month?: string
        }
        Relationships: []
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
          report_data: Json | null
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
          report_data?: Json | null
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
          report_data?: Json | null
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
      mock_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          password: string
          position: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          password: string
          position?: string
          role?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          password?: string
          position?: string
          role?: string
          username?: string
        }
        Relationships: []
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
          created_by: string | null
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
          created_by?: string | null
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
          created_by?: string | null
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
          payment_date: string | null
          quotation_id: string
          receipt_sent: boolean | null
          reject_reason: string | null
          slip_file: string | null
          slip_status: string | null
          slip_uploaded_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number: number
          paid_date?: string | null
          payment_channel?: string | null
          payment_date?: string | null
          quotation_id: string
          receipt_sent?: boolean | null
          reject_reason?: string | null
          slip_file?: string | null
          slip_status?: string | null
          slip_uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          paid_date?: string | null
          payment_channel?: string | null
          payment_date?: string | null
          quotation_id?: string
          receipt_sent?: boolean | null
          reject_reason?: string | null
          slip_file?: string | null
          slip_status?: string | null
          slip_uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
      payment_links: {
        Row: {
          amount: number
          created_at: string
          id: string
          installment_months: number | null
          payment_link_ref: string | null
          payment_link_url: string | null
          portone_order_id: string | null
          quotation_id: string
          remark: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          installment_months?: number | null
          payment_link_ref?: string | null
          payment_link_url?: string | null
          portone_order_id?: string | null
          quotation_id: string
          remark?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          installment_months?: number | null
          payment_link_ref?: string | null
          payment_link_url?: string | null
          portone_order_id?: string | null
          quotation_id?: string
          remark?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_quotation_id_fkey"
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
      qc_stock_items: {
        Row: {
          account_id: string | null
          borrow_from: string | null
          borrow_to: string | null
          cartridge_type: string | null
          clinic: string | null
          created_at: string
          depleted: boolean | null
          email_trica: string | null
          fail_reason: string | null
          handpiece: string | null
          hfl1: string | null
          hfl2: string | null
          hrm: string | null
          hrm_sell_or_keep: string | null
          hsd1: string | null
          hsd2: string | null
          id: string
          inspection_doc: string | null
          install_date: string | null
          notes: string | null
          product_type: string
          received_date: string | null
          reserved_for: string | null
          serial_number: string | null
          status: string | null
          storage_location: string | null
          ups_stabilizer: string | null
          warranty_days: number | null
          warranty_expiry: string | null
        }
        Insert: {
          account_id?: string | null
          borrow_from?: string | null
          borrow_to?: string | null
          cartridge_type?: string | null
          clinic?: string | null
          created_at?: string
          depleted?: boolean | null
          email_trica?: string | null
          fail_reason?: string | null
          handpiece?: string | null
          hfl1?: string | null
          hfl2?: string | null
          hrm?: string | null
          hrm_sell_or_keep?: string | null
          hsd1?: string | null
          hsd2?: string | null
          id?: string
          inspection_doc?: string | null
          install_date?: string | null
          notes?: string | null
          product_type?: string
          received_date?: string | null
          reserved_for?: string | null
          serial_number?: string | null
          status?: string | null
          storage_location?: string | null
          ups_stabilizer?: string | null
          warranty_days?: number | null
          warranty_expiry?: string | null
        }
        Update: {
          account_id?: string | null
          borrow_from?: string | null
          borrow_to?: string | null
          cartridge_type?: string | null
          clinic?: string | null
          created_at?: string
          depleted?: boolean | null
          email_trica?: string | null
          fail_reason?: string | null
          handpiece?: string | null
          hfl1?: string | null
          hfl2?: string | null
          hrm?: string | null
          hrm_sell_or_keep?: string | null
          hsd1?: string | null
          hsd2?: string | null
          id?: string
          inspection_doc?: string | null
          install_date?: string | null
          notes?: string | null
          product_type?: string
          received_date?: string | null
          reserved_for?: string | null
          serial_number?: string | null
          status?: string | null
          storage_location?: string | null
          ups_stabilizer?: string | null
          warranty_days?: number | null
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      quotations: {
        Row: {
          account_id: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          approved_name: string | null
          approved_position: string | null
          approved_signature: string | null
          billing_note_number: string | null
          created_at: string
          customer_signature: string | null
          customer_signed_at: string | null
          customer_signer_name: string | null
          delivery_note_number: string | null
          deposit_paid_date: string | null
          deposit_slip: string | null
          deposit_slip_status: string | null
          deposit_type: string | null
          deposit_value: number | null
          docs_generated_at: string | null
          has_installments: boolean | null
          id: string
          installment_count: number | null
          invoice_sent: boolean | null
          leasing_doc: string | null
          payment_condition: string | null
          payment_due_day: number | null
          payment_link_ref: string | null
          payment_link_url: string | null
          payment_status: string | null
          portone_order_id: string | null
          price: number | null
          product: string | null
          qt_attachment: string | null
          qt_date: string | null
          qt_number: string | null
          reject_reason: string | null
          sale_assigned: string | null
          submitted_at: string | null
          tax_invoice_number: string | null
        }
        Insert: {
          account_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_name?: string | null
          approved_position?: string | null
          approved_signature?: string | null
          billing_note_number?: string | null
          created_at?: string
          customer_signature?: string | null
          customer_signed_at?: string | null
          customer_signer_name?: string | null
          delivery_note_number?: string | null
          deposit_paid_date?: string | null
          deposit_slip?: string | null
          deposit_slip_status?: string | null
          deposit_type?: string | null
          deposit_value?: number | null
          docs_generated_at?: string | null
          has_installments?: boolean | null
          id?: string
          installment_count?: number | null
          invoice_sent?: boolean | null
          leasing_doc?: string | null
          payment_condition?: string | null
          payment_due_day?: number | null
          payment_link_ref?: string | null
          payment_link_url?: string | null
          payment_status?: string | null
          portone_order_id?: string | null
          price?: number | null
          product?: string | null
          qt_attachment?: string | null
          qt_date?: string | null
          qt_number?: string | null
          reject_reason?: string | null
          sale_assigned?: string | null
          submitted_at?: string | null
          tax_invoice_number?: string | null
        }
        Update: {
          account_id?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          approved_name?: string | null
          approved_position?: string | null
          approved_signature?: string | null
          billing_note_number?: string | null
          created_at?: string
          customer_signature?: string | null
          customer_signed_at?: string | null
          customer_signer_name?: string | null
          delivery_note_number?: string | null
          deposit_paid_date?: string | null
          deposit_slip?: string | null
          deposit_slip_status?: string | null
          deposit_type?: string | null
          deposit_value?: number | null
          docs_generated_at?: string | null
          has_installments?: boolean | null
          id?: string
          installment_count?: number | null
          invoice_sent?: boolean | null
          leasing_doc?: string | null
          payment_condition?: string | null
          payment_due_day?: number | null
          payment_link_ref?: string | null
          payment_link_url?: string | null
          payment_status?: string | null
          portone_order_id?: string | null
          price?: number | null
          product?: string | null
          qt_attachment?: string | null
          qt_date?: string | null
          qt_number?: string | null
          reject_reason?: string | null
          sale_assigned?: string | null
          submitted_at?: string | null
          tax_invoice_number?: string | null
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
      role_permissions: {
        Row: {
          can_view: boolean
          created_at: string | null
          id: string
          module_key: string
          role_key: string
        }
        Insert: {
          can_view?: boolean
          created_at?: string | null
          id?: string
          module_key: string
          role_key: string
        }
        Update: {
          can_view?: boolean
          created_at?: string | null
          id?: string
          module_key?: string
          role_key?: string
        }
        Relationships: []
      }
      service_ticket_updates: {
        Row: {
          created_at: string
          id: string
          message: string
          new_status: string | null
          photos: string[] | null
          ticket_id: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          new_status?: string | null
          photos?: string[] | null
          ticket_id: string
          updated_by?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          new_status?: string | null
          photos?: string[] | null
          ticket_id?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_ticket_updates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      service_tickets: {
        Row: {
          account_id: string | null
          assigned_to: string
          clinic: string
          closed_at: string | null
          created_at: string
          id: string
          item_id: string
          item_name: string
          item_type: string
          priority: string
          resolution: string | null
          serial_number: string
          status: string
          symptom: string
          symptom_photos: string[] | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_to?: string
          clinic?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string
          item_type?: string
          priority?: string
          resolution?: string | null
          serial_number?: string
          status?: string
          symptom?: string
          symptom_photos?: string[] | null
          ticket_number: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_to?: string
          clinic?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string
          item_type?: string
          priority?: string
          resolution?: string | null
          serial_number?: string
          status?: string
          symptom?: string
          symptom_photos?: string[] | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tickets_account_id_fkey"
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
      work_checkins: {
        Row: {
          check_in_address: string | null
          check_in_at: string
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_note: string | null
          check_in_photo: string | null
          check_out_address: string | null
          check_out_at: string | null
          check_out_lat: number | null
          check_out_lng: number | null
          check_out_note: string | null
          check_out_photo: string | null
          created_at: string
          department: string | null
          id: string
          user_name: string
          work_type: string
        }
        Insert: {
          check_in_address?: string | null
          check_in_at?: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_note?: string | null
          check_in_photo?: string | null
          check_out_address?: string | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_note?: string | null
          check_out_photo?: string | null
          created_at?: string
          department?: string | null
          id?: string
          user_name: string
          work_type?: string
        }
        Update: {
          check_in_address?: string | null
          check_in_at?: string
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_note?: string | null
          check_in_photo?: string | null
          check_out_address?: string | null
          check_out_at?: string | null
          check_out_lat?: number | null
          check_out_lng?: number | null
          check_out_note?: string | null
          check_out_photo?: string | null
          created_at?: string
          department?: string | null
          id?: string
          user_name?: string
          work_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_doc_number: {
        Args: { p_doc_type: string; p_year_month: string }
        Returns: number
      }
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
