// For Deno edge functions
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Handle SMS delivery reports (DLRs) from 46elks
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Replace with your Supabase URL and service role key
const supabaseUrl = 'https://kxbjlxmmrxwbvpzyvgug.supabase.co';
const supabaseKey = 
  // Service role key
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxMjkxOSwiZXhwIjoyMDU5Mjg4OTE5fQ.Njw0DNzdsmHtzrFGfUmxk4Ux8uzphtdyNeP8FEbxMKM";

// Initialize Supabase client with service role key for unauthenticated access
const supabaseClient = createClient(
  supabaseUrl,
  supabaseKey
);

// Process a delivery report
async function processDeliveryReport(
  supabase: SupabaseClient,
  messageId: string,
  status: 'sent' | 'delivered' | 'failed',
  deliveredTime?: string
) {
  console.log(`Processing delivery report for message ${messageId} with status ${status}`);
  
  try {
    // Find the delivery status record
    const { data: deliveryStatus, error: findError } = await supabase
      .from('sms_delivery_status')
      .select('*')
      .eq('external_id', messageId)
      .single();
    
    if (findError) {
      console.error('Error finding delivery status:', findError);
      throw new Error(`Delivery status record not found for message ID: ${messageId}`);
    }
    
    // Update the status
    const { data: updated, error: updateError } = await supabase
      .from('sms_delivery_status')
      .update({
        status,
        last_status_change: new Date().toISOString(),
        // If delivered, record the delivery time
        ...(status === 'delivered' && deliveredTime ? { delivered_at: deliveredTime } : {})
      })
      .eq('external_id', messageId)
      .select();
    
    if (updateError) {
      console.error('Error updating delivery status:', updateError);
      throw new Error(`Failed to update delivery status for message ID: ${messageId}`);
    }
    
    // If the status is 'failed' and the retry count is 0, trigger a retry
    if (status === 'failed' && deliveryStatus.retry_count === 0) {
      // This would typically call your retry mechanism
      // Here, we'll simulate scheduling a retry by updating a status field
      await supabase
        .from('sms_delivery_status')
        .update({
          status: 'pending_retry',
          last_status_change: new Date().toISOString()
        })
        .eq('external_id', messageId);
      
      console.log(`Marked message ${messageId} for retry`);
      
      // NOTE: In a real implementation, you would trigger an actual retry here
      // or have a separate process that polls for messages with status 'pending_retry'
    }
    
    return {
      success: true,
      status,
      messageId,
      updated
    };
  } catch (error) {
    console.error('Error processing delivery report:', error);
    throw error;
  }
}

// Serve the webhook endpoint
Deno.serve(async (req: Request) => {
  // Enhanced debugging - log everything
  console.log("📊 DELIVERY REPORT RECEIVED 📊");
  console.log("📝 Method:", req.method);
  console.log("🔗 URL:", req.url);
  console.log("📋 Headers:", JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
  
  let bodyText = "";
  try {
    bodyText = await req.clone().text();
    console.log("📄 Raw Body:", bodyText);
  } catch (e) {
    console.log("⚠️ Error reading raw body:", e.message);
  }
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      console.log("❌ Not a POST request, rejecting");
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the content type
    const contentType = req.headers.get("content-type") || "";
    console.log("  Content-Type:", contentType);

    // Variables to store the delivery report data
    let id: string | null = null;
    let status: 'sent' | 'delivered' | 'failed' | null = null;
    let delivered: string | null = null;

    // Try to parse the request body based on the content type
    if (contentType.includes("application/x-www-form-urlencoded")) {
      console.log("📋 Parsing form data");
      try {
        const formData = await req.formData();
        // Convert formData to an object for logging
        const formValues: Record<string, any> = {};
        for (const [key, value] of formData.entries()) {
          formValues[key] = value;
        }
        console.log("  Form data:", formValues);

        // Extract the fields
        id = formData.get("id") as string;
        status = formData.get("status") as 'sent' | 'delivered' | 'failed';
        delivered = formData.get("delivered") as string;
      } catch (error) {
        console.error("  Error parsing form data:", error);
        // Fall back to reading the raw body
        const params = new URLSearchParams(bodyText);
        id = params.get("id");
        status = params.get("status") as 'sent' | 'delivered' | 'failed';
        delivered = params.get("delivered");
        
        console.log("  Manually parsed:", { id, status, delivered });
      }
    } else if (contentType.includes("application/json")) {
      console.log("🔄 Parsing JSON data");
      try {
        const jsonData = await req.json();
        console.log("  JSON data:", jsonData);
        
        // Extract the fields from JSON
        id = jsonData.id || null;
        status = jsonData.status || null;
        delivered = jsonData.delivered || null;
      } catch (error) {
        console.error("  Error parsing JSON:", error);
        // Try to parse JSON from the raw body
        try {
          const jsonData = JSON.parse(bodyText);
          id = jsonData.id || null;
          status = jsonData.status || null;
          delivered = jsonData.delivered || null;
        } catch (e) {
          console.error("  Error parsing raw body as JSON:", e);
        }
      }
    } else {
      // For any other content type, try to read as text
      console.log("📄 Unknown content type, reading as text and trying different parsing approaches");
      try {
        // Use the text we already read at the beginning
        console.log("  Using previously read body text:", bodyText);
        
        // Try to parse as JSON first
        try {
          const jsonData = JSON.parse(bodyText);
          console.log("  Successfully parsed as JSON:", jsonData);
          
          id = jsonData.id || null;
          status = jsonData.status || null;
          delivered = jsonData.delivered || null;
        } catch (jsonError) {
          console.log("  Failed to parse as JSON, trying as form data");
          // If not JSON, try to parse as form data
          const params = new URLSearchParams(bodyText);
          id = params.get("id");
          status = params.get("status") as 'sent' | 'delivered' | 'failed';
          delivered = params.get("delivered");
          
          console.log("  Parsed as form data:", { id, status, delivered });
        }
      } catch (error) {
        console.error("  Error reading request body:", error);
      }
    }

    // Log the extracted values
    console.log("📱 Final extracted delivery report data:");
    console.log("  ID:", id);
    console.log("  Status:", status);
    console.log("  Delivered:", delivered);

    // Validate required fields
    if (!id || !status) {
      console.log("❌ Missing required fields");
      return new Response(JSON.stringify({ 
        error: "Missing required fields", 
        received: { id, status, delivered }, 
        rawBody: bodyText 
      }), {
        status: 200, // Return 200 even on error to prevent retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure status is one of the allowed values
    if (status !== 'sent' && status !== 'delivered' && status !== 'failed') {
      console.log(`❌ Invalid status value: ${status}`);
      return new Response(JSON.stringify({ 
        error: "Invalid status value", 
        received: { id, status, delivered }, 
        rawBody: bodyText 
      }), {
        status: 200, // Return 200 even on error to prevent retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Validation passed, processing delivery report");
    
    // Process the delivery report
    const result = await processDeliveryReport(
      supabaseClient,
      id,
      status,
      delivered || undefined
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Delivery report processed successfully",
        data: result
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error processing delivery report:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
        stack: error.stack
      }),
      {
        status: 200, // Return 200 even on error to prevent retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 