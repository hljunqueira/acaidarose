export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          nif: string | null
          address: string | null
          phone: string | null
          mbway_phone: string | null
          currency: string
          is_headquarters: boolean
          active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          nif?: string | null
          address?: string | null
          phone?: string | null
          mbway_phone?: string | null
          currency?: string
          is_headquarters?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          nif?: string | null
          address?: string | null
          phone?: string | null
          mbway_phone?: string | null
          currency?: string
          is_headquarters?: boolean
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string | null
          email: string
          name: string
          password_hash: string
          role: string
          active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          email: string
          name: string
          password_hash: string
          role?: string
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          email?: string
          name?: string
          password_hash?: string
          role?: string
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      product_containers: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          preco_base: number
          limite_bases: number
          limite_complementos_gratis: number
          emoji: string
          image_url: string | null
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          preco_base?: number
          limite_bases?: number
          limite_complementos_gratis?: number
          emoji?: string
          image_url?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          preco_base?: number
          limite_bases?: number
          limite_complementos_gratis?: number
          emoji?: string
          image_url?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      product_bases: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          description: string | null
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          description?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          description?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      product_toppings: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          category: string
          is_premium: boolean
          preco_extra: number
          emoji: string
          display_order: number
          active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          category?: string
          is_premium?: boolean
          preco_extra?: number
          emoji?: string
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          category?: string
          is_premium?: boolean
          preco_extra?: number
          emoji?: string
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          tenant_id: string
          cashier_id: string | null
          cashier_name: string | null
          customer_name: string | null
          customer_phone: string | null
          order_number: number
          subtotal: number
          total: number
          status: string
          payment_method: string
          payment_reference: string | null
          cancelled_at: string | null
          cancel_reason: string | null
          cancelled_by_id: string | null
          cancelled_by_name: string | null
          items_json: Json
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          cashier_id?: string | null
          cashier_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          order_number: number
          subtotal?: number
          total?: number
          status?: string
          payment_method: string
          payment_reference?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          cancelled_by_id?: string | null
          cancelled_by_name?: string | null
          items_json?: Json
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          cashier_id?: string | null
          cashier_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          order_number?: number
          subtotal?: number
          total?: number
          status?: string
          payment_method?: string
          payment_reference?: string | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          cancelled_by_id?: string | null
          cancelled_by_name?: string | null
          items_json?: Json
          created_at?: string
          deleted_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string | null
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}
