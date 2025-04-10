// Simple function that only handles API requests and avoids fetch loops

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // For API endpoints, return JSON data
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      status: "ok",
      message: "API is working",
      timestamp: new Date().toISOString(),
      path: url.pathname
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
  
  // For all other requests, just return the static content directly
  // Do NOT use fetch() here which would cause the error 1042
  return context.next();
} 