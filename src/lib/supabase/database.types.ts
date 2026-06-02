/**
 * Supabase schema types (matches supabase/migrations/*.sql).
 * Regenerate later: npx supabase gen types typescript --project-id <id>
 */

export type ArticleRow = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  tags: string[];
  date: string;
  reading_time: string;
  image_url: string;
  is_breaking: boolean;
  status: string;
  legacy_wp_id: number | null;
  created_at: string;
  updated_at: string;
};

export type AdRow = {
  id: string;
  client: string;
  placement: string;
  placement_label: string;
  status: "Active" | "Scheduled" | "Inactive";
  image_url: string;
  link_url: string;
  alt_text: string;
  impressions: number;
  clicks: number;
  created_at: string;
  updated_at: string;
};

export type AdminUserRow = {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  role: "Super Admin" | "Editor" | "Writer" | "Moderator";
  last_active: string;
  avatar: string;
  profile_title: string;
  quote: string;
  bio: string;
  badge_label: string;
  created_at: string;
  updated_at: string;
};

export type StaffProfileRow = {
  id: string;
  admin_user_id: string | null;
  slug: string;
  name: string;
  profile_title: string;
  quote: string;
  bio: string;
  badge_label: string;
  avatar: string;
  is_columnist: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleInsertRow = Omit<ArticleRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export type ArticleUpdateRow = Partial<ArticleInsertRow>;

export type Database = {
  public: {
    Tables: {
      articles: {
        Row: ArticleRow;
        Insert: ArticleInsertRow;
        Update: ArticleUpdateRow;
        Relationships: [];
      };
      ads: {
        Row: AdRow;
        Insert: Omit<AdRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<AdRow>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Omit<AdminUserRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<AdminUserRow>;
        Relationships: [];
      };
      staff_profiles: {
        Row: StaffProfileRow;
        Insert: Omit<StaffProfileRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StaffProfileRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
