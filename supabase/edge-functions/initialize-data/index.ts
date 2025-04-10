import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client with direct URL and service role key
    const supabaseClient = createClient(
      "https://kxbjlxmmrxwbvpzyvgug.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxMjkxOSwiZXhwIjoyMDU5Mjg4OTE5fQ.Njw0DNzdsmHtzrFGfUmxk4Ux8uzphtdyNeP8FEbxMKM",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // For development, we'll use a default user_id
    // In production, you would extract this from authenticated user
    const userId = "00000000-0000-0000-0000-000000000000"; // Default development user ID
    
    // Check if there are any existing phone numbers for this user
    const { data: existingPhones, error: phonesError } = await supabaseClient
      .from("phone_numbers")
      .select("*")
      .eq("user_id", userId);
    
    if (phonesError) {
      return new Response(JSON.stringify({
        error: "Failed to check existing phone numbers",
        details: phonesError
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Only create default data if user has no phone numbers yet
    if (!existingPhones || existingPhones.length === 0) {
      // Create a default phone number for testing
      const { data: phone, error: phoneError } = await supabaseClient.from("phone_numbers").insert({
        user_id: userId,
        number: "+46766861551",
        device: "Default Device",
        is_default: true
      }).select().single();
      if (phoneError) {
        return new Response(JSON.stringify({
          error: "Failed to create default phone number",
          details: phoneError
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      // Create a sample contact
      const { data: contact, error: contactError } = await supabaseClient.from("contacts").insert({
        user_id: userId,
        name: "Sample Contact",
        phone_number: "+46701234567",
        avatar: "https://i.pravatar.cc/150?img=1"
      }).select().single();
      if (contactError) {
        return new Response(JSON.stringify({
          error: "Failed to create sample contact",
          details: contactError
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      // Create a sample conversation
      const { data: conversation, error: conversationError } = await supabaseClient.from("conversations").insert({
        user_id: userId,
        contact_id: contact.id,
        phone_id: phone.id,
        last_message: "Welcome to the messaging app!",
        unread_count: 1
      }).select().single();
      if (conversationError) {
        return new Response(JSON.stringify({
          error: "Failed to create sample conversation",
          details: conversationError
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      // Add a welcome message
      const { error: messageError } = await supabaseClient.from("messages").insert({
        user_id: userId,
        conversation_id: conversation.id,
        sender: "them",
        text: "Welcome to the messaging app! This is a sample conversation to help you get started.",
        status: "delivered",
        is_automated: true
      });
      if (messageError) {
        return new Response(JSON.stringify({
          error: "Failed to create welcome message",
          details: messageError
        }), {
          status: 500,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Default data initialized successfully",
        data: {
          phone,
          contact,
          conversation
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // If user already has data, just return success
    return new Response(JSON.stringify({
      success: true,
      message: "User already has data initialized",
      existing: true
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Error in initialize-data function:", error);
    
    // Return error response
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});