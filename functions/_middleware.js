// Middleware for Cloudflare Pages with Functions

// Using proper addEventListener format for Cloudflare Workers
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // You can add any custom logic here
  return fetch(request);
}