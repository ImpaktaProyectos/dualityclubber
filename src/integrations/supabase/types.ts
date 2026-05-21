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
      artists: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instagram_url: string | null
          is_featured: boolean
          is_visible: boolean
          music_url: string | null
          name: string
          performance_time: string | null
          sort_order: number
          stage: string | null
          stage_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          music_url?: string | null
          name: string
          performance_time?: string | null
          sort_order?: number
          stage?: string | null
          stage_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          music_url?: string | null
          name?: string
          performance_time?: string | null
          sort_order?: number
          stage?: string | null
          stage_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_routes: {
        Row: {
          booking_url: string | null
          created_at: string
          departure_point: string | null
          departure_time: string | null
          id: string
          is_visible: boolean
          price: string | null
          return_time: string | null
          sort_order: number
          status: string
          town: string
          updated_at: string
        }
        Insert: {
          booking_url?: string | null
          created_at?: string
          departure_point?: string | null
          departure_time?: string | null
          id?: string
          is_visible?: boolean
          price?: string | null
          return_time?: string | null
          sort_order?: number
          status?: string
          town: string
          updated_at?: string
        }
        Update: {
          booking_url?: string | null
          created_at?: string
          departure_point?: string | null
          departure_time?: string | null
          id?: string
          is_visible?: boolean
          price?: string | null
          return_time?: string | null
          sort_order?: number
          status?: string
          town?: string
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_visible: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          created_at: string
          id: string
          is_featured: boolean
          is_visible: boolean
          media_type: string
          media_url: string
          sort_order: number
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          media_type?: string
          media_url: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_featured?: boolean
          is_visible?: boolean
          media_type?: string
          media_url?: string
          sort_order?: number
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          admin_status: string
          display_mode: string
          id: string
          is_enabled: boolean
          is_locked: boolean
          section_key: string
          section_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          admin_status?: string
          display_mode?: string
          id?: string
          is_enabled?: boolean
          is_locked?: boolean
          section_key: string
          section_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          admin_status?: string
          display_mode?: string
          id?: string
          is_enabled?: boolean
          is_locked?: boolean
          section_key?: string
          section_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      quick_info_items: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_visible: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_visible?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      schedule_items: {
        Row: {
          artist_id: string | null
          created_at: string
          custom_artist_name: string | null
          description: string | null
          end_time: string | null
          id: string
          is_visible: boolean
          sort_order: number
          stage: string
          stage_id: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          custom_artist_name?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_visible?: boolean
          sort_order?: number
          stage: string
          stage_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          custom_artist_name?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_visible?: boolean
          sort_order?: number
          stage?: string
          stage_id?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      section_backgrounds: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          background_position: string | null
          background_scroll_behavior: string | null
          background_scroll_intensity: number | null
          background_secondary_color: string | null
          background_size: string | null
          background_type: string | null
          background_video_url: string | null
          blur_amount: number | null
          glow_intensity: string | null
          id: string
          image_opacity: number | null
          motion_enabled: boolean | null
          motion_speed: string | null
          motion_type: string | null
          overlay_color: string | null
          overlay_opacity: number | null
          readability_mode: string | null
          section_key: string
          texture_opacity: number | null
          texture_type: string | null
          updated_at: string
          use_global_background: boolean
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          background_position?: string | null
          background_scroll_behavior?: string | null
          background_scroll_intensity?: number | null
          background_secondary_color?: string | null
          background_size?: string | null
          background_type?: string | null
          background_video_url?: string | null
          blur_amount?: number | null
          glow_intensity?: string | null
          id?: string
          image_opacity?: number | null
          motion_enabled?: boolean | null
          motion_speed?: string | null
          motion_type?: string | null
          overlay_color?: string | null
          overlay_opacity?: number | null
          readability_mode?: string | null
          section_key: string
          texture_opacity?: number | null
          texture_type?: string | null
          updated_at?: string
          use_global_background?: boolean
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          background_position?: string | null
          background_scroll_behavior?: string | null
          background_scroll_intensity?: number | null
          background_secondary_color?: string | null
          background_size?: string | null
          background_type?: string | null
          background_video_url?: string | null
          blur_amount?: number | null
          glow_intensity?: string | null
          id?: string
          image_opacity?: number | null
          motion_enabled?: boolean | null
          motion_speed?: string | null
          motion_type?: string | null
          overlay_color?: string | null
          overlay_opacity?: number | null
          readability_mode?: string | null
          section_key?: string
          texture_opacity?: number | null
          texture_type?: string | null
          updated_at?: string
          use_global_background?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          appearance_glow_intensity: number | null
          appearance_particles: boolean | null
          appearance_preset: string | null
          appearance_texture: boolean | null
          authorization_button_text: string | null
          authorization_description: string | null
          authorization_pdf_url: string | null
          authorization_title: string | null
          background_color: string | null
          brand_favicon_url: string | null
          brand_icon_url: string | null
          brand_logo_dark_url: string | null
          brand_logo_light_url: string | null
          brand_logo_main_url: string | null
          countdown_cta_text: string | null
          countdown_cta_url: string | null
          countdown_datetime: string | null
          countdown_enabled: boolean | null
          countdown_subtext: string | null
          countdown_subtitle: string | null
          countdown_title: string | null
          current_event_key: string
          event_date: string | null
          event_name: string
          event_subtitle: string | null
          final_cta_background_url: string | null
          final_cta_button_text: string | null
          final_cta_button_url: string | null
          final_cta_text: string | null
          final_cta_title: string | null
          font_body: string | null
          font_button: string | null
          font_display: string | null
          footer_cookies_url: string | null
          footer_copyright: string | null
          footer_email: string | null
          footer_facebook_url: string | null
          footer_instagram_url: string | null
          footer_legal_url: string | null
          footer_logo_url: string | null
          footer_privacy_url: string | null
          footer_soundcloud_url: string | null
          footer_spotify_url: string | null
          footer_telegram_url: string | null
          footer_tiktok_url: string | null
          footer_twitter_url: string | null
          footer_whatsapp_url: string | null
          footer_x_url: string | null
          footer_youtube_url: string | null
          glow_color: string | null
          header_logo_height: number | null
          header_logo_url: string | null
          hero_cta_primary_text: string | null
          hero_cta_primary_url: string | null
          hero_cta_secondary_text: string | null
          hero_cta_secondary_url: string | null
          hero_flyer_enabled: boolean | null
          hero_flyer_url: string | null
          hero_image_desktop_url: string | null
          hero_image_mobile_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          hero_video_desktop_url: string | null
          hero_video_mobile_url: string | null
          id: string
          is_singleton: boolean
          location_access_text: string | null
          location_address: string | null
          location_button_text: string | null
          location_city: string | null
          location_embed_url: string | null
          location_maps_url: string | null
          location_name: string | null
          location_parking_text: string | null
          opening_time: string | null
          primary_color: string | null
          secondary_color: string | null
          ticket_embed_script: string | null
          ticket_fallback_url: string | null
          ticket_iframe_url: string | null
          ticket_mode: string
          ticket_show_fallback: boolean | null
          ticket_status: string | null
          ticket_text: string | null
          ticket_title: string | null
          ticket_trust_text: string | null
          updated_at: string
          venue_location: string | null
          venue_name: string | null
        }
        Insert: {
          appearance_glow_intensity?: number | null
          appearance_particles?: boolean | null
          appearance_preset?: string | null
          appearance_texture?: boolean | null
          authorization_button_text?: string | null
          authorization_description?: string | null
          authorization_pdf_url?: string | null
          authorization_title?: string | null
          background_color?: string | null
          brand_favicon_url?: string | null
          brand_icon_url?: string | null
          brand_logo_dark_url?: string | null
          brand_logo_light_url?: string | null
          brand_logo_main_url?: string | null
          countdown_cta_text?: string | null
          countdown_cta_url?: string | null
          countdown_datetime?: string | null
          countdown_enabled?: boolean | null
          countdown_subtext?: string | null
          countdown_subtitle?: string | null
          countdown_title?: string | null
          current_event_key?: string
          event_date?: string | null
          event_name?: string
          event_subtitle?: string | null
          final_cta_background_url?: string | null
          final_cta_button_text?: string | null
          final_cta_button_url?: string | null
          final_cta_text?: string | null
          final_cta_title?: string | null
          font_body?: string | null
          font_button?: string | null
          font_display?: string | null
          footer_cookies_url?: string | null
          footer_copyright?: string | null
          footer_email?: string | null
          footer_facebook_url?: string | null
          footer_instagram_url?: string | null
          footer_legal_url?: string | null
          footer_logo_url?: string | null
          footer_privacy_url?: string | null
          footer_soundcloud_url?: string | null
          footer_spotify_url?: string | null
          footer_telegram_url?: string | null
          footer_tiktok_url?: string | null
          footer_twitter_url?: string | null
          footer_whatsapp_url?: string | null
          footer_x_url?: string | null
          footer_youtube_url?: string | null
          glow_color?: string | null
          header_logo_height?: number | null
          header_logo_url?: string | null
          hero_cta_primary_text?: string | null
          hero_cta_primary_url?: string | null
          hero_cta_secondary_text?: string | null
          hero_cta_secondary_url?: string | null
          hero_flyer_enabled?: boolean | null
          hero_flyer_url?: string | null
          hero_image_desktop_url?: string | null
          hero_image_mobile_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_video_desktop_url?: string | null
          hero_video_mobile_url?: string | null
          id?: string
          is_singleton?: boolean
          location_access_text?: string | null
          location_address?: string | null
          location_button_text?: string | null
          location_city?: string | null
          location_embed_url?: string | null
          location_maps_url?: string | null
          location_name?: string | null
          location_parking_text?: string | null
          opening_time?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          ticket_embed_script?: string | null
          ticket_fallback_url?: string | null
          ticket_iframe_url?: string | null
          ticket_mode?: string
          ticket_show_fallback?: boolean | null
          ticket_status?: string | null
          ticket_text?: string | null
          ticket_title?: string | null
          ticket_trust_text?: string | null
          updated_at?: string
          venue_location?: string | null
          venue_name?: string | null
        }
        Update: {
          appearance_glow_intensity?: number | null
          appearance_particles?: boolean | null
          appearance_preset?: string | null
          appearance_texture?: boolean | null
          authorization_button_text?: string | null
          authorization_description?: string | null
          authorization_pdf_url?: string | null
          authorization_title?: string | null
          background_color?: string | null
          brand_favicon_url?: string | null
          brand_icon_url?: string | null
          brand_logo_dark_url?: string | null
          brand_logo_light_url?: string | null
          brand_logo_main_url?: string | null
          countdown_cta_text?: string | null
          countdown_cta_url?: string | null
          countdown_datetime?: string | null
          countdown_enabled?: boolean | null
          countdown_subtext?: string | null
          countdown_subtitle?: string | null
          countdown_title?: string | null
          current_event_key?: string
          event_date?: string | null
          event_name?: string
          event_subtitle?: string | null
          final_cta_background_url?: string | null
          final_cta_button_text?: string | null
          final_cta_button_url?: string | null
          final_cta_text?: string | null
          final_cta_title?: string | null
          font_body?: string | null
          font_button?: string | null
          font_display?: string | null
          footer_cookies_url?: string | null
          footer_copyright?: string | null
          footer_email?: string | null
          footer_facebook_url?: string | null
          footer_instagram_url?: string | null
          footer_legal_url?: string | null
          footer_logo_url?: string | null
          footer_privacy_url?: string | null
          footer_soundcloud_url?: string | null
          footer_spotify_url?: string | null
          footer_telegram_url?: string | null
          footer_tiktok_url?: string | null
          footer_twitter_url?: string | null
          footer_whatsapp_url?: string | null
          footer_x_url?: string | null
          footer_youtube_url?: string | null
          glow_color?: string | null
          header_logo_height?: number | null
          header_logo_url?: string | null
          hero_cta_primary_text?: string | null
          hero_cta_primary_url?: string | null
          hero_cta_secondary_text?: string | null
          hero_cta_secondary_url?: string | null
          hero_flyer_enabled?: boolean | null
          hero_flyer_url?: string | null
          hero_image_desktop_url?: string | null
          hero_image_mobile_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_video_desktop_url?: string | null
          hero_video_mobile_url?: string | null
          id?: string
          is_singleton?: boolean
          location_access_text?: string | null
          location_address?: string | null
          location_button_text?: string | null
          location_city?: string | null
          location_embed_url?: string | null
          location_maps_url?: string | null
          location_name?: string | null
          location_parking_text?: string | null
          opening_time?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          ticket_embed_script?: string | null
          ticket_fallback_url?: string | null
          ticket_iframe_url?: string | null
          ticket_mode?: string
          ticket_show_fallback?: boolean | null
          ticket_status?: string | null
          ticket_text?: string | null
          ticket_title?: string | null
          ticket_trust_text?: string | null
          updated_at?: string
          venue_location?: string | null
          venue_name?: string | null
        }
        Relationships: []
      }
      stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_visible: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visual_settings: {
        Row: {
          atmosphere_preset: string | null
          background_color: string | null
          background_fixed: boolean | null
          background_image_url: string | null
          background_position: string | null
          background_repeat: boolean | null
          background_scroll_behavior: string
          background_scroll_intensity: number
          background_scroll_mode: string
          background_secondary_color: string | null
          background_size: string | null
          background_type: string
          background_video_url: string | null
          blur_amount: number | null
          contrast: number | null
          glow_intensity: string | null
          id: string
          image_opacity: number | null
          is_singleton: boolean
          motion_enabled: boolean | null
          motion_speed: string | null
          motion_type: string | null
          overlay_color: string | null
          overlay_opacity: number | null
          readability_mode: string | null
          saturation: number | null
          texture_opacity: number | null
          texture_type: string | null
          updated_at: string
        }
        Insert: {
          atmosphere_preset?: string | null
          background_color?: string | null
          background_fixed?: boolean | null
          background_image_url?: string | null
          background_position?: string | null
          background_repeat?: boolean | null
          background_scroll_behavior?: string
          background_scroll_intensity?: number
          background_scroll_mode?: string
          background_secondary_color?: string | null
          background_size?: string | null
          background_type?: string
          background_video_url?: string | null
          blur_amount?: number | null
          contrast?: number | null
          glow_intensity?: string | null
          id?: string
          image_opacity?: number | null
          is_singleton?: boolean
          motion_enabled?: boolean | null
          motion_speed?: string | null
          motion_type?: string | null
          overlay_color?: string | null
          overlay_opacity?: number | null
          readability_mode?: string | null
          saturation?: number | null
          texture_opacity?: number | null
          texture_type?: string | null
          updated_at?: string
        }
        Update: {
          atmosphere_preset?: string | null
          background_color?: string | null
          background_fixed?: boolean | null
          background_image_url?: string | null
          background_position?: string | null
          background_repeat?: boolean | null
          background_scroll_behavior?: string
          background_scroll_intensity?: number
          background_scroll_mode?: string
          background_secondary_color?: string | null
          background_size?: string | null
          background_type?: string
          background_video_url?: string | null
          blur_amount?: number | null
          contrast?: number | null
          glow_intensity?: string | null
          id?: string
          image_opacity?: number | null
          is_singleton?: boolean
          motion_enabled?: boolean | null
          motion_speed?: string | null
          motion_type?: string | null
          overlay_color?: string | null
          overlay_opacity?: number | null
          readability_mode?: string | null
          saturation?: number | null
          texture_opacity?: number | null
          texture_type?: string | null
          updated_at?: string
        }
        Relationships: []
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
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
