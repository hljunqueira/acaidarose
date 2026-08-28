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
          royalty_percentage: number
          marketing_fund_percentage: number
          vat_rate_food: number
          vat_rate_beverages: number
          at_tax_api_key: string | null
          mbway_merchant_key: string | null
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
          royalty_percentage?: number
          marketing_fund_percentage?: number
          vat_rate_food?: number
          vat_rate_beverages?: number
          at_tax_api_key?: string | null
          mbway_merchant_key?: string | null
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
          royalty_percentage?: number
          marketing_fund_percentage?: number
          vat_rate_food?: number
          vat_rate_beverages?: number
          at_tax_api_key?: string | null
          mbway_merchant_key?: string | null
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
          phone: string | null
          password_hash: string
          role: 'SUPER_ADMIN' | 'FRANCHISOR_ADMIN' | 'TENANT_ADMIN' | 'CASHIER'
          active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          email: string
          name: string
          phone?: string | null
          password_hash: string
          role?: 'SUPER_ADMIN' | 'FRANCHISOR_ADMIN' | 'TENANT_ADMIN' | 'CASHIER'
          active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          email?: string
          name?: string
          phone?: string | null
          password_hash?: string
          role?: 'SUPER_ADMIN' | 'FRANCHISOR_ADMIN' | 'TENANT_ADMIN' | 'CASHIER'
          active?: boolean
          last_login_at?: string | null
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
          weight_grams: number
          preco_base: number
          limite_bases: number
          limite_complementos_gratis: number
          image_url: string | null
          video_url: string | null
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
          weight_grams?: number
          preco_base?: number
          limite_bases?: number
          limite_complementos_gratis?: number
          image_url?: string | null
          video_url?: string | null
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
          weight_grams?: number
          preco_base?: number
          limite_bases?: number
          limite_complementos_gratis?: number
          image_url?: string | null
          video_url?: string | null
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
          description?: string | null
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
          description?: string | null
          image_url?: string | null
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
          image_url: string | null
          is_gluten_free: boolean
          is_vegan: boolean
          allergens_json: Json
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
          category: string
          is_premium?: boolean
          preco_extra?: number
          image_url?: string | null
          is_gluten_free?: boolean
          is_vegan?: boolean
          allergens_json?: Json
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
          image_url?: string | null
          is_gluten_free?: boolean
          is_vegan?: boolean
          allergens_json?: Json
          display_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      store_price_overrides: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          custom_price: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          custom_price: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          custom_price?: number
          updated_at?: string
        }
      }
      store_product_overrides: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          is_available: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          is_available?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          is_available?: boolean
          updated_at?: string
        }
      }
      restaurant_tables: {
        Row: {
          id: string
          tenant_id: string
          table_number: number
          status: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLEANING'
          customer_name: string | null
          opened_at: string | null
          current_bill_total: number
          items_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          table_number: number
          status?: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLEANING'
          customer_name?: string | null
          opened_at?: string | null
          current_bill_total?: number
          items_json?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          table_number?: number
          status?: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLEANING'
          customer_name?: string | null
          opened_at?: string | null
          current_bill_total?: number
          items_json?: Json
          created_at?: string
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
          customer_nif: string | null
          order_number: number
          subtotal: number
          vat_total: number
          total: number
          status: 'PAID' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
          payment_method: 'CASH' | 'MBWAY' | 'TPA' | 'SPLIT'
          payment_reference: string | null
          is_table_order: boolean
          table_number: number | null
          cancelled_at: string | null
          cancel_reason: string | null
          cancelled_by_name: string | null
          items_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          cashier_id?: string | null
          cashier_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_nif?: string | null
          order_number?: number
          subtotal?: number
          vat_total?: number
          total?: number
          status?: 'PAID' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
          payment_method: 'CASH' | 'MBWAY' | 'TPA' | 'SPLIT'
          payment_reference?: string | null
          is_table_order?: boolean
          table_number?: number | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          cancelled_by_name?: string | null
          items_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          cashier_id?: string | null
          cashier_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_nif?: string | null
          order_number?: number
          subtotal?: number
          vat_total?: number
          total?: number
          status?: 'PAID' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
          payment_method?: 'CASH' | 'MBWAY' | 'TPA' | 'SPLIT'
          payment_reference?: string | null
          is_table_order?: boolean
          table_number?: number | null
          cancelled_at?: string | null
          cancel_reason?: string | null
          cancelled_by_name?: string | null
          items_json?: Json
          created_at?: string
        }
      }
      cashier_shifts: {
        Row: {
          id: string
          tenant_id: string
          operator_id: string
          operator_name: string
          opening_balance: number
          closing_balance: number | null
          total_sales_cash: number
          total_sales_mbway: number
          total_sales_tpa: number
          status: 'OPEN' | 'CLOSED'
          opened_at: string
          closed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          operator_id: string
          operator_name: string
          opening_balance?: number
          closing_balance?: number | null
          total_sales_cash?: number
          total_sales_mbway?: number
          total_sales_tpa?: number
          status?: 'OPEN' | 'CLOSED'
          opened_at?: string
          closed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          operator_id?: string
          operator_name?: string
          opening_balance?: number
          closing_balance?: number | null
          total_sales_cash?: number
          total_sales_mbway?: number
          total_sales_tpa?: number
          status?: 'OPEN' | 'CLOSED'
          opened_at?: string
          closed_at?: string | null
          notes?: string | null
        }
      }
      cashier_movements: {
        Row: {
          id: string
          shift_id: string
          tenant_id: string
          type: 'SUPRIMENTO' | 'SANGRIA'
          amount: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          tenant_id: string
          type: 'SUPRIMENTO' | 'SANGRIA'
          amount: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          tenant_id?: string
          type?: 'SUPRIMENTO' | 'SANGRIA'
          amount?: number
          reason?: string
          created_at?: string
        }
      }
      waiter_calls: {
        Row: {
          id: string
          tenant_id: string
          table_number: number
          reason: string
          status: 'PENDING' | 'ATTENDED'
          created_at: string
          attended_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          table_number: number
          reason: string
          status?: 'PENDING' | 'ATTENDED'
          created_at?: string
          attended_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          table_number?: number
          reason?: string
          status?: 'PENDING' | 'ATTENDED'
          created_at?: string
          attended_at?: string | null
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
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      store_stories: {
        Row: {
          id: string
          tenant_id: string
          title: string
          video_url: string
          thumbnail_url: string
          linked_product_id: string | null
          badge_text: string | null
          display_order: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          video_url: string
          thumbnail_url: string
          linked_product_id?: string | null
          badge_text?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          video_url?: string
          thumbnail_url?: string
          linked_product_id?: string | null
          badge_text?: string | null
          display_order?: number
          active?: boolean
          created_at?: string
        }
      }
      store_devices: {
        Row: {
          id: string
          tenant_id: string
          device_name: string
          device_type: string
          device_token: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          device_name: string
          device_type: string
          device_token: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          device_name?: string
          device_type?: string
          device_token?: string
          is_active?: boolean
          created_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          unit: string
          category: string
          market_benchmark_price: number
          franchise_supply_price: number
          is_critical_checklist: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          unit: string
          category: string
          market_benchmark_price?: number
          franchise_supply_price?: number
          is_critical_checklist?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          unit?: string
          category?: string
          market_benchmark_price?: number
          franchise_supply_price?: number
          is_critical_checklist?: boolean
          created_at?: string
        }
      }
      store_inventory: {
        Row: {
          id: string
          tenant_id: string
          item_id: string
          current_quantity: number
          min_alert_quantity: number
          last_counted_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          item_id: string
          current_quantity?: number
          min_alert_quantity?: number
          last_counted_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          item_id?: string
          current_quantity?: number
          min_alert_quantity?: number
          last_counted_at?: string | null
          updated_at?: string
        }
      }
      supply_orders: {
        Row: {
          id: string
          tenant_id: string
          order_number: number
          status: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          total_amount: number
          total_savings: number
          items_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          order_number?: number
          status?: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          total_amount?: number
          total_savings?: number
          items_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          order_number?: number
          status?: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
          total_amount?: number
          total_savings?: number
          items_json?: Json
          created_at?: string
        }
      }
      inventory_audits: {
        Row: {
          id: string
          tenant_id: string
          cashier_shift_id: string | null
          item_id: string
          theoretical_quantity: number
          counted_quantity: number
          difference: number
          reason: string | null
          operator_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          cashier_shift_id?: string | null
          item_id: string
          theoretical_quantity: number
          counted_quantity: number
          difference: number
          reason?: string | null
          operator_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          cashier_shift_id?: string | null
          item_id?: string
          theoretical_quantity?: number
          counted_quantity?: number
          difference?: number
          reason?: string | null
          operator_id?: string | null
          created_at?: string
        }
      }
      customer_ratings: {
        Row: {
          id: string
          tenant_id: string
          order_id: string | null
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          order_id?: string | null
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          order_id?: string | null
          score?: number
          comment?: string | null
          created_at?: string
        }
      }
      franchise_requests: {
        Row: {
          id: string
          tenant_id: string
          request_type: 'PRICE_CHANGE' | 'ITEM_AVAILABILITY' | 'NEW_ITEM_PROPOSAL'
          product_id: string
          product_name: string
          requested_price: number | null
          current_price: number | null
          reason: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          admin_notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          request_type?: 'PRICE_CHANGE' | 'ITEM_AVAILABILITY' | 'NEW_ITEM_PROPOSAL'
          product_id: string
          product_name: string
          requested_price?: number | null
          current_price?: number | null
          reason: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          request_type?: 'PRICE_CHANGE' | 'ITEM_AVAILABILITY' | 'NEW_ITEM_PROPOSAL'
          product_id?: string
          product_name?: string
          requested_price?: number | null
          current_price?: number | null
          reason?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          admin_notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
