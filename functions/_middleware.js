// Simple middleware for Cloudflare Pages Functions
export async function onRequest(context) {
  // Just pass through all requests
  return context.next();
}