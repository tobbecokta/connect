// Catch-all function to make the deployment recognize serverless functionality

export async function onRequest(context) {
  // Get the current request
  const request = context.request;
  const url = new URL(request.url);
  
  // Handle API endpoints
  if (url.pathname.startsWith('/api/')) {
    const response = {
      status: "ok",
      environment: "production",
      supabaseUrl: context.env.SUPABASE_URL || "Not set",
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  // For all other requests, pass through to the static assets
  return context.next();
} 