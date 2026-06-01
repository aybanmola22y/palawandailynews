import { supabaseArticlesRepository } from "@/lib/articles/supabase-repository";

export function getArticlesRepository() {
  return supabaseArticlesRepository;
}

export { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MSG } from "@/lib/supabase/env";
export type { ArticlesRepository } from "@/lib/articles/repository";
