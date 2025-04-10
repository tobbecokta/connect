// Catch-all route handler for Pages Functions

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // For API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      status: "ok",
      path: url.pathname,
      timestamp: new Date().toISOString(),
      message: "API endpoint is working"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  // For all other paths, let the static assets be served
  return context.next();
} 