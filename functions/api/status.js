// Simple API endpoint to demonstrate server-side functionality
export async function onRequest(context) {
  return new Response(JSON.stringify({
    status: "ok",
    environment: "production",
    hasSupabaseUrl: !!context.env.SUPABASE_URL
  }), {
    headers: { "Content-Type": "application/json" }
  });
} 