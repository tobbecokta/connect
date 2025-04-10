// Middleware

// This file enables Cloudflare Functions in your Pages project
// This allows you to use environment variables
export async function onRequest(context) {
  // Just pass the request through
  return await context.next();
}