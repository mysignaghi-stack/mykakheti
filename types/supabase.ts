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
      congratulations: {
        Row: {
          all_images: string[] | null
          animation_enabled: boolean | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          message: string
          music_url: string | null
          occasion: string
          recipient_name: string
          sender_name: string
          template: string | null
          toast: string | null
        }
        Insert: {
          all_images?: string[] | null
          animation_enabled?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          message: string
          music_url?: string | null
          occasion: string
          recipient_name: string
          sender_name: string
          template?: string | null
          toast?: string | null
        }
        Update: {
          all_images?: string[] | null
          animation_enabled?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          message?: string
          music_url?: string | null
          occasion?: string
          recipient_name?: string
          sender_name?: string
          template?: string | null
          toast?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_read: boolean | null
          message: string | null
          name: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          name?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          name?: string | null
          subject?: string | null
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
      lost_found: {
        Row: {
          contact: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          kind: string
          location: string | null
          reward: boolean | null
          reward_note: string | null
          title: string
        }
        Insert: {
          contact?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          kind: string
          location?: string | null
          reward?: boolean | null
          reward_note?: string | null
          title: string
        }
        Update: {
          contact?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          kind?: string
          location?: string | null
          reward?: boolean | null
          reward_note?: string | null
          title?: string
        }
        Relationships: []
      }
      master_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          master_id: string | null
          rater_fingerprint: string | null
          stars: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id?: string | null
          rater_fingerprint?: string | null
          stars: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id?: string | null
          rater_fingerprint?: string | null
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "master_ratings_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      masters: {
        Row: {
          created_at: string | null
          description: string | null
          full_name: string
          id: string
          is_approved: boolean | null
          location: string | null
          phone: string | null
          profession: string
          rating_avg: number | null
          ratings_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          full_name: string
          id?: string
          is_approved?: boolean | null
          location?: string | null
          phone?: string | null
          profession: string
          rating_avg?: number | null
          ratings_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          full_name?: string
          id?: string
          is_approved?: boolean | null
          location?: string | null
          phone?: string | null
          profession?: string
          rating_avg?: number | null
          ratings_count?: number | null
        }
        Relationships: []
      }
      obituaries: {
        Row: {
          contacts: string | null
          created_at: string | null
          date_of_death: string | null
          full_name: string
          funeral_at: string | null
          funeral_place: string | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          notes: string | null
        }
        Insert: {
          contacts?: string | null
          created_at?: string | null
          date_of_death?: string | null
          full_name: string
          funeral_at?: string | null
          funeral_place?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          notes?: string | null
        }
        Update: {
          contacts?: string | null
          created_at?: string | null
          date_of_death?: string | null
          full_name?: string
          funeral_at?: string | null
          funeral_place?: string | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          notes?: string | null
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
      agro_prices: {
        Row: {
          id: string;
          name: string | null;
          unit: string | null;
          price: number | null;
          color: string | null;
          icon: string | null;
          category: string | null;
          details: string[] | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          unit?: string | null;
          price?: number | null;
          color?: string | null;
          icon?: string | null;
          category?: string | null;
          details?: string[] | null;
          created_at?: string | null;
        };
        Update: {
          name?: string | null;
          unit?: string | null;
          price?: number | null;
          color?: string | null;
          icon?: string | null;
          category?: string | null;
          details?: string[] | null;
          created_at?: string | null;
        };
        Relationships: [];
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
