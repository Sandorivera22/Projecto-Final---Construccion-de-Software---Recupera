const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env"
  );
}

// Cliente con service role: solo se usa en el backend (nunca en el frontend).
// Sirve para verificar tokens, administrar usuarios y firmar URLs de Storage.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = { supabaseAdmin };
