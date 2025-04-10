// Root handler for the main page
export async function onRequest(context) {
  // Just pass through to the static assets
  return context.next();
} 