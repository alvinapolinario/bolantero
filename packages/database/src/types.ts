export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type UserRole = "customer" | "merchant" | "rider" | "admin";
type VerificationStatus = "draft" | "pending" | "approved" | "rejected";
type MerchantStatus = "draft" | "pending" | "approved" | "suspended";
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "rejected"
  | "cancelled"
  | "completed";
type DeliveryStatus =
  | "awaiting_rider"
  | "assigned"
  | "arrived_store"
  | "picked_up"
  | "delivered"
  | "cancelled";
type DeliveryType =
  | "immediate"
  | "scheduled"
  | "express"
  | "multi_stop"
  | "bulk"
  | "corporate"
  | "p2p";
type PaymentMethod = "cod" | "online";
type PaymentKind = "product" | "delivery" | "cod_fee";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          verification_level: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          verification_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          verification_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_areas: {
        Row: {
          code: string;
          name: string;
          center_lat: number;
          center_lng: number;
          radius_km: number;
          is_active: boolean;
        };
        Insert: {
          code: string;
          name: string;
          center_lat: number;
          center_lng: number;
          radius_km?: number;
          is_active?: boolean;
        };
        Update: {
          code?: string;
          name?: string;
          center_lat?: number;
          center_lng?: number;
          radius_km?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          line1: string;
          barangay: string;
          city: string;
          service_area_code: string;
          lat: number;
          lng: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          line1: string;
          barangay: string;
          city: string;
          service_area_code: string;
          lat: number;
          lng: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          line1?: string;
          barangay?: string;
          city?: string;
          service_area_code?: string;
          lat?: number;
          lng?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      verification_submissions: {
        Row: {
          id: string;
          user_id: string;
          target_level: number;
          id_type: string | null;
          id_number: string | null;
          id_image_path: string | null;
          selfie_path: string | null;
          license_image_path: string | null;
          vehicle_doc_path: string | null;
          status: VerificationStatus;
          reviewer_id: string | null;
          reviewer_notes: string | null;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_level: number;
          id_type?: string | null;
          id_number?: string | null;
          id_image_path?: string | null;
          selfie_path?: string | null;
          license_image_path?: string | null;
          vehicle_doc_path?: string | null;
          status?: VerificationStatus;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_level?: number;
          id_type?: string | null;
          id_number?: string | null;
          id_image_path?: string | null;
          selfie_path?: string | null;
          license_image_path?: string | null;
          vehicle_doc_path?: string | null;
          status?: VerificationStatus;
          reviewer_id?: string | null;
          reviewer_notes?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      merchants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          category_slug: string;
          service_area_code: string;
          address_line: string;
          lat: number;
          lng: number;
          phone: string | null;
          cover_image_url: string | null;
          status: MerchantStatus;
          opens_at: string | null;
          closes_at: string | null;
          is_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          category_slug: string;
          service_area_code: string;
          address_line: string;
          lat: number;
          lng: number;
          phone?: string | null;
          cover_image_url?: string | null;
          status?: MerchantStatus;
          opens_at?: string | null;
          closes_at?: string | null;
          is_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          category_slug?: string;
          service_area_code?: string;
          address_line?: string;
          lat?: number;
          lng?: number;
          phone?: string | null;
          cover_image_url?: string | null;
          status?: MerchantStatus;
          opens_at?: string | null;
          closes_at?: string | null;
          is_open?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      merchant_documents: {
        Row: {
          id: string;
          merchant_id: string;
          doc_type: string;
          file_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          doc_type: string;
          file_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          doc_type?: string;
          file_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          slug: string;
          name: string;
          phase: number;
          is_active: boolean;
        };
        Insert: {
          slug: string;
          name: string;
          phase?: number;
          is_active?: boolean;
        };
        Update: {
          slug?: string;
          name?: string;
          phase?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          merchant_id: string;
          category_slug: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          category_slug: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          category_slug?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_fee_rules: {
        Row: {
          id: string;
          name: string;
          service_area_code: string | null;
          base_fee: number;
          free_km: number;
          per_km_fee: number;
          express_multiplier: number;
          scheduled_surcharge: number;
          cod_handling_fee: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          service_area_code?: string | null;
          base_fee?: number;
          free_km?: number;
          per_km_fee?: number;
          express_multiplier?: number;
          scheduled_surcharge?: number;
          cod_handling_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          service_area_code?: string | null;
          base_fee?: number;
          free_km?: number;
          per_km_fee?: number;
          express_multiplier?: number;
          scheduled_surcharge?: number;
          cod_handling_fee?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          merchant_id: string;
          address_id: string;
          status: OrderStatus;
          delivery_type: DeliveryType;
          payment_method: PaymentMethod;
          scheduled_for: string | null;
          subtotal: number;
          delivery_fee: number;
          cod_fee: number;
          total: number;
          distance_km: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          merchant_id: string;
          address_id: string;
          status?: OrderStatus;
          delivery_type?: DeliveryType;
          payment_method?: PaymentMethod;
          scheduled_for?: string | null;
          subtotal: number;
          delivery_fee: number;
          cod_fee?: number;
          distance_km?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          merchant_id?: string;
          address_id?: string;
          status?: OrderStatus;
          delivery_type?: DeliveryType;
          payment_method?: PaymentMethod;
          scheduled_for?: string | null;
          subtotal?: number;
          delivery_fee?: number;
          cod_fee?: number;
          distance_km?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          name: string;
          unit_price: number;
          quantity: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          name: string;
          unit_price: number;
          quantity: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          name?: string;
          unit_price?: number;
          quantity?: number;
        };
        Relationships: [];
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          rider_id: string | null;
          status: DeliveryStatus;
          pickup_lat: number | null;
          pickup_lng: number | null;
          dropoff_lat: number | null;
          dropoff_lng: number | null;
          proof_image_path: string | null;
          assigned_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          rider_earning: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          rider_id?: string | null;
          status?: DeliveryStatus;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          proof_image_path?: string | null;
          assigned_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          rider_earning?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          rider_id?: string | null;
          status?: DeliveryStatus;
          pickup_lat?: number | null;
          pickup_lng?: number | null;
          dropoff_lat?: number | null;
          dropoff_lng?: number | null;
          proof_image_path?: string | null;
          assigned_at?: string | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          rider_earning?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          kind: PaymentKind;
          amount: number;
          method: PaymentMethod;
          status: PaymentStatus;
          payee: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          kind: PaymentKind;
          amount: number;
          method: PaymentMethod;
          status?: PaymentStatus;
          payee: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          kind?: PaymentKind;
          amount?: number;
          method?: PaymentMethod;
          status?: PaymentStatus;
          payee?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          order_id: string;
          rater_id: string;
          ratee_id: string;
          target: string;
          score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          rater_id: string;
          ratee_id: string;
          target: string;
          score: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          rater_id?: string;
          ratee_id?: string;
          target?: string;
          score?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rider_presence: {
        Row: {
          rider_id: string;
          is_online: boolean;
          last_lat: number | null;
          last_lng: number | null;
          updated_at: string;
        };
        Insert: {
          rider_id: string;
          is_online?: boolean;
          last_lat?: number | null;
          last_lng?: number | null;
          updated_at?: string;
        };
        Update: {
          rider_id?: string;
          is_online?: boolean;
          last_lat?: number | null;
          last_lng?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      place_order: {
        Args: {
          p_merchant_id: string;
          p_address_id: string;
          p_delivery_type: DeliveryType;
          p_payment_method: PaymentMethod;
          p_items: Json;
          p_notes?: string | null;
          p_scheduled_for?: string | null;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      accept_delivery: {
        Args: { p_delivery_id: string };
        Returns: Database["public"]["Tables"]["deliveries"]["Row"];
      };
      review_verification: {
        Args: {
          submission_id: string;
          approve: boolean;
          notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["verification_submissions"]["Row"];
      };
    };
    Enums: {
      user_role: UserRole;
      verification_status: VerificationStatus;
      merchant_status: MerchantStatus;
      order_status: OrderStatus;
      delivery_status: DeliveryStatus;
      delivery_type: DeliveryType;
      payment_method: PaymentMethod;
      payment_kind: PaymentKind;
      payment_status: PaymentStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
