import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl =
  process.env.NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_URL!;

const supabaseKey =
  process.env.NEXT_PUBLIC_YUVABE_PEOPLE_SUPABASE_KEY!;

export function getSupabasePeopleClient() {
  return createClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}