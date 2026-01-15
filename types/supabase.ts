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
          category: string | null
          content: string | null
          created_at: string
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
          category?: string | null
          content?: string | null
          created_at?: string
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
          category?: string | null
          content?: string | null
          created_at?: string
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
      agro_prices: {
        Row: {
          category: string
          color: string
          details: Json | null
          icon: string
          id: number
          name: string
          price: string
          unit: string
        }
        Insert: {
          category: string
          color: string
          details?: Json | null
          icon: string
          id?: number
          name: string
          price: string
          unit: string
        }
        Update: {
          category?: string
          color?: string
          details?: Json | null
          icon?: string
          id?: number
          name?: string
          price?: string
          unit?: string
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
          title: string
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
          title: string
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
          title?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          created_at: string | null
          id: number
          ip_address: string | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          ip_address?: string | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          ip_address?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string
          end_at: string | null
          id: string
          start_at: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          end_at?: string | null
          id?: string
          start_at?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          end_at?: string | null
          id?: string
          start_at?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      congratulations: {
        Row: {
          category: string
          created_at: string | null
          id: string
          image_url: string | null
          message: string
          photo: string | null
          publish_date: string
          receiver: string | null
          receiver_name: string
          sender: string | null
          sender_name: string | null
          status: string
          theme: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          message: string
          photo?: string | null
          publish_date?: string
          receiver?: string | null
          receiver_name: string
          sender?: string | null
          sender_name?: string | null
          status?: string
          theme?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          message?: string
          photo?: string | null
          publish_date?: string
          receiver?: string | null
          receiver_name?: string
          sender?: string | null
          sender_name?: string | null
          status?: string
          theme?: string
        }
        Relationships: []
      }
      lost_found: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          is_approved: boolean | null
          kind: string
          location: string | null
          resolved: boolean | null
          reward: boolean | null
          reward_note: string | null
          title: string
        }
        Insert: {
          category?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_approved?: boolean | null
          kind: string
          location?: string | null
          resolved?: boolean | null
          reward?: boolean | null
          reward_note?: string | null
          title: string
        }
        Update: {
          category?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          is_approved?: boolean | null
          kind?: string
          location?: string | null
          resolved?: boolean | null
          reward?: boolean | null
          reward_note?: string | null
          title?: string
        }
        Relationships: []
      }
      master_portfolio: {
        Row: {
          created_at: string | null
          id: string
          master_id: string | null
          media_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          master_id?: string | null
          media_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          master_id?: string | null
          media_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_portfolio_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "masters"
            referencedColumns: ["id"]
          },
        ]
      }
      master_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          master_id: string | null
          owner_reply: string | null
          owner_reply_at: string | null
          rater_fingerprint: string | null
          stars: number
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id?: string | null
          owner_reply?: string | null
          owner_reply_at?: string | null
          rater_fingerprint?: string | null
          stars: number
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id?: string | null
          owner_reply?: string | null
          owner_reply_at?: string | null
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
          admin_recommended: boolean | null
          created_at: string | null
          description: string | null
          full_name: string
          id: string
          is_approved: boolean | null
          location: string | null
          phone: string | null
          photo_url: string | null
          price_note: string | null
          profession: string
          rating_avg: number | null
          ratings_count: number | null
          service_area: string | null
          verified: boolean | null
        }
        Insert: {
          admin_recommended?: boolean | null
          created_at?: string | null
          description?: string | null
          full_name: string
          id?: string
          is_approved?: boolean | null
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          price_note?: string | null
          profession: string
          rating_avg?: number | null
          ratings_count?: number | null
          service_area?: string | null
          verified?: boolean | null
        }
        Update: {
          admin_recommended?: boolean | null
          created_at?: string | null
          description?: string | null
          full_name?: string
          id?: string
          is_approved?: boolean | null
          location?: string | null
          phone?: string | null
          photo_url?: string | null
          price_note?: string | null
          profession?: string
          rating_avg?: number | null
          ratings_count?: number | null
          service_area?: string | null
          verified?: boolean | null
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
          image_urls: string[] | null
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
          image_urls?: string[] | null
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
          image_urls?: string[] | null
          is_approved?: boolean | null
          notes?: string | null
        }
        Relationships: []
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string | null
          text: string
        }
        Insert: {
          id?: string
          poll_id?: string | null
          text: string
        }
        Update: {
          id?: string
          poll_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string | null
          poll_id: string | null
          voter_fingerprint: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          voter_fingerprint?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string | null
          poll_id?: string | null
          voter_fingerprint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          id: string
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string | null
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
          created_at: string
          fingerprint: string | null
          id: string
          ip_address: string | null
          media_type: string | null
          media_url: string | null
          message: string | null
          parent_id: string | null
          sender_name: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          parent_id?: string | null
          sender_name?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          parent_id?: string | null
          sender_name?: string | null
        }
        Relationships: []
      }
      transport_routes: {
        Row: {
          created_at: string
          destination: string
          id: number
          origin: string
          price: number
          stops: string | null
        }
        Insert: {
          created_at?: string
          destination: string
          id?: number
          origin: string
          price: number
          stops?: string | null
        }
        Update: {
          created_at?: string
          destination?: string
          id?: number
          origin?: string
          price?: number
          stops?: string | null
        }
        Relationships: []
      }
      transport_schedules: {
        Row: {
          created_at: string
          depart_time: string
          id: number
          route_id: number | null
          status: string | null
        }
        Insert: {
          created_at?: string
          depart_time: string
          id?: number
          route_id?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string
          depart_time?: string
          id?: number
          route_id?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_schedules_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      weather: {
        Row: {
          created_at: string | null
          glow: string | null
          icon: string | null
          id: string
          lat: number
          lon: number
          name: string
          temp: number | null
        }
        Insert: {
          created_at?: string | null
          glow?: string | null
          icon?: string | null
          id?: string
          lat: number
          lon: number
          name: string
          temp?: number | null
        }
        Update: {
          created_at?: string | null
          glow?: string | null
          icon?: string | null
          id?: string
          lat?: number
          lon?: number
          name?: string
          temp?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_chat: { Args: never; Returns: undefined }
      archive_square_messages_if_idle: { Args: never; Returns: undefined }
      delete_old_archived_square_messages: { Args: never; Returns: undefined }
      promote_to_admin: { Args: { user_email: string }; Returns: undefined }
      purge_square_messages: { Args: never; Returns: undefined }
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
