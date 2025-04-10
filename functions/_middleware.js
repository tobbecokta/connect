// Middleware

// This file enables Cloudflare Functions in your Pages project
// This allows you to use environment variables
export async function onRequest(context) {
  // Pass the request to the next handler (static site or other functions)
  return context.next();
}