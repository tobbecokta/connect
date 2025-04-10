// Main worker entry point for Cloudflare Pages
// This follows the Pages Functions format

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // For static file paths, let Pages handle them
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta http-equiv="refresh" content="0;url=/">
          <title>Connect App</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Connect App</h1>
          <p>Loading app...</p>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });
  }
}; 