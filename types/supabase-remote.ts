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
      admin_posts: {
        Row: {
          badge_text: string | null
          category: string | null
          content: string | null
          created_at: string | null
          id: number
          link: string | null
          media_type: string | null
          media_url: string | null
          media_urls: string[] | null
          position: string | null
          priority: number | null
          title: string
          video_background: boolean | null
        }
        Insert: {
          badge_text?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          link?: string | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          position?: string | null
          priority?: number | null
          title: string
          video_background?: boolean | null
        }
        Update: {
          badge_text?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: number
          link?: string | null
          media_type?: string | null
          media_url?: string | null
          media_urls?: string[] | null
          position?: string | null
          priority?: number | null
          title?: string
          video_background?: boolean | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          all_images: string[] | null
          category: string
          contact_info: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_archived: boolean | null
          location: string
          phone: string | null
          price: string
          publish_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          all_images?: string[] | null
          category: string
          contact_info?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_archived?: boolean | null
          location: string
          phone?: string | null
          price: string
          publish_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          all_images?: string[] | null
          category?: string
          contact_info?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_archived?: boolean | null
          location?: string
          phone?: string | null
          price?: string
          publish_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kakheti_heritage: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          fun_fact: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          location_name: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          fun_fact?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location_name?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          fun_fact?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location_name?: string | null
          title?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      square_messages: {
        Row: {
          archived_at: string | null
          created_at: string | null
          fingerprint: string | null
          id: string
          ip_address: unknown
          media_type: string | null
          media_url: string | null
          message: string | null
          parent_id: string | null
          sender_name: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          ip_address?: unknown
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          parent_id?: string | null
          sender_name?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          ip_address?: unknown
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          parent_id?: string | null
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "square_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "square_messages"
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
