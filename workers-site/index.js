// Simple worker script without external dependencies

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    // Forward to API endpoints
    return fetch(request);
  }
  
  // Handle static assets
  try {
    // Try to fetch the requested resource from the asset manifest
    const response = await fetch(request);
    if (response.ok) return response;
    
    // If not found and it's not an asset request, serve index.html for SPA routing
    if (!url.pathname.includes('.')) {
      return fetch(`${url.origin}/index.html`);
    }
    
    return response;
  } catch (e) {
    // If there's an error, serve index.html as a fallback
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
} 