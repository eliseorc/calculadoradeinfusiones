// Estas credenciales son públicas y están diseñadas para usarse en el navegador.
window.INFUSION_SUPABASE_URL = 'https://grjvcrzztjzfehdhjdbo.supabase.co';
window.INFUSION_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4kK2S941Meu4ThJWPGU63A__YzjJVfY';

if (!window.supabase?.createClient) {
  throw new Error('No se pudo cargar el cliente de Supabase.');
}

window.infusionSupabase = window.supabase.createClient(
  window.INFUSION_SUPABASE_URL,
  window.INFUSION_SUPABASE_PUBLISHABLE_KEY
);
