// For Deno edge functions
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Replace with your Supabase URL and service role key
const supabaseUrl = 'https://kxbjlxmmrxwbvpzyvgug.supabase.co';
const supabaseKey = 
  // Service role key
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxMjkxOSwiZXhwIjoyMDU5Mjg4OTE5fQ.Njw0DNzdsmHtzrFGfUmxk4Ux8uzphtdyNeP8FEbxMKM";

// API credentials for sending SMS
const API_USERNAME = 'ue596437b62aea3d860a16d90d54fbe33';
const API_PASSWORD = 'A8417BB9AAD73A752A13752E853666ED';
const API_BASE_URL = 'https://api.46elks.com/a1';

// Basic auth headers for 46elks API
const getAuthHeaders = () => {
  const authString = `${API_USERNAME}:${API_PASSWORD}`;
  const base64Auth = btoa(authString);
  return {
    'Authorization': `Basic ${base64Auth}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };
};

// Function to encode form data
const encodeFormData = (data: Record<string, string>) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

// Initialize Supabase client with service role key for unauthenticated access
const supabaseClient = createClient(
  supabaseUrl,
  supabaseKey
);

async function retryFailedMessage(
  supabase: SupabaseClient,
  deliveryStatus: any
) {
  console.log(`Retrying message ${deliveryStatus.id} (external ID: ${deliveryStatus.external_id})`);
  
  try {
    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select(`
        *,
        conversation:conversation_id(
          contact:contact_id(phone_number),
          phone:phone_id(number)
        )
      `)
      .eq('id', deliveryStatus.message_id)
      .single();
      
    if (messageError) {
      throw new Error(`Failed to get message details: ${messageError.message}`);
    }
    
    // Extract recipient and sender information
    const recipientNumber = message.conversation.contact.phone_number;
    const senderNumber = message.conversation.phone.number;
    
    if (!recipientNumber || !senderNumber) {
      throw new Error(`Missing recipient or sender number for message ${message.id}`);
    }
    
    console.log(`Retrying SMS to ${recipientNumber} from ${senderNumber}`);
    
    // Default delivery report webhook URL
    const DELIVERY_REPORT_URL = "https://kxbjlxmmrxwbvpzyvgug.functions.supabase.co/delivery-reports";
    
    // Prepare request data
    const requestData = {
      to: recipientNumber,
      message: message.text,
      from: senderNumber,
      whendelivered: DELIVERY_REPORT_URL
    };
    
    // Send the message to 46elks
    const response = await fetch(`${API_BASE_URL}/sms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: encodeFormData(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`46elks API error: ${errorText}`);
    }
    
    // Parse response
    const responseData = await response.json();
    console.log(`Successfully sent retry SMS, new ID: ${responseData.id}`);
    
    // Update the delivery status
    await supabase
      .from('sms_delivery_status')
      .update({
        external_id: responseData.id,
        status: 'pending',
        retry_count: deliveryStatus.retry_count + 1,
        last_status_change: new Date().toISOString()
      })
      .eq('id', deliveryStatus.id);
      
    // Update the message external ID
    await supabase
      .from('messages')
      .update({
        external_id: responseData.id
      })
      .eq('id', message.id);
      
    return {
      success: true,
      messageId: message.id,
      newExternalId: responseData.id
    };
  } catch (error) {
    console.error(`Error retrying message ${deliveryStatus.id}:`, error);
    
    // Update the delivery status to mark retry as failed
    if (deliveryStatus.retry_count >= 1) {
      await supabase
        .from('sms_delivery_status')
        .update({
          status: 'retry_failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          last_status_change: new Date().toISOString()
        })
        .eq('id', deliveryStatus.id);
        
      // If we have a campaign ID, add to failed numbers
      if (deliveryStatus.campaign_id) {
        try {
          // Get the recipient number
          const { data: message, error: messageError } = await supabase
            .from('messages')
            .select(`
              conversation:conversation_id(
                contact:contact_id(phone_number)
              )
            `)
            .eq('id', deliveryStatus.message_id)
            .single();
            
          if (!messageError && message.conversation?.contact?.phone_number) {
            // Add to failed numbers
            await supabase
              .from('campaign_failed_numbers')
              .insert([{
                campaign_id: deliveryStatus.campaign_id,
                recipient_number: message.conversation.contact.phone_number,
                reason: 'delivery_failed'
              }])
              .onConflict(['campaign_id', 'recipient_number'])
              .ignore();
          }
        } catch (e) {
          console.error('Error adding to failed numbers:', e);
        }
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Serve the webhook endpoint
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  try {
    console.log("⚙️ Running failed message retry task");
    
    // Get failed messages that need to be retried
    const { data: failedMessages, error: queryError } = await supabaseClient
      .from('sms_delivery_status')
      .select('*')
      .eq('status', 'failed')
      .lte('retry_count', 0) // Only get messages that haven't been retried yet or have been retried once
      .order('last_status_change', { ascending: true })
      .limit(50); // Process in batches
      
    if (queryError) {
      throw new Error(`Failed to query failed messages: ${queryError.message}`);
    }
    
    console.log(`Found ${failedMessages.length} failed messages to retry`);
    
    if (failedMessages.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No failed messages to retry",
          retried: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Process each failed message
    const results = [];
    for (const message of failedMessages) {
      try {
        const result = await retryFailedMessage(supabaseClient, message);
        results.push(result);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        results.push({
          success: false,
          messageId: message.message_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} failed messages`,
        results: {
          total: results.length,
          success: successCount,
          failed: failCount
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing failed messages:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error processing failed messages",
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 