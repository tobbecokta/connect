// API status endpoint
export async function onRequest(context) {
  return new Response(JSON.stringify({
    status: "ok",
    message: "API is working",
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: context.env.SUPABASE_URL ? "Set" : "Not set"
    }
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}