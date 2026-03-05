import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ─── Remplacez ces valeurs par vos propres identifiants Supabase ───────────────
// Trouvez-les dans : Supabase Dashboard → Settings → API
const SUPABASE_URL      = 'https://tmtaqlztcljidnetkqyc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdGFxbHp0Y2xqaWRuZXRrcXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDg0OTIsImV4cCI6MjA4ODI4NDQ5Mn0.KUuDbpS0h-dTm8WyVvqul9oWXS7FQTmOB2UbTyOEsmA';
// ──────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
