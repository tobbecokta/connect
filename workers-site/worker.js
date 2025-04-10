// Simple worker script with no self-referencing fetch calls

addEventListener('fetch', event => {
  try {
    event.respondWith(handleRequest(event.request));
  } catch (e) {
    event.respondWith(new Response(`Error: ${e.message}`, { status: 500 }));
  }
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // For API endpoints, do NOT fetch - this would cause error 1042
  // Just return a simple response indicating they should be handled by Functions
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      error: "API requests should be handled by Functions, not the Worker"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // For all other requests, simply indicate they should be handled by static assets
  // DO NOT use fetch() here to prevent error 1042
  return new Response("This path should be handled by static assets", {
    headers: { "Content-Type": "text/plain" }
  });
} 