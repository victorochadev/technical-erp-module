// Client Supabase do navegador. A anon key é pública por design (protegida
// pelas RLS policies no banco, ver supabase/schema.sql) — é assim que o
// Supabase espera ser usado direto do front-end, mesmo em repositório público.
;(function () {
  const SUPABASE_URL = 'https://phovbcapjwxgolomxjih.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBob3ZiY2Fwand4Z29sb214amloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzk4OTcsImV4cCI6MjA5OTc1NTg5N30.f5BaM2vZLx9-zcnPqcgN0FrOQcIUuA_DvtcPUCpLyyY'
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
})()
