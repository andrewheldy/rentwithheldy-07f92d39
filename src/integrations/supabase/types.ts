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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acquisition_leads: {
        Row: {
          campaign: string | null
          created_at: string
          current_platforms: string[]
          driver_status: string | null
          email: string
          empower_referral_clicked: boolean
          empower_status: string | null
          expected_duration: string | null
          first_name: string
          id: string
          landing_page: string
          last_name: string
          lead_priority: string | null
          lead_type: string
          mileage: number | null
          need_timeline: string | null
          ownership_status: string | null
          passenger_capacity: string | null
          phone: string
          photo_references: string[]
          platform_subtypes: string[]
          platforms: string[]
          referrer: string | null
          source: string
          status: string
          strategic_interest: boolean
          updated_at: string
          user_agent: string | null
          vehicle_availability: string | null
          vehicle_category: string | null
          vehicle_condition: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_trim: string | null
          vehicle_type: string | null
          vehicle_year: number | null
          vin: string | null
          weekly_budget_max: number | null
          weekly_budget_min: number | null
          zip_code: string
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          current_platforms?: string[]
          driver_status?: string | null
          email: string
          empower_referral_clicked?: boolean
          empower_status?: string | null
          expected_duration?: string | null
          first_name: string
          id?: string
          landing_page: string
          last_name: string
          lead_priority?: string | null
          lead_type: string
          mileage?: number | null
          need_timeline?: string | null
          ownership_status?: string | null
          passenger_capacity?: string | null
          phone: string
          photo_references?: string[]
          platform_subtypes?: string[]
          platforms?: string[]
          referrer?: string | null
          source?: string
          status?: string
          strategic_interest?: boolean
          updated_at?: string
          user_agent?: string | null
          vehicle_availability?: string | null
          vehicle_category?: string | null
          vehicle_condition?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          vin?: string | null
          weekly_budget_max?: number | null
          weekly_budget_min?: number | null
          zip_code: string
        }
        Update: {
          campaign?: string | null
          created_at?: string
          current_platforms?: string[]
          driver_status?: string | null
          email?: string
          empower_referral_clicked?: boolean
          empower_status?: string | null
          expected_duration?: string | null
          first_name?: string
          id?: string
          landing_page?: string
          last_name?: string
          lead_priority?: string | null
          lead_type?: string
          mileage?: number | null
          need_timeline?: string | null
          ownership_status?: string | null
          passenger_capacity?: string | null
          phone?: string
          photo_references?: string[]
          platform_subtypes?: string[]
          platforms?: string[]
          referrer?: string | null
          source?: string
          status?: string
          strategic_interest?: boolean
          updated_at?: string
          user_agent?: string | null
          vehicle_availability?: string | null
          vehicle_category?: string | null
          vehicle_condition?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_trim?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          vin?: string | null
          weekly_budget_max?: number | null
          weekly_budget_min?: number | null
          zip_code?: string
        }
        Relationships: []
      }
      agreement_events: {
        Row: {
          actor_type: string
          actor_user_id: string | null
          agreement_id: string
          agreement_version_id: string | null
          created_at: string
          event_type: string
          id: string
          message: string | null
          metadata: Json
          signer_id: string | null
        }
        Insert: {
          actor_type?: string
          actor_user_id?: string | null
          agreement_id: string
          agreement_version_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
          signer_id?: string | null
        }
        Update: {
          actor_type?: string
          actor_user_id?: string | null
          agreement_id?: string
          agreement_version_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          signer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_events_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_events_agreement_version_id_fkey"
            columns: ["agreement_version_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_events_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "agreement_signers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_events_signer_version_agreement_fk"
            columns: ["signer_id", "agreement_version_id", "agreement_id"]
            isOneToOne: false
            referencedRelation: "agreement_signers"
            referencedColumns: ["id", "agreement_version_id", "agreement_id"]
          },
          {
            foreignKeyName: "agreement_events_version_agreement_fk"
            columns: ["agreement_version_id", "agreement_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id", "agreement_id"]
          },
        ]
      }
      agreement_signers: {
        Row: {
          agreement_id: string
          agreement_version_id: string
          consent_version: string | null
          consented_at: string | null
          created_at: string
          document_hash: string | null
          id: string
          invite_sent_at: string | null
          ip_address: unknown
          last_reminder_at: string | null
          reminder_count: number
          required: boolean
          signature_artifact_path: string | null
          signature_method:
            | Database["public"]["Enums"]["agreement_signature_method"]
            | null
          signed_at: string | null
          signer_address: string | null
          signer_email: string
          signer_name: string
          signer_phone: string | null
          signer_role: string
          signing_order: number | null
          status: Database["public"]["Enums"]["agreement_signer_status"]
          typed_signature: string | null
          updated_at: string
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          agreement_id: string
          agreement_version_id: string
          consent_version?: string | null
          consented_at?: string | null
          created_at?: string
          document_hash?: string | null
          id?: string
          invite_sent_at?: string | null
          ip_address?: unknown
          last_reminder_at?: string | null
          reminder_count?: number
          required?: boolean
          signature_artifact_path?: string | null
          signature_method?:
            | Database["public"]["Enums"]["agreement_signature_method"]
            | null
          signed_at?: string | null
          signer_address?: string | null
          signer_email: string
          signer_name: string
          signer_phone?: string | null
          signer_role: string
          signing_order?: number | null
          status?: Database["public"]["Enums"]["agreement_signer_status"]
          typed_signature?: string | null
          updated_at?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          agreement_id?: string
          agreement_version_id?: string
          consent_version?: string | null
          consented_at?: string | null
          created_at?: string
          document_hash?: string | null
          id?: string
          invite_sent_at?: string | null
          ip_address?: unknown
          last_reminder_at?: string | null
          reminder_count?: number
          required?: boolean
          signature_artifact_path?: string | null
          signature_method?:
            | Database["public"]["Enums"]["agreement_signature_method"]
            | null
          signed_at?: string | null
          signer_address?: string | null
          signer_email?: string
          signer_name?: string
          signer_phone?: string | null
          signer_role?: string
          signing_order?: number | null
          status?: Database["public"]["Enums"]["agreement_signer_status"]
          typed_signature?: string | null
          updated_at?: string
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_signers_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_signers_agreement_version_id_fkey"
            columns: ["agreement_version_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_signers_version_agreement_fk"
            columns: ["agreement_version_id", "agreement_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id", "agreement_id"]
          },
        ]
      }
      agreement_signing_tokens: {
        Row: {
          agreement_id: string
          agreement_version_id: string
          created_at: string
          expires_at: string
          id: string
          last_used_at: string | null
          purpose: string
          revoked_at: string | null
          signer_id: string
          token_hash: string
        }
        Insert: {
          agreement_id: string
          agreement_version_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_used_at?: string | null
          purpose?: string
          revoked_at?: string | null
          signer_id: string
          token_hash: string
        }
        Update: {
          agreement_id?: string
          agreement_version_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_used_at?: string | null
          purpose?: string
          revoked_at?: string | null
          signer_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_signing_tokens_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_signing_tokens_agreement_version_id_fkey"
            columns: ["agreement_version_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_signing_tokens_signer_id_fkey"
            columns: ["signer_id"]
            isOneToOne: false
            referencedRelation: "agreement_signers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_tokens_signer_version_agreement_fk"
            columns: ["signer_id", "agreement_version_id", "agreement_id"]
            isOneToOne: false
            referencedRelation: "agreement_signers"
            referencedColumns: ["id", "agreement_version_id", "agreement_id"]
          },
          {
            foreignKeyName: "agreement_tokens_version_agreement_fk"
            columns: ["agreement_version_id", "agreement_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id", "agreement_id"]
          },
        ]
      }
      agreement_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          template_definition: Json
          template_key: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          template_definition: Json
          template_key: string
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          template_definition?: Json
          template_key?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      agreement_versions: {
        Row: {
          agreement_data: Json
          agreement_id: string
          created_at: string
          created_by: string
          document_hash: string | null
          frozen_at: string | null
          id: string
          invalidated_at: string | null
          rendered_content: Json | null
          template_id: string
          updated_at: string
          version_number: number
        }
        Insert: {
          agreement_data: Json
          agreement_id: string
          created_at?: string
          created_by: string
          document_hash?: string | null
          frozen_at?: string | null
          id?: string
          invalidated_at?: string | null
          rendered_content?: Json | null
          template_id: string
          updated_at?: string
          version_number: number
        }
        Update: {
          agreement_data?: Json
          agreement_id?: string
          created_at?: string
          created_by?: string
          document_hash?: string | null
          frozen_at?: string | null
          id?: string
          invalidated_at?: string | null
          rendered_content?: Json | null
          template_id?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "agreement_versions_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          agreement_number: string
          completion_email_sent_at: string | null
          consigner_id: string | null
          created_at: string
          created_by: string
          current_version_id: string | null
          executed_at: string | null
          expires_at: string | null
          final_pdf_path: string | null
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          updated_at: string
          voided_at: string | null
        }
        Insert: {
          agreement_number: string
          completion_email_sent_at?: string | null
          consigner_id?: string | null
          created_at?: string
          created_by: string
          current_version_id?: string | null
          executed_at?: string | null
          expires_at?: string | null
          final_pdf_path?: string | null
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          updated_at?: string
          voided_at?: string | null
        }
        Update: {
          agreement_number?: string
          completion_email_sent_at?: string | null
          consigner_id?: string | null
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          executed_at?: string | null
          expires_at?: string | null
          final_pdf_path?: string | null
          id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["agreement_status"]
          template_id?: string
          updated_at?: string
          voided_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreements_consigner_id_fkey"
            columns: ["consigner_id"]
            isOneToOne: false
            referencedRelation: "consigners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_current_version_agreement_fk"
            columns: ["current_version_id", "id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id", "agreement_id"]
          },
          {
            foreignKeyName: "agreements_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "agreement_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          post_id: string
          publisher: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          post_id: string
          publisher?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          post_id?: string
          publisher?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_sources_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          canonical_url: string | null
          category_id: string | null
          content: Json
          created_at: string
          cta_label: string | null
          cta_url: string | null
          excerpt: string
          featured_image: string | null
          featured_image_alt: string | null
          featured_image_height: number | null
          featured_image_width: number | null
          id: string
          last_updated_at: string | null
          meta_description: string | null
          primary_keyword: string | null
          published_at: string | null
          seo_title: string | null
          slug: string
          social_description: string | null
          social_title: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          canonical_url?: string | null
          category_id?: string | null
          content?: Json
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          excerpt?: string
          featured_image?: string | null
          featured_image_alt?: string | null
          featured_image_height?: number | null
          featured_image_width?: number | null
          id?: string
          last_updated_at?: string | null
          meta_description?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug: string
          social_description?: string | null
          social_title?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          canonical_url?: string | null
          category_id?: string | null
          content?: Json
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          excerpt?: string
          featured_image?: string | null
          featured_image_alt?: string | null
          featured_image_height?: number | null
          featured_image_width?: number | null
          id?: string
          last_updated_at?: string | null
          meta_description?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          seo_title?: string | null
          slug?: string
          social_description?: string | null
          social_title?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_slug_redirects: {
        Row: {
          created_at: string
          old_slug: string
          post_id: string
        }
        Insert: {
          created_at?: string
          old_slug: string
          post_id: string
        }
        Update: {
          created_at?: string
          old_slug?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_slug_redirects_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      consigners: {
        Row: {
          acquisition_lead_id: string | null
          created_at: string
          email: string
          id: string
          legal_name: string
          mailing_address: string | null
          payout_method: string | null
          payout_reference: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          acquisition_lead_id?: string | null
          created_at?: string
          email: string
          id?: string
          legal_name: string
          mailing_address?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          acquisition_lead_id?: string | null
          created_at?: string
          email?: string
          id?: string
          legal_name?: string
          mailing_address?: string | null
          payout_method?: string | null
          payout_reference?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consigners_acquisition_lead_id_fkey"
            columns: ["acquisition_lead_id"]
            isOneToOne: false
            referencedRelation: "acquisition_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      consignments: {
        Row: {
          agreement_id: string | null
          consigner_id: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          operator_percent: number
          owner_percent: number
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          agreement_id?: string | null
          consigner_id: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          operator_percent: number
          owner_percent: number
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          agreement_id?: string | null
          consigner_id?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          operator_percent?: number
          owner_percent?: number
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consignments_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignments_consigner_id_fkey"
            columns: ["consigner_id"]
            isOneToOne: false
            referencedRelation: "consigners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "consignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          claim_number: string | null
          company: string | null
          created_at: string
          email: string | null
          form_type: string
          id: string
          location: string | null
          name: string
          needed_when: string | null
          notes: string | null
          passenger_type: string | null
          phone: string
          referred_by: string | null
          service_context: string | null
          status: string
          updated_at: string
          user_agent: string | null
          vertical_path: string | null
        }
        Insert: {
          claim_number?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          form_type: string
          id?: string
          location?: string | null
          name: string
          needed_when?: string | null
          notes?: string | null
          passenger_type?: string | null
          phone: string
          referred_by?: string | null
          service_context?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          vertical_path?: string | null
        }
        Update: {
          claim_number?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          form_type?: string
          id?: string
          location?: string | null
          name?: string
          needed_when?: string | null
          notes?: string | null
          passenger_type?: string | null
          phone?: string
          referred_by?: string | null
          service_context?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          vertical_path?: string | null
        }
        Relationships: []
      }
      owner_statement_lines: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          owner_percent: number
          owner_share_cents: number
          rental_revenue_cents: number
          statement_id: string
          vehicle_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          owner_percent: number
          owner_share_cents?: number
          rental_revenue_cents?: number
          statement_id: string
          vehicle_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          owner_percent?: number
          owner_share_cents?: number
          rental_revenue_cents?: number
          statement_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_statement_lines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_statement_lines_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "owner_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_statement_lines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "owner_statement_lines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_statements: {
        Row: {
          adjustments_cents: number
          consigner_id: string
          created_at: string
          id: string
          issued_at: string | null
          net_payable_cents: number
          notes: string | null
          owner_expenses_cents: number
          owner_share_cents: number
          paid_at: string | null
          pdf_path: string | null
          period_end: string
          period_start: string
          rental_revenue_cents: number
          status: string
          updated_at: string
        }
        Insert: {
          adjustments_cents?: number
          consigner_id: string
          created_at?: string
          id?: string
          issued_at?: string | null
          net_payable_cents?: number
          notes?: string | null
          owner_expenses_cents?: number
          owner_share_cents?: number
          paid_at?: string | null
          pdf_path?: string | null
          period_end: string
          period_start: string
          rental_revenue_cents?: number
          status?: string
          updated_at?: string
        }
        Update: {
          adjustments_cents?: number
          consigner_id?: string
          created_at?: string
          id?: string
          issued_at?: string | null
          net_payable_cents?: number
          notes?: string | null
          owner_expenses_cents?: number
          owner_share_cents?: number
          paid_at?: string | null
          pdf_path?: string | null
          period_end?: string
          period_start?: string
          rental_revenue_cents?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_statements_consigner_id_fkey"
            columns: ["consigner_id"]
            isOneToOne: false
            referencedRelation: "consigners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          marketing_opt_in: boolean
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          marketing_opt_in?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          marketing_opt_in?: boolean
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_bookings: {
        Row: {
          created_at: string
          end_at: string
          external_booking_id: string
          gross_cents: number
          id: string
          raw: Json
          rental_days: number | null
          source: string
          start_at: string
          status: string
          synced_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          end_at: string
          external_booking_id: string
          gross_cents?: number
          id?: string
          raw?: Json
          rental_days?: number | null
          source: string
          start_at: string
          status: string
          synced_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          end_at?: string
          external_booking_id?: string
          gross_cents?: number
          id?: string
          raw?: Json
          rental_days?: number | null
          source?: string
          start_at?: string
          status?: string
          synced_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_transactions: {
        Row: {
          amount_cents: number
          booking_id: string | null
          category: string
          collected_on: string
          created_at: string
          excluded_breakdown: Json
          excluded_cents: number
          external_id: string
          id: string
          platform_fee_cents: number
          processing_fee_cents: number
          raw: Json
          rental_revenue_cents: number
          sales_tax_cents: number
          source: string
          synced_at: string
          unclassified_breakdown: Json
          unclassified_cents: number
          vehicle_id: string
        }
        Insert: {
          amount_cents: number
          booking_id?: string | null
          category: string
          collected_on: string
          created_at?: string
          excluded_breakdown?: Json
          excluded_cents?: number
          external_id: string
          id?: string
          platform_fee_cents?: number
          processing_fee_cents?: number
          raw?: Json
          rental_revenue_cents?: number
          sales_tax_cents?: number
          source: string
          synced_at?: string
          unclassified_breakdown?: Json
          unclassified_cents?: number
          vehicle_id: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string | null
          category?: string
          collected_on?: string
          created_at?: string
          excluded_breakdown?: Json
          excluded_cents?: number
          external_id?: string
          id?: string
          platform_fee_cents?: number
          processing_fee_cents?: number
          raw?: Json
          rental_revenue_cents?: number
          sales_tax_cents?: number
          source?: string
          synced_at?: string
          unclassified_breakdown?: Json
          unclassified_cents?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "rental_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          metadata: Json
          rows_upserted: number
          source: string
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          rows_upserted?: number
          source: string
          started_at?: string
          status?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json
          rows_upserted?: number
          source?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_expenses: {
        Row: {
          amount_cents: number
          borne_by: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          incurred_on: string
          notes: string | null
          receipt_path: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          amount_cents: number
          borne_by?: string
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          incurred_on: string
          notes?: string | null
          receipt_path?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          amount_cents?: number
          borne_by?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          incurred_on?: string
          notes?: string | null
          receipt_path?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_external_refs: {
        Row: {
          created_at: string
          external_id: string
          id: string
          source: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          source: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          source?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_external_refs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_external_refs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_unavailable_periods: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          notes: string | null
          reason: string
          starts_on: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          notes?: string | null
          reason: string
          starts_on: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          notes?: string | null
          reason?: string
          starts_on?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_unavailable_periods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_unavailable_periods_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string
          created_at: string | null
          current_mileage: number | null
          daily_rate: number
          date_added: string | null
          delivery_fee_fll_airport: number | null
          delivery_fee_mia_airport: number | null
          delivery_fee_port_everglades: number | null
          delivery_fee_port_miami: number | null
          description: string
          features: string[] | null
          fleet_status: string
          host_type: string | null
          id: string
          in_service_on: string | null
          initial_mileage: number | null
          last_oil_change_date: string | null
          license_plate: string | null
          location: string | null
          make: string
          model: string
          out_of_service_on: string | null
          rating: number | null
          show_on_site: boolean
          status: string
          trips: number | null
          updated_at: string
          vin: string | null
          weekday_rate: number | null
          weekend_rate: number | null
          year: number
        }
        Insert: {
          color?: string
          created_at?: string | null
          current_mileage?: number | null
          daily_rate: number
          date_added?: string | null
          delivery_fee_fll_airport?: number | null
          delivery_fee_mia_airport?: number | null
          delivery_fee_port_everglades?: number | null
          delivery_fee_port_miami?: number | null
          description?: string
          features?: string[] | null
          fleet_status?: string
          host_type?: string | null
          id?: string
          in_service_on?: string | null
          initial_mileage?: number | null
          last_oil_change_date?: string | null
          license_plate?: string | null
          location?: string | null
          make: string
          model: string
          out_of_service_on?: string | null
          rating?: number | null
          show_on_site?: boolean
          status?: string
          trips?: number | null
          updated_at?: string
          vin?: string | null
          weekday_rate?: number | null
          weekend_rate?: number | null
          year: number
        }
        Update: {
          color?: string
          created_at?: string | null
          current_mileage?: number | null
          daily_rate?: number
          date_added?: string | null
          delivery_fee_fll_airport?: number | null
          delivery_fee_mia_airport?: number | null
          delivery_fee_port_everglades?: number | null
          delivery_fee_port_miami?: number | null
          description?: string
          features?: string[] | null
          fleet_status?: string
          host_type?: string | null
          id?: string
          in_service_on?: string | null
          initial_mileage?: number | null
          last_oil_change_date?: string | null
          license_plate?: string | null
          location?: string | null
          make?: string
          model?: string
          out_of_service_on?: string | null
          rating?: number | null
          show_on_site?: boolean
          status?: string
          trips?: number | null
          updated_at?: string
          vin?: string | null
          weekday_rate?: number | null
          weekend_rate?: number | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_consigner_summary: {
        Row: {
          available_days: number | null
          consigner_id: string | null
          month: string | null
          net_to_owner_cents: number | null
          outstanding_cents: number | null
          owner_expenses_cents: number | null
          owner_share_cents: number | null
          paid_cents: number | null
          rental_days: number | null
          rental_revenue_cents: number | null
          vehicles: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consignments_consigner_id_fkey"
            columns: ["consigner_id"]
            isOneToOne: false
            referencedRelation: "consigners"
            referencedColumns: ["id"]
          },
        ]
      }
      v_fleet_profitability: {
        Row: {
          available_days: number | null
          avg_daily_rate_cents: number | null
          color: string | null
          excluded_cents: number | null
          fleet_status: string | null
          gross_collected_cents: number | null
          make: string | null
          model: string | null
          month: string | null
          net_to_owner_cents: number | null
          operator_expenses_cents: number | null
          operator_net_cents: number | null
          operator_share_cents: number | null
          owner_expenses_cents: number | null
          owner_share_cents: number | null
          rental_days: number | null
          rental_revenue_cents: number | null
          revenue_per_available_day_cents: number | null
          unclassified_cents: number | null
          utilization_pct: number | null
          vehicle_id: string | null
          year: number | null
        }
        Relationships: []
      }
      v_vehicle_monthly_available_days: {
        Row: {
          available_days: number | null
          month: string | null
          vehicle_id: string | null
        }
        Relationships: []
      }
      v_vehicle_monthly_expenses: {
        Row: {
          month: string | null
          operator_expenses_cents: number | null
          owner_expenses_cents: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_vehicle_monthly_performance: {
        Row: {
          available_days: number | null
          avg_daily_rate_cents: number | null
          color: string | null
          excluded_cents: number | null
          gross_collected_cents: number | null
          make: string | null
          model: string | null
          month: string | null
          net_to_owner_cents: number | null
          operator_share_cents: number | null
          owner_expenses_cents: number | null
          owner_share_cents: number | null
          rental_days: number | null
          rental_revenue_cents: number | null
          revenue_per_available_day_cents: number | null
          unclassified_cents: number | null
          utilization_pct: number | null
          vehicle_id: string | null
          year: number | null
        }
        Relationships: []
      }
      v_vehicle_monthly_rental_days: {
        Row: {
          month: string | null
          rental_days: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_vehicle_monthly_revenue: {
        Row: {
          excluded_cents: number | null
          gross_collected_cents: number | null
          month: string | null
          operator_share_cents: number | null
          owner_share_cents: number | null
          rental_revenue_cents: number | null
          unclassified_cents: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "v_vehicle_monthly_available_days"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "rental_transactions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_assign_vehicle: {
        Args: {
          p_agreement_id?: string
          p_effective_from: string
          p_legal_name: string
          p_owner_percent: number
          p_phone?: string
          p_user_id: string
          p_vehicle_id: string
        }
        Returns: string
      }
      admin_list_users: {
        Args: never
        Returns: {
          consigner_id: string | null
          created_at: string
          email: string
          email_confirmed: boolean
          full_name: string | null
          is_admin: boolean
          is_consigner: boolean
          last_sign_in_at: string | null
          providers: string[]
          user_id: string
        }[]
      }
      complete_agreement_signature: {
        Args: {
          p_consent_version: string
          p_ip_address: unknown
          p_signature_artifact_path: string
          p_signature_method: Database["public"]["Enums"]["agreement_signature_method"]
          p_token_hash: string
          p_typed_signature: string
          p_user_agent: string
        }
        Returns: {
          agreement_id: string
          agreement_status: Database["public"]["Enums"]["agreement_status"]
          agreement_version_id: string
          signer_id: string
        }[]
      }
      consigner_owns_vehicle: {
        Args: { p_on?: string; p_vehicle_id: string }
        Returns: boolean
      }
      current_consigner_id: { Args: never; Returns: string }
      generate_agreement_number: {
        Args: { template_code?: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      revise_agreement_version: {
        Args: { p_agreement_id: string; p_created_by: string }
        Returns: {
          agreement_number: string
          completion_email_sent_at: string | null
          consigner_id: string | null
          created_at: string
          created_by: string
          current_version_id: string | null
          executed_at: string | null
          expires_at: string | null
          final_pdf_path: string | null
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          updated_at: string
          voided_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "agreements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_agreement_version: {
        Args: {
          p_agreement_id: string
          p_document_hash: string
          p_rendered_content: Json
          p_sent_by: string
          p_tokens: Json
        }
        Returns: {
          agreement_number: string
          completion_email_sent_at: string | null
          consigner_id: string | null
          created_at: string
          created_by: string
          current_version_id: string | null
          executed_at: string | null
          expires_at: string | null
          final_pdf_path: string | null
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          updated_at: string
          voided_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "agreements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_agreement_draft: {
        Args: {
          p_agreement_data: Json
          p_agreement_id: string
          p_signers: Json
          p_updated_by: string
        }
        Returns: {
          agreement_number: string
          completion_email_sent_at: string | null
          consigner_id: string | null
          created_at: string
          created_by: string
          current_version_id: string | null
          executed_at: string | null
          expires_at: string | null
          final_pdf_path: string | null
          id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["agreement_status"]
          template_id: string
          updated_at: string
          voided_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "agreements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      agreement_signature_method: "drawn" | "typed"
      agreement_signer_status: "pending" | "signed" | "declined"
      agreement_status:
        | "draft"
        | "sent"
        | "partially_signed"
        | "executed"
        | "voided"
        | "expired"
      app_role: "admin" | "consigner" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agreement_signature_method: ["drawn", "typed"],
      agreement_signer_status: ["pending", "signed", "declined"],
      agreement_status: [
        "draft",
        "sent",
        "partially_signed",
        "executed",
        "voided",
        "expired",
      ],
      app_role: ["admin", "consigner", "user"],
    },
  },
} as const
