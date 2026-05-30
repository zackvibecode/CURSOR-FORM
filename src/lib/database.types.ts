export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      forms: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string;
          whatsapp_number: string;
          cta_text: string;
          description: string | null;
          status: "draft" | "published";
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          slug: string;
          whatsapp_number?: string;
          cta_text?: string;
          description?: string | null;
          status?: "draft" | "published";
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          slug?: string;
          whatsapp_number?: string;
          cta_text?: string;
          description?: string | null;
          status?: "draft" | "published";
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      form_fields: {
        Row: {
          id: string;
          form_id: string;
          type: string;
          label: string;
          placeholder: string | null;
          required: boolean;
          options: Json;
          order_index: number;
          settings: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          type: string;
          label: string;
          placeholder?: string | null;
          required?: boolean;
          options?: Json;
          order_index?: number;
          settings?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          type?: string;
          label?: string;
          placeholder?: string | null;
          required?: boolean;
          options?: Json;
          order_index?: number;
          settings?: Json;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          form_id: string;
          data: Json;
          submitted_at: string;
          ip_hash: string | null;
          assigned_name: string | null;
          assigned_phone: string | null;
        };
        Insert: {
          id?: string;
          form_id: string;
          data?: Json;
          submitted_at?: string;
          ip_hash?: string | null;
          assigned_name?: string | null;
          assigned_phone?: string | null;
        };
        Update: {
          id?: string;
          form_id?: string;
          data?: Json;
          submitted_at?: string;
          ip_hash?: string | null;
          assigned_name?: string | null;
          assigned_phone?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro" | "business";
          status: "active" | "pending" | "expired" | "cancelled";
          billing_cycle: "monthly" | "yearly" | null;
          started_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "free" | "pro" | "business";
          status?: "active" | "pending" | "expired" | "cancelled";
          billing_cycle?: "monthly" | "yearly" | null;
          started_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "free" | "pro" | "business";
          status?: "active" | "pending" | "expired" | "cancelled";
          billing_cycle?: "monthly" | "yearly" | null;
          started_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DbForm = Database["public"]["Tables"]["forms"]["Row"];
export type DbFormField = Database["public"]["Tables"]["form_fields"]["Row"];
export type DbSubmission = Database["public"]["Tables"]["submissions"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
