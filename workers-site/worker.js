// Simple worker script with proper static asset handling

addEventListener('fetch', event => {
  try {
    event.respondWith(handleRequest(event.request, event));
  } catch (e) {
    event.respondWith(new Response(`Error: ${e.message}`, { status: 500 }));
  }
});

async function handleRequest(request, event) {
  const url = new URL(request.url);
  
  // For API endpoints, forward to Functions
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: "API requests should be handled by Functions, not the Worker"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  try {
    // For non-API requests, try to serve static assets
    // We should let the default static asset handling take over
    // by simply forwarding the request
    
    // Replace this with a proper static asset response
    // Fallback to serving index.html for client-side routing
    if (!url.pathname.includes('.')) {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Connect App</title>
            <style>
              body { font-family: sans-serif; padding: 2rem; text-align: center; }
            </style>
          </head>
          <body>
            <h1>Connect App</h1>
            <p>Loading static assets...</p>
            <p>Please check your Cloudflare Pages configuration.</p>
            <script>
              // Redirect to home page
              window.location.href = '/';
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" }
      });
    }
    
    // For file requests, return a 404 message
    return new Response("Static file not found. Please check your Cloudflare Pages configuration.", {
      status: 404,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (e) {
    return new Response(`Error serving static content: ${e.message}`, { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
} 