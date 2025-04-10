import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Handle sending SMS via 46elks API
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// API credentials - Using master API credentials
const API_USERNAME = 'ue596437b62aea3d860a16d90d54fbe33';
const API_PASSWORD = 'A8417BB9AAD73A752A13752E853666ED';
const API_BASE_URL = 'https://api.46elks.com/a1';

// Default delivery report webhook URL
const DEFAULT_DELIVERY_REPORT_URL = "https://kxbjlxmmrxwbvpzyvgug.functions.supabase.co/delivery-reports";

// Basic auth headers
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

// Supabase auth constants
const SUPABASE_URL = "https://kxbjlxmmrxwbvpzyvgug.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzcxMjkxOSwiZXhwIjoyMDU5Mjg4OTE5fQ.Njw0DNzdsmHtzrFGfUmxk4Ux8uzphtdyNeP8FEbxMKM";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YmpseG1tcnh3YnZwenl2Z3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3MTI5MTksImV4cCI6MjA1OTI4ODkxOX0.H-omSis9jxe0iVpehlurlzNM_k4FTWdNrDwLM2IH3qA";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Allow the request with or without auth for development/testing
    // In production, you might want to reject requests without valid auth
    
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json();
    // Log the full request body for debugging
    console.log("Received request body:", JSON.stringify(requestBody, null, 2));
    const { 
      to, 
      message, 
      from, 
      conversationId, 
      contactId, 
      whendelivered,
      campaignId, // Added campaign ID for bulk SMS tracking
      dryrun, 
      messageId // Added message ID for tracking existing message
    } = requestBody;

    // Validate required fields
    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields (to, message)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role key (highest privileges)
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this number is in campaign_failed_numbers
    if (campaignId) {
      const { data: failedNumber, error: failedNumberError } = await supabaseClient
        .from('campaign_failed_numbers')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('recipient_number', to)
        .maybeSingle();
        
      if (!failedNumberError && failedNumber) {
        console.log(`Recipient ${to} has previously failed in this campaign - aborting send`);
        return new Response(JSON.stringify({
          success: false,
          error: "Recipient has permanently failed in this campaign",
          details: failedNumber
        }), {
          status: 200, // Return 200 to avoid retry attempts
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get actual phone number from database using the phone_id (from parameter)
    if (!from || !/^[0-9a-f-]+$/.test(from)) { // Check if from is not a valid UUID
      return new Response(JSON.stringify({ error: "Invalid 'from' parameter - must be a valid phone_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`Looking up phone number for ID: ${from}`);
    
    const { data: phoneData, error: phoneError } = await supabaseClient
      .from('phone_numbers')
      .select('number')
      .eq('id', from)
      .single();
      
    if (phoneError || !phoneData || !phoneData.number) {
      console.error("Error looking up phone number:", phoneError);
      return new Response(JSON.stringify({ 
        error: "Failed to find phone number", 
        details: phoneError 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const senderPhoneNumber = phoneData.number;
    console.log(`Found phone number: ${senderPhoneNumber}`);

    // Prepare the request data with our sender
    const requestData: Record<string, string> = {
      to,
      message,
      from: senderPhoneNumber,
    };
    
    // Add whendelivered URL if provided, or use default
    const deliveryReportUrl = whendelivered || DEFAULT_DELIVERY_REPORT_URL;
    console.log(`Setting delivery report URL: ${deliveryReportUrl}`);
    requestData.whendelivered = deliveryReportUrl;
    
    // Set dryrun if specified
    if (dryrun) {
      requestData.dryrun = "yes";
    }

    // Log what we're sending to 46elks
    console.log("Request data for 46elks:", requestData);

    // Make the API request to 46elks
    const response = await fetch(`${API_BASE_URL}/sms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: encodeFormData(requestData)
    });

    const responseText = await response.text();
    console.log("46elks API response:", responseText);
    
    if (!response.ok) {
      console.error("46elks API error:", responseText);
      return new Response(JSON.stringify({ 
        error: "Failed to send SMS with phone number", 
        details: responseText 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the response
    const elksResponse = JSON.parse(responseText);
    
    // If this is a dry run, just return the response
    if (dryrun) {
      return new Response(
        JSON.stringify({
          success: true,
          data: elksResponse,
          sender: senderPhoneNumber,
          dryrun: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine the message ID to use - either the existing one or create a new one
    let dbMessageId = messageId;
    let recordMessageInDb = true;
    
    // Check if we have an existing message ID
    if (messageId) {
      // Verify the message exists
      const { data: existingMessage, error: messageCheckError } = await supabaseClient
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .single();
        
      if (messageCheckError) {
        console.log(`Message with ID ${messageId} not found, will create a new message`);
        dbMessageId = undefined;
      }
    }

    // If a conversation ID was provided, save the message to the database
    if (conversationId && recordMessageInDb) {
      const messageData: any = {
        conversation_id: conversationId,
        sender: "me",
        text: message,
        status: "sent",
        external_id: elksResponse.id
      };
      
      // Add campaign ID if provided
      if (campaignId) {
        messageData.bulk_campaign_id = campaignId;
        messageData.is_bulk = true;
      }
      
      // Insert the message
      const { data: insertedMessage, error: messageError } = await supabaseClient
        .from("messages")
        .insert([messageData])
        .select();

      if (messageError) {
        console.error("Error saving message to database:", messageError);
        // Continue anyway, as the SMS was sent successfully
      } else {
        // Record the newly created message ID
        dbMessageId = insertedMessage[0].id;
      }

      // Update the conversation with the latest message
      const { error: updateError } = await supabaseClient
        .from("conversations")
        .update({
          last_message: message,
          last_message_time: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (updateError) {
        console.error("Error updating conversation:", updateError);
        // Continue anyway, as the SMS was sent successfully
      }
    }
    // If we have a contactId but no conversationId, try to create/find a conversation
    else if (contactId && recordMessageInDb) {
      // Find or create conversation
      const { data: conversation, error: convError } = await supabaseClient
        .from("conversations")
        .select("*")
        .eq("contact_id", contactId)
        .eq("phone_id", from)
        .single();
      
      let conversationId;
      
      if (convError) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabaseClient
          .from("conversations")
          .insert([
            {
              contact_id: contactId,
              phone_id: from,
              last_message: message,
              last_message_time: new Date().toISOString(),
            },
          ])
          .select()
          .single();
        
        if (createError) {
          console.error("Error creating conversation:", createError);
          // Continue anyway, as the SMS was sent successfully
        } else {
          conversationId = newConversation.id;
        }
      } else {
        conversationId = conversation.id;
        
        // Update conversation
        const { error: updateError } = await supabaseClient
          .from("conversations")
          .update({
            last_message: message,
            last_message_time: new Date().toISOString(),
          })
          .eq("id", conversationId);
        
        if (updateError) {
          console.error("Error updating conversation:", updateError);
          // Continue anyway, as the SMS was sent successfully
        }
      }
      
      // Save message if we have a conversation ID
      if (conversationId) {
        const messageData: any = {
          conversation_id: conversationId,
          sender: "me",
          text: message,
          status: "sent",
          external_id: elksResponse.id
        };
        
        // Add campaign ID if provided
        if (campaignId) {
          messageData.bulk_campaign_id = campaignId;
          messageData.is_bulk = true;
        }
        
        const { data: insertedMessage, error: messageError } = await supabaseClient
          .from("messages")
          .insert([messageData])
          .select();
        
        if (messageError) {
          console.error("Error saving message:", messageError);
          // Continue anyway, as the SMS was sent successfully
        } else {
          // Record the newly created message ID
          dbMessageId = insertedMessage[0].id;
        }
      }
    }
    
    // Record delivery status if we have a message ID
    if (dbMessageId && !dryrun) {
      console.log(`Recording delivery status for message ${dbMessageId}`);
      
      try {
        const { error: deliveryError } = await supabaseClient
          .from('sms_delivery_status')
          .insert([{
            message_id: dbMessageId,
            external_id: elksResponse.id,
            recipient_number: to,
            campaign_id: campaignId,
            status: 'pending'
          }]);
          
        if (deliveryError) {
          console.error("Error recording delivery status:", deliveryError);
          // Continue anyway, as the SMS was sent successfully
        } else {
          console.log("Delivery status recorded successfully");
        }
      } catch (e) {
        console.error("Exception recording delivery status:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: elksResponse,
        sender: senderPhoneNumber,
        message_id: dbMessageId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send SMS",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});