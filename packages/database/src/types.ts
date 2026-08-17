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
type TripServiceType = "ride" | "courier";
type TripStatus =
  | "requested"
  | "accepted"
  | "arrived_pickup"
  | "in_progress"
  | "completed"
  | "cancelled";
type ParcelSize = "small" | "medium" | "large";
type TripPaymentKind = "platform_fee" | "rider_payout";
type TripPayee = "platform" | "rider";

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
      trip_fare_rules: {
        Row: {
          id: string;
          name: string;
          service_type: TripServiceType;
          service_area_code: string | null;
          base_fee: number;
          free_km: number;
          per_km_fee: number;
          small_surcharge: number;
          medium_surcharge: number;
          large_surcharge: number;
          platform_fee_bps: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          service_type: TripServiceType;
          service_area_code?: string | null;
          base_fee?: number;
          free_km?: number;
          per_km_fee?: number;
          small_surcharge?: number;
          medium_surcharge?: number;
          large_surcharge?: number;
          platform_fee_bps?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          service_type?: TripServiceType;
          service_area_code?: string | null;
          base_fee?: number;
          free_km?: number;
          per_km_fee?: number;
          small_surcharge?: number;
          medium_surcharge?: number;
          large_surcharge?: number;
          platform_fee_bps?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          trip_number: string;
          customer_id: string;
          rider_id: string | null;
          service_type: TripServiceType;
          service_area_code: string;
          status: TripStatus;
          pickup_label: string;
          pickup_line1: string;
          pickup_barangay: string;
          pickup_city: string;
          pickup_lat: number;
          pickup_lng: number;
          dropoff_label: string;
          dropoff_line1: string;
          dropoff_barangay: string;
          dropoff_city: string;
          dropoff_lat: number;
          dropoff_lng: number;
          distance_km: number;
          payment_method: PaymentMethod;
          fare: number;
          platform_fee: number;
          rider_earning: number;
          size_surcharge: number;
          parcel_size: ParcelSize | null;
          parcel_description: string | null;
          recipient_name: string | null;
          recipient_phone: string | null;
          parcel_photo_path: string | null;
          notes: string | null;
          cancel_reason: string | null;
          accepted_at: string | null;
          arrived_pickup_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_number: string;
          customer_id: string;
          rider_id?: string | null;
          service_type: TripServiceType;
          service_area_code: string;
          status?: TripStatus;
          pickup_label: string;
          pickup_line1: string;
          pickup_barangay: string;
          pickup_city: string;
          pickup_lat: number;
          pickup_lng: number;
          dropoff_label: string;
          dropoff_line1: string;
          dropoff_barangay: string;
          dropoff_city: string;
          dropoff_lat: number;
          dropoff_lng: number;
          distance_km?: number;
          payment_method?: PaymentMethod;
          fare: number;
          platform_fee: number;
          rider_earning: number;
          size_surcharge?: number;
          parcel_size?: ParcelSize | null;
          parcel_description?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          parcel_photo_path?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          accepted_at?: string | null;
          arrived_pickup_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_number?: string;
          customer_id?: string;
          rider_id?: string | null;
          service_type?: TripServiceType;
          service_area_code?: string;
          status?: TripStatus;
          pickup_label?: string;
          pickup_line1?: string;
          pickup_barangay?: string;
          pickup_city?: string;
          pickup_lat?: number;
          pickup_lng?: number;
          dropoff_label?: string;
          dropoff_line1?: string;
          dropoff_barangay?: string;
          dropoff_city?: string;
          dropoff_lat?: number;
          dropoff_lng?: number;
          distance_km?: number;
          payment_method?: PaymentMethod;
          fare?: number;
          platform_fee?: number;
          rider_earning?: number;
          size_surcharge?: number;
          parcel_size?: ParcelSize | null;
          parcel_description?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          parcel_photo_path?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          accepted_at?: string | null;
          arrived_pickup_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_events: {
        Row: {
          id: string;
          trip_id: string;
          actor_id: string | null;
          from_status: TripStatus | null;
          to_status: TripStatus;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          actor_id?: string | null;
          from_status?: TripStatus | null;
          to_status: TripStatus;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          actor_id?: string | null;
          from_status?: TripStatus | null;
          to_status?: TripStatus;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      trip_payments: {
        Row: {
          id: string;
          trip_id: string;
          kind: TripPaymentKind;
          amount: number;
          method: PaymentMethod;
          status: PaymentStatus;
          payee: TripPayee;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          kind: TripPaymentKind;
          amount: number;
          method: PaymentMethod;
          status?: PaymentStatus;
          payee: TripPayee;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          kind?: TripPaymentKind;
          amount?: number;
          method?: PaymentMethod;
          status?: PaymentStatus;
          payee?: TripPayee;
          created_at?: string;
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
      quote_trip: {
        Args: {
          p_service_type: TripServiceType;
          p_service_area_code: string;
          p_pickup_lat: number;
          p_pickup_lng: number;
          p_dropoff_lat: number;
          p_dropoff_lng: number;
          p_parcel_size?: ParcelSize | null;
        };
        Returns: Json;
      };
      request_trip: {
        Args: {
          p_service_type: TripServiceType;
          p_service_area_code: string;
          p_pickup_label: string;
          p_pickup_line1: string;
          p_pickup_barangay: string;
          p_pickup_city: string;
          p_pickup_lat: number;
          p_pickup_lng: number;
          p_dropoff_label: string;
          p_dropoff_line1: string;
          p_dropoff_barangay: string;
          p_dropoff_city: string;
          p_dropoff_lat: number;
          p_dropoff_lng: number;
          p_payment_method: PaymentMethod;
          p_parcel_size?: ParcelSize | null;
          p_parcel_description?: string | null;
          p_recipient_name?: string | null;
          p_recipient_phone?: string | null;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["trips"]["Row"];
      };
      accept_trip: {
        Args: { p_trip_id: string };
        Returns: Database["public"]["Tables"]["trips"]["Row"];
      };
      advance_trip: {
        Args: { p_trip_id: string; p_to_status: TripStatus };
        Returns: Database["public"]["Tables"]["trips"]["Row"];
      };
      cancel_trip: {
        Args: { p_trip_id: string; p_reason?: string | null };
        Returns: Database["public"]["Tables"]["trips"]["Row"];
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
      trip_service_type: TripServiceType;
      trip_status: TripStatus;
      parcel_size: ParcelSize;
      trip_payment_kind: TripPaymentKind;
      trip_payee: TripPayee;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
