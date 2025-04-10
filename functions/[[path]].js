// Simple test function for debugging

export async function onRequest(context) {
  return new Response("Hello from Connect! Application is working.", {
    headers: {
      "Content-Type": "text/plain",
    }
  });
} 