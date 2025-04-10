import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Handle SMS delivery reports from 46elks
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the form data from 46elks
    const formData = await req.formData();
    const status = formData.get("status");
    const id = formData.get("id");
    const delivered = formData.get("delivered");

    // Get conversation ID from query params
    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversation_id");

    // Validate required fields
    if (!status || !id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      "https://kxbjlxmmrxwbvpzyvgug.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxMjkxOSwiZXhwIjoyMDU5Mjg4OTE5fQ.Njw0DNzdsmHtzrFGfUmxk4Ux8uzphtdyNeP8FEbxMKM"
    );

    // Update the message status in the database
    if (conversationId) {
      const { error: messageError } = await supabaseClient
        .from("messages")
        .update({
          status: status as string,
        })
        .eq("external_id", id as string)
        .eq("conversation_id", conversationId);

      if (messageError) {
        console.error("Error updating message status:", messageError);
        return new Response(JSON.stringify({ error: "Failed to update message status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // If we don't have a conversation ID, try to find the message by external ID
      const { error: messageError } = await supabaseClient
        .from("messages")
        .update({
          status: status as string,
        })
        .eq("external_id", id as string);

      if (messageError) {
        console.error("Error updating message status:", messageError);
        return new Response(JSON.stringify({ error: "Failed to update message status" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Delivery report processed successfully",
        data: {
          status,
          id,
          delivered,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing delivery report:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});