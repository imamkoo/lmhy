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
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          bio: string | null
          avatar_url: string | null
          banner_url: string | null
          website: string | null
          facebook_profile_url: string | null
          facebook_access_token: string | null
          creator_role: 'PENULIS' | 'PENDAMPING' | 'PRAKTISI'
          service_track: 'SEBAYA' | 'KLINIS' | null
          credential_type: string | null
          credential_number: string | null
          credential_document_url: string | null
          verification_status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'
          verified_at: string | null
          verified_by: string | null
          verification_note: string | null
          pro_until: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          facebook_profile_url?: string | null
          facebook_access_token?: string | null
          creator_role?: 'PENULIS' | 'PENDAMPING' | 'PRAKTISI'
          service_track?: 'SEBAYA' | 'KLINIS' | null
          credential_type?: string | null
          credential_number?: string | null
          credential_document_url?: string | null
          verification_status?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'
          verified_at?: string | null
          verified_by?: string | null
          verification_note?: string | null
          pro_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string
          bio?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          website?: string | null
          facebook_profile_url?: string | null
          facebook_access_token?: string | null
          creator_role?: 'PENULIS' | 'PENDAMPING' | 'PRAKTISI'
          service_track?: 'SEBAYA' | 'KLINIS' | null
          credential_type?: string | null
          credential_number?: string | null
          credential_document_url?: string | null
          verification_status?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'
          verified_at?: string | null
          verified_by?: string | null
          verification_note?: string | null
          pro_until?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      articles: {
        Row: {
          id: string
          author_id: string
          username: string
          slug: string
          title: string
          excerpt: string
          content: string
          tags: string[] | null
          media_type: 'IMAGE' | 'VIDEO' | null
          media_url: string | null
          register_litera: boolean | null
          creator_wallet: string | null
          template_id: string | null
          published_at: string
          updated_at: string
          litera_operation_id: string | null
          litera_intent_id: string | null
          litera_status: string | null
          litera_tx_hash: string | null
          litera_token_id: number | null
          litera_failure_code: string | null
          litera_failure_message: string | null
          litera_updated_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          username: string
          slug: string
          title: string
          excerpt: string
          content: string
          tags?: string[] | null
          media_type?: 'IMAGE' | 'VIDEO' | null
          media_url?: string | null
          register_litera?: boolean | null
          creator_wallet?: string | null
          template_id?: string | null
          published_at?: string
          updated_at?: string
          litera_operation_id?: string | null
          litera_intent_id?: string | null
          litera_status?: string | null
          litera_tx_hash?: string | null
          litera_token_id?: number | null
          litera_failure_code?: string | null
          litera_failure_message?: string | null
          litera_updated_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          username?: string
          slug?: string
          title?: string
          excerpt?: string
          content?: string
          tags?: string[] | null
          media_type?: 'IMAGE' | 'VIDEO' | null
          media_url?: string | null
          register_litera?: boolean | null
          creator_wallet?: string | null
          template_id?: string | null
          published_at?: string
          updated_at?: string
          litera_operation_id?: string | null
          litera_intent_id?: string | null
          litera_status?: string | null
          litera_tx_hash?: string | null
          litera_token_id?: number | null
          litera_failure_code?: string | null
          litera_failure_message?: string | null
          litera_updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_username_fkey"
            columns: ["username"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["username"]
          }
        ]
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          article_id: string
          author_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          author_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          author_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      creator_subscriptions: {
        Row: {
          id: string
          provider_id: string
          tier: 'SAPA' | 'CERITA' | 'DENGAR'
          current_period_end: string | null
          status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          tier?: 'SAPA' | 'CERITA' | 'DENGAR'
          current_period_end?: string | null
          status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          tier?: 'SAPA' | 'CERITA' | 'DENGAR'
          current_period_end?: string | null
          status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      listening_slots: {
        Row: {
          id: string
          provider_id: string
          start_time: string
          duration_min: number
          price_idr: number
          status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'CANCELLED' | 'COMPLETED'
          reserved_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          start_time: string
          duration_min: number
          price_idr: number
          status?: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'CANCELLED' | 'COMPLETED'
          reserved_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          start_time?: string
          duration_min?: number
          price_idr?: number
          status?: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'CANCELLED' | 'COMPLETED'
          reserved_until?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      session_bookings: {
        Row: {
          id: string
          slot_id: string
          client_pseudonym: string
          client_contact: string
          client_note: string | null
          consent_accepted: boolean
          status: 'PENDING' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'NO_SHOW'
          order_id: string | null
          midtrans_transaction_id: string | null
          room_url: string | null
          take_rate_bps: number
          amount_idr: number
          risk_flag: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slot_id: string
          client_pseudonym: string
          client_contact: string
          client_note?: string | null
          consent_accepted?: boolean
          status?: 'PENDING' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'NO_SHOW'
          order_id?: string | null
          midtrans_transaction_id?: string | null
          room_url?: string | null
          take_rate_bps: number
          amount_idr: number
          risk_flag?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slot_id?: string
          client_pseudonym?: string
          client_contact?: string
          client_note?: string | null
          consent_accepted?: boolean
          status?: 'PENDING' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'NO_SHOW'
          order_id?: string | null
          midtrans_transaction_id?: string | null
          room_url?: string | null
          take_rate_bps?: number
          amount_idr?: number
          risk_flag?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "listening_slots"
            referencedColumns: ["id"]
          }
        ]
      }
      guided_prompts: {
        Row: {
          id: string
          slug: string
          title: string
          prompt_body: string
          category: 'Burnout' | 'Duka' | 'Penerimaan Diri' | 'Hubungan' | 'Kecemasan'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          prompt_body: string
          category: 'Burnout' | 'Duka' | 'Penerimaan Diri' | 'Hubungan' | 'Kecemasan'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          prompt_body?: string
          category?: 'Burnout' | 'Duka' | 'Penerimaan Diri' | 'Hubungan' | 'Kecemasan'
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      provider_applications: {
        Row: { id: string; user_id: string; track: 'SEBAYA' | 'KLINIS'; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED'; username: string; applicant_name: string; applicant_email: string; whatsapp: string; domicile_province: string; domicile_city: string; motivation: string; background_track: 'PENYINTAS' | 'PEMERHATI' | 'MAHASISWA' | 'LAINNYA' | null; pfa_status: 'BELUM' | 'SEDANG' | 'SELESAI'; pfa_evidence_doc_id: string | null; wa_joined_confirmed_at: string | null; ethics_pledge_at: string; pledge_version: string; email_verified_at: string | null; applied_at: string; decided_at: string | null; decided_by: string | null; decision_note: string | null; supersedes: string | null; superseded_by: string | null; details: Json; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; track: 'SEBAYA' | 'KLINIS'; status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED'; username: string; applicant_name: string; applicant_email: string; whatsapp: string; domicile_province: string; domicile_city: string; motivation: string; background_track?: 'PENYINTAS' | 'PEMERHATI' | 'MAHASISWA' | 'LAINNYA' | null; pfa_status?: 'BELUM' | 'SEDANG' | 'SELESAI'; pfa_evidence_doc_id?: string | null; wa_joined_confirmed_at?: string | null; ethics_pledge_at: string; pledge_version: string; email_verified_at?: string | null; applied_at?: string; decided_at?: string | null; decided_by?: string | null; decision_note?: string | null; supersedes?: string | null; superseded_by?: string | null; details: Json; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; track?: 'SEBAYA' | 'KLINIS'; status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED'; username?: string; applicant_name?: string; applicant_email?: string; whatsapp?: string; domicile_province?: string; domicile_city?: string; motivation?: string; background_track?: 'PENYINTAS' | 'PEMERHATI' | 'MAHASISWA' | 'LAINNYA' | null; pfa_status?: 'BELUM' | 'SEDANG' | 'SELESAI'; pfa_evidence_doc_id?: string | null; wa_joined_confirmed_at?: string | null; ethics_pledge_at?: string; pledge_version?: string; email_verified_at?: string | null; applied_at?: string; decided_at?: string | null; decided_by?: string | null; decision_note?: string | null; supersedes?: string | null; superseded_by?: string | null; details?: Json; created_at?: string; updated_at?: string }
        Relationships: []
      }
      provider_documents: {
        Row: { id: string; application_id: string; user_id: string; doc_type: 'STR' | 'SIPP' | 'CV' | 'TRAINING_CERT' | 'PFA_CERT' | 'OTHER'; storage_path: string; original_filename: string; mime_type: string; size_bytes: number; uploaded_at: string; purge_after: string | null }
        Insert: { id?: string; application_id: string; user_id: string; doc_type: 'STR' | 'SIPP' | 'CV' | 'TRAINING_CERT' | 'PFA_CERT' | 'OTHER'; storage_path: string; original_filename: string; mime_type: string; size_bytes: number; uploaded_at?: string; purge_after?: string | null }
        Update: { id?: string; application_id?: string; user_id?: string; doc_type?: 'STR' | 'SIPP' | 'CV' | 'TRAINING_CERT' | 'PFA_CERT' | 'OTHER'; storage_path?: string; original_filename?: string; mime_type?: string; size_bytes?: number; uploaded_at?: string; purge_after?: string | null }
        Relationships: []
      }
      admin_audit_log: {
        Row: { id: string; actor_id: string; action: 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'APPLICATION_EXPIRED' | 'APPLICATION_RESUBMITTED' | 'DOCUMENT_VIEWED' | 'CHECKLIST_UPDATED' | 'LITERA_CONFIG_UPDATED' | 'EMAIL_RESENT' | 'SWEEP_FAILED' | 'DOCUMENT_PURGED'; target_type: string; target_id: string | null; note: string | null; metadata: Json | null; created_at: string }
        Insert: { id?: string; actor_id: string; action: 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'APPLICATION_EXPIRED' | 'APPLICATION_RESUBMITTED' | 'DOCUMENT_VIEWED' | 'CHECKLIST_UPDATED' | 'LITERA_CONFIG_UPDATED' | 'EMAIL_RESENT' | 'SWEEP_FAILED' | 'DOCUMENT_PURGED'; target_type: string; target_id?: string | null; note?: string | null; metadata?: Json | null; created_at?: string }
        Update: { id?: string; actor_id?: string; action?: 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED' | 'APPLICATION_EXPIRED' | 'APPLICATION_RESUBMITTED' | 'DOCUMENT_VIEWED' | 'CHECKLIST_UPDATED' | 'LITERA_CONFIG_UPDATED' | 'EMAIL_RESENT' | 'SWEEP_FAILED' | 'DOCUMENT_PURGED'; target_type?: string; target_id?: string | null; note?: string | null; metadata?: Json | null; created_at?: string }
        Relationships: []
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Article = Tables<'articles'>
export type ArticleInsert = TablesInsert<'articles'>
export type ArticleUpdate = TablesUpdate<'articles'>

export type Follow = Tables<'follows'>
export type FollowInsert = TablesInsert<'follows'>
export type FollowUpdate = TablesUpdate<'follows'>

export type Comment = Tables<'comments'>
export type CommentInsert = TablesInsert<'comments'>
export type CommentUpdate = TablesUpdate<'comments'>

export type CreatorSubscription = Tables<'creator_subscriptions'>
export type CreatorSubscriptionInsert = TablesInsert<'creator_subscriptions'>
export type CreatorSubscriptionUpdate = TablesUpdate<'creator_subscriptions'>

export type ListeningSlot = Tables<'listening_slots'>
export type ListeningSlotInsert = TablesInsert<'listening_slots'>
export type ListeningSlotUpdate = TablesUpdate<'listening_slots'>

export type SessionBooking = Tables<'session_bookings'>
export type SessionBookingInsert = TablesInsert<'session_bookings'>
export type SessionBookingUpdate = TablesUpdate<'session_bookings'>

export type GuidedPrompt = Tables<'guided_prompts'>
export type GuidedPromptInsert = TablesInsert<'guided_prompts'>
export type GuidedPromptUpdate = TablesUpdate<'guided_prompts'>
