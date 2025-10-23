export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      collections: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          libraries: string[];
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          libraries?: string[];
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          libraries?: string[];
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      organization_invite_redemptions: {
        Row: {
          id: string;
          invite_id: string;
          redeemed_at: string;
          user_id: string;
          was_new_user: boolean;
        };
        Insert: {
          id?: string;
          invite_id: string;
          redeemed_at?: string;
          user_id: string;
          was_new_user?: boolean;
        };
        Update: {
          id?: string;
          invite_id?: string;
          redeemed_at?: string;
          user_id?: string;
          was_new_user?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_invite_redemptions_invite_id_fkey';
            columns: ['invite_id'];
            isOneToOne: false;
            referencedRelation: 'organization_invites';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_invites: {
        Row: {
          created_at: string;
          created_by: string;
          current_uses: number;
          expires_at: string;
          id: string;
          is_active: boolean;
          max_uses: number | null;
          metadata: Json | null;
          organization_id: string;
          role: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          current_uses?: number;
          expires_at: string;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          metadata?: Json | null;
          organization_id: string;
          role?: string;
          token: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          current_uses?: number;
          expires_at?: string;
          id?: string;
          is_active?: boolean;
          max_uses?: number | null;
          metadata?: Json | null;
          organization_id?: string;
          role?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_invites_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          organization_id: string;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          organization_id: string;
          role?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          organization_id?: string;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_collection_segments: {
        Row: {
          collection_id: string;
          created_at: string;
          id: string;
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          id?: string;
          slug: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          id?: string;
          slug?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompt_collection_segments_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'prompt_collections';
            referencedColumns: ['id'];
          },
        ];
      };
      prompt_collections: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          organization_id: string;
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          organization_id: string;
          slug: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          organization_id?: string;
          slug?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompt_collections_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      prompts: {
        Row: {
          collection_id: string;
          created_at: string;
          created_by: string | null;
          description_en: string | null;
          description_pl: string | null;
          id: string;
          markdown_body_en: string;
          markdown_body_pl: string | null;
          organization_id: string;
          segment_id: string | null;
          sort_order: number;
          status: string;
          title_en: string;
          title_pl: string | null;
          updated_at: string;
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          created_by?: string | null;
          description_en?: string | null;
          description_pl?: string | null;
          id?: string;
          markdown_body_en: string;
          markdown_body_pl?: string | null;
          organization_id: string;
          segment_id?: string | null;
          sort_order?: number;
          status?: string;
          title_en: string;
          title_pl?: string | null;
          updated_at?: string;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          created_by?: string | null;
          description_en?: string | null;
          description_pl?: string | null;
          id?: string;
          markdown_body_en?: string;
          markdown_body_pl?: string | null;
          organization_id?: string;
          segment_id?: string | null;
          sort_order?: number;
          status?: string;
          title_en?: string;
          title_pl?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompts_collection_id_fkey';
            columns: ['collection_id'];
            isOneToOne: false;
            referencedRelation: 'prompt_collections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prompts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prompts_segment_id_fkey';
            columns: ['segment_id'];
            isOneToOne: false;
            referencedRelation: 'prompt_collection_segments';
            referencedColumns: ['id'];
          },
        ];
      };
      user_consents: {
        Row: {
          consented_at: string;
          created_at: string;
          id: string;
          privacy_policy_version: string;
          user_id: string;
        };
        Insert: {
          consented_at?: string;
          created_at?: string;
          id?: string;
          privacy_policy_version: string;
          user_id: string;
        };
        Update: {
          consented_at?: string;
          created_at?: string;
          id?: string;
          privacy_policy_version?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_invite_redemption_emails: {
        Args: { p_invite_id: string };
        Returns: {
          email: string;
          user_id: string;
        }[];
      };
      increment_invite_usage: {
        Args: { invite_id: string };
        Returns: undefined;
      };
      is_org_admin: {
        Args: { org_id: string; user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
