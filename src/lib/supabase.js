import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://upxerlzdgdbjkbjpuktn.supabase.co",
  "sb_publishable_h7ckPab1qOvXWNB70lgg1A_GJQo6SSc",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);