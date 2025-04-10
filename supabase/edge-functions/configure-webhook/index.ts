import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Handle CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Supabase client with service role key
const supabaseClient = createClient(
  "https://kxbjlxmmrxwbvpzyvgug.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxMjkxOSwiZXhwIjoyMDU5Mjg4OTE5fQ.Njw0DNzdsmHtzrFGfUmxk4Ux8uzphtdyNeP8FEbxMKM"
);

// 46elks API credentials
const ELKS_USERNAME = 'a39194da10174dd9b9c96a53315263865';
const ELKS_PASSWORD = '97E4DE9E73C9AA6A55EF2462A6B29B10';

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { phoneNumber, smsUrl } = await req.json();

    if (!phoneNumber || !smsUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Getting numbers for account...`);
    
    // First, get the list of numbers to find the one we need to update
    const listResponse = await fetch("https://api.46elks.com/a1/Numbers", {
      method: "GET",
      headers: {
        "Authorization": `Basic ${btoa(`${ELKS_USERNAME}:${ELKS_PASSWORD}`)}`,
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error("Error getting number list:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to get number list",
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const numbersList = await listResponse.json();
    console.log(`Found ${numbersList.data.length} numbers`);
    
    // Find the number by matching the phone number
    const numberDetails = numbersList.data.find((num: any) => num.number === phoneNumber);
    
    if (!numberDetails) {
      console.error(`Phone number ${phoneNumber} not found in account`);
      return new Response(
        JSON.stringify({ 
          error: "Phone number not found in 46elks account",
          details: `${phoneNumber} is not in your 46elks account. Available numbers: ${numbersList.data.map((n: any) => n.number).join(', ')}`
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    console.log(`Found number details:`, numberDetails);
    console.log(`Updating SMS URL to: ${smsUrl}`);

    // Update the number with the webhook URL
    const updateResponse = await fetch(`https://api.46elks.com/a1/Numbers/${numberDetails.id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${ELKS_USERNAME}:${ELKS_PASSWORD}`)}`,
      },
      body: new URLSearchParams({
        sms_url: smsUrl,
      }).toString(),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("Error updating number:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to update webhook URL",
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const updateResult = await updateResponse.json();
    console.log(`Successfully updated webhook URL:`, updateResult);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Successfully configured webhook URL", 
        data: updateResult 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error configuring webhook:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 