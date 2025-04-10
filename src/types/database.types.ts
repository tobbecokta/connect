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
      phone_numbers: {
        Row: {
          id: string
          number: string
          device: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          number: string
          device: string
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          number?: string
          device?: string
          is_default?: boolean
          created_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          name: string | null
          phone_number: string
          avatar: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          phone_number: string
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          phone_number?: string
          avatar?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          contact_id: string | null
          phone_id: string | null
          last_message: string | null
          last_message_time: string
          unread_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id?: string | null
          phone_id?: string | null
          last_message?: string | null
          last_message_time?: string
          unread_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string | null
          phone_id?: string | null
          last_message?: string | null
          last_message_time?: string
          unread_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_phone_id_fkey"
            columns: ["phone_id"]
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender: string
          text: string
          time: string
          status: string | null
          is_automated: boolean
          api_source: string | null
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender: string
          text: string
          time?: string
          status?: string | null
          is_automated?: boolean
          api_source?: string | null
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender?: string
          text?: string
          time?: string
          status?: string | null
          is_automated?: boolean
          api_source?: string | null
          external_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      bulk_campaigns: {
        Row: {
          id: string
          name: string
          template: string
          recipient_count: number
          status: string | null
          created_at: string
          sent_at: string | null
          phone_id: string | null
        }
        Insert: {
          id?: string
          name: string
          template: string
          recipient_count?: number
          status?: string | null
          created_at?: string
          sent_at?: string | null
          phone_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          template?: string
          recipient_count?: number
          status?: string | null
          created_at?: string
          sent_at?: string | null
          phone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_campaigns_phone_id_fkey"
            columns: ["phone_id"]
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          }
        ]
      }
    }
  }
}