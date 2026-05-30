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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_inquiries: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          end_date: string
          id: string
          message: string | null
          start_date: string
          status: string | null
          vehicle_id: string
          vertical_path: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          end_date: string
          id?: string
          message?: string | null
          start_date: string
          status?: string | null
          vehicle_id: string
          vertical_path?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          end_date?: string
          id?: string
          message?: string | null
          start_date?: string
          status?: string | null
          vehicle_id?: string
          vertical_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_inquiries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_logs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          message: string | null
          metadata: Json
          severity: string
          vertical_path: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
          severity?: string
          vertical_path?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          severity?: string
          vertical_path?: string | null
        }
        Relationships: []
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
      reservations: {
        Row: {
          category_id: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          dropoff_location: string
          end_date: string
          id: string
          payment_status: string
          pickup_location: string
          start_date: string
          status: string
          vehicle_id: string | null
          vertical_path: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          dropoff_location: string
          end_date: string
          id?: string
          payment_status?: string
          pickup_location: string
          start_date: string
          status?: string
          vehicle_id?: string | null
          vertical_path?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          dropoff_location?: string
          end_date?: string
          id?: string
          payment_status?: string
          pickup_location?: string
          start_date?: string
          status?: string
          vehicle_id?: string | null
          vertical_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      vehicle_categories: {
        Row: {
          active: boolean
          bag_capacity: number
          created_at: string
          description: string | null
          hero_image: string | null
          id: string
          name: string
          passenger_capacity: number
          price_per_day: number
          price_per_week: number | null
          slug: string
        }
        Insert: {
          active?: boolean
          bag_capacity?: number
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          name: string
          passenger_capacity?: number
          price_per_day: number
          price_per_week?: number | null
          slug: string
        }
        Update: {
          active?: boolean
          bag_capacity?: number
          created_at?: string
          description?: string | null
          hero_image?: string | null
          id?: string
          name?: string
          passenger_capacity?: number
          price_per_day?: number
          price_per_week?: number | null
          slug?: string
        }
        Relationships: []
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
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category_id: string | null
          color: string
          created_at: string | null
          daily_rate: number
          date_added: string | null
          description: string
          features: string[] | null
          host_type: string | null
          id: string
          initial_mileage: number | null
          license_plate: string | null
          location: string | null
          make: string
          model: string
          rating: number | null
          status: string
          trips: number | null
          vin: string | null
          weekday_rate: number | null
          weekend_rate: number | null
          year: number
        }
        Insert: {
          category_id?: string | null
          color: string
          created_at?: string | null
          daily_rate: number
          date_added?: string | null
          description: string
          features?: string[] | null
          host_type?: string | null
          id?: string
          initial_mileage?: number | null
          license_plate?: string | null
          location?: string | null
          make: string
          model: string
          rating?: number | null
          status?: string
          trips?: number | null
          vin?: string | null
          weekday_rate?: number | null
          weekend_rate?: number | null
          year: number
        }
        Update: {
          category_id?: string | null
          color?: string
          created_at?: string | null
          daily_rate?: number
          date_added?: string | null
          description?: string
          features?: string[] | null
          host_type?: string | null
          id?: string
          initial_mileage?: number | null
          license_plate?: string | null
          location?: string | null
          make?: string
          model?: string
          rating?: number | null
          status?: string
          trips?: number | null
          vin?: string | null
          weekday_rate?: number | null
          weekend_rate?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
