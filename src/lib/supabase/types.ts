export type Database = {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          name: string;
          phone: string;
          avatar_url: string | null;
          avg_service_time: number;
          working_hours: Record<string, { open: string; close: string }>;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          avatar_url?: string | null;
          avg_service_time?: number;
          working_hours?: Record<string, { open: string; close: string }>;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          avatar_url?: string | null;
          avg_service_time?: number;
          working_hours?: Record<string, { open: string; close: string }>;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          duration_minutes: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          duration_minutes: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          duration_minutes?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          shop_id: string;
          service_id: string | null;
          ticket_number: number;
          customer_phone: string | null;
          status: "waiting" | "serving" | "completed" | "cancelled" | "no_show";
          created_at: string;
          called_at: string | null;
          completed_at: string | null;
          notification_sent: boolean;
        };
        Insert: {
          id?: string;
          shop_id: string;
          service_id?: string | null;
          ticket_number: number;
          customer_phone?: string | null;
          status?: "waiting" | "serving" | "completed" | "cancelled" | "no_show";
          created_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
          notification_sent?: boolean;
        };
        Update: {
          id?: string;
          shop_id?: string;
          service_id?: string | null;
          ticket_number?: number;
          customer_phone?: string | null;
          status?: "waiting" | "serving" | "completed" | "cancelled" | "no_show";
          created_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
          notification_sent?: boolean;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          shop_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
