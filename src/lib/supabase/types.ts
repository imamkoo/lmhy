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
