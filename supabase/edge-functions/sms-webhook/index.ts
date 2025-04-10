import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

// Handle incoming SMS webhook from 46elks
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Supabase client with service role key for unauthenticated access
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

Deno.serve(async (req: Request) => {
  // Enhanced debugging - log everything
  console.log("💬 SMS WEBHOOK RECEIVED 💬");
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

    // Variables to store the SMS data
    let direction: string = "incoming"; // Default to incoming
    let from: string | null = null;
    let to: string | null = null;
    let message: string | null = null;
    let id: string | null = null;
    let created: string | null = null;

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
        direction = (formData.get("direction") as string) || "incoming";
        from = formData.get("from") as string;
        to = formData.get("to") as string;
        message = formData.get("message") as string;
        id = formData.get("id") as string;
        created = formData.get("created") as string;
      } catch (error) {
        console.error("  Error parsing form data:", error);
        // Fall back to reading the raw body
        const params = new URLSearchParams(bodyText);
        direction = params.get("direction") || "incoming";
        from = params.get("from");
        to = params.get("to");
        message = params.get("message");
        id = params.get("id");
        created = params.get("created");
        
        console.log("  Manually parsed:", { direction, from, to, message, id, created });
      }
    } else if (contentType.includes("application/json")) {
      console.log("🔄 Parsing JSON data");
      try {
        const jsonData = await req.json();
        console.log("  JSON data:", jsonData);
        
        // Extract the fields from JSON
        direction = jsonData.direction || "incoming";
        from = jsonData.from || null;
        to = jsonData.to || null;
        message = jsonData.message || null;
        id = jsonData.id || null;
        created = jsonData.created || null;
      } catch (error) {
        console.error("  Error parsing JSON:", error);
        // Try to parse JSON from the raw body
        try {
          const jsonData = JSON.parse(bodyText);
          direction = jsonData.direction || "incoming";
          from = jsonData.from || null;
          to = jsonData.to || null;
          message = jsonData.message || null;
          id = jsonData.id || null;
          created = jsonData.created || null;
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
          
          direction = jsonData.direction || "incoming";
          from = jsonData.from || null;
          to = jsonData.to || null;
          message = jsonData.message || null;
          id = jsonData.id || null;
          created = jsonData.created || null;
        } catch (jsonError) {
          console.log("  Failed to parse as JSON, trying as form data");
          // If not JSON, try to parse as form data
          const params = new URLSearchParams(bodyText);
          direction = params.get("direction") || "incoming";
          from = params.get("from");
          to = params.get("to");
          message = params.get("message");
          id = params.get("id");
          created = params.get("created");
          
          console.log("  Parsed as form data:", { direction, from, to, message, id, created });
          
          if (!from && !to && !message) {
            console.log("  Form data parsing failed to extract fields, trying line-by-line parsing");
            // Try line-by-line parsing as a last resort
            const lines = bodyText.split('\n');
            for (const line of lines) {
              const [key, value] = line.split('=');
              if (key === 'direction') direction = value || "incoming";
              if (key === 'from') from = value;
              if (key === 'to') to = value;
              if (key === 'message') message = value;
              if (key === 'id') id = value;
              if (key === 'created') created = value;
            }
            console.log("  Line-by-line parsing results:", { direction, from, to, message, id, created });
          }
        }
      } catch (error) {
        console.error("  Error reading request body:", error);
      }
    }

    // Log the extracted values
    console.log("📱 Final extracted SMS data:");
    console.log("  Direction:", direction);
    console.log("  From:", from);
    console.log("  To:", to);
    console.log("  Message:", message);
    console.log("  ID:", id);
    console.log("  Created:", created);

    // Validate required fields
    if (!from || !to || !message) {
      console.log("❌ Missing required fields");
      return new Response(JSON.stringify({ 
        error: "Missing required fields", 
        received: { direction, from, to, message, id, created }, 
        rawBody: bodyText 
      }), {
        status: 200, // Return 200 even on error to prevent 46elks from retrying
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Validation passed, proceeding with database operations");

    // Find the phone number in our system
    console.log(`🔍 Looking for phone number: ${to}`);
    let { data: phoneNumber, error: phoneError } = await supabaseClient
      .from("phone_numbers")
      .select("*")
      .eq("number", to)
      .single();

    if (phoneError) {
      console.log(`⚠️ Phone number not found: ${to}`, phoneError);
      // Create a new phone number if not found
      const { data: newPhone, error: createPhoneError } = await supabaseClient
        .from("phone_numbers")
        .insert([
          {
            number: to,
            device: "Auto-created from SMS",
            is_default: false
          }
        ])
        .select()
        .single();
      
      if (createPhoneError) {
        console.error("❌ Error creating phone number:", createPhoneError);
        return new Response(JSON.stringify({ 
          error: "Failed to create phone number",
          message: "SMS received but could not be stored"
        }), {
          status: 200, // Return 200 to avoid 46elks retries
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      phoneNumber = newPhone;
      console.log(`✅ Created new phone number:`, phoneNumber);
    } else {
      console.log(`✅ Found phone number:`, phoneNumber);
    }

    // Find or create contact
    console.log(`🔍 Looking for contact with phone number: ${from}`);
    let contact;
    const { data: existingContact, error: contactError } = await supabaseClient
      .from("contacts")
      .select("*")
      .eq("phone_number", from)
      .single();

    if (contactError) {
      console.log(`⚠️ Contact not found, creating new contact for: ${from}`);
      // Contact doesn't exist, create a new one
      const { data: newContact, error: createError } = await supabaseClient
        .from("contacts")
        .insert([
          {
            name: null, // No name initially
            phone_number: from,
            avatar: null, // No avatar initially
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating contact:", createError);
        return new Response(JSON.stringify({ 
          error: "Failed to create contact",
          message: "SMS received but could not be stored" 
        }), {
          status: 200, // Return 200 to avoid 46elks retries
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      contact = newContact;
      console.log(`✅ Created new contact:`, contact);
    } else {
      contact = existingContact;
      console.log(`✅ Found existing contact:`, contact);
    }

    // Find or create conversation
    console.log(`🔍 Looking for conversation between contact ${contact.id} and phone ${phoneNumber.id}`);
    let conversation;
    const { data: existingConversation, error: convError } = await supabaseClient
      .from("conversations")
      .select("*")
      .eq("contact_id", contact.id)
      .eq("phone_id", phoneNumber.id)
      .single();

    if (convError) {
      console.log(`⚠️ Conversation not found, creating new one`);
      // Conversation doesn't exist, create a new one
      const createdTime = created ? new Date(created).toISOString() : new Date().toISOString();
      const { data: newConversation, error: createConvError } = await supabaseClient
        .from("conversations")
        .insert([
          {
            contact_id: contact.id,
            phone_id: phoneNumber.id,
            last_message: message,
            last_message_time: createdTime,
            unread_count: 1,
          },
        ])
        .select()
        .single();

      if (createConvError) {
        console.error("❌ Error creating conversation:", createConvError);
        return new Response(JSON.stringify({ 
          error: "Failed to create conversation",
          message: "SMS received but could not be stored" 
        }), {
          status: 200, // Return 200 to avoid 46elks retries
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      conversation = newConversation;
      console.log(`✅ Created new conversation:`, conversation);
    } else {
      conversation = existingConversation;
      console.log(`✅ Found existing conversation:`, conversation);
      
      // Update conversation with latest message
      const createdTime = created ? new Date(created).toISOString() : new Date().toISOString();
      console.log(`📝 Updating conversation with latest message and timestamp: ${createdTime}`);
      
      const { data: updatedConv, error: updateError } = await supabaseClient
        .from("conversations")
        .update({
          last_message: message,
          last_message_time: createdTime,
          unread_count: conversation.unread_count + 1,
        })
        .eq("id", conversation.id)
        .select();

      if (updateError) {
        console.error("⚠️ Error updating conversation:", updateError);
      } else {
        console.log(`✅ Updated conversation:`, updatedConv);
      }
    }

    // Store the message
    console.log(`💾 Storing new message in conversation ${conversation.id}`);
    const createdTime = created ? new Date(created).toISOString() : new Date().toISOString();
    
    // First, check if this is a STOPP message
    const isStoppMessage = message.toUpperCase().includes('STOPP') || message.toUpperCase().includes('STOP');
    
    if (isStoppMessage) {
      console.log(`⚠️ STOPP message detected: "${message}" from ${from} to ${to}`);
    }
    
    // Insert the actual message from the user
    const { data: newMessage, error: messageError } = await supabaseClient
      .from("messages")
      .insert([
        {
          conversation_id: conversation.id,
          sender: "them",
          text: message,
          time: createdTime,
          external_id: id || `generated_${Date.now()}`,
        },
      ])
      .select();

    if (messageError) {
      console.error("❌ Error creating message:", messageError);
      return new Response(JSON.stringify({ 
        error: "Failed to save message", 
        details: messageError,
        message: "SMS received but could not be stored" 
      }), {
        status: 200, // Return 200 to avoid 46elks retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Saved new message:`, newMessage);
    
    // Check if this is a reply to a campaign
    console.log(`🔍 Checking if this is a reply to a campaign for contact ${contact.id}`);
    try {
      const { data: relatedCampaigns, error: campaignError } = await supabaseClient
        .from("messages")
        .select("bulk_campaign_id, bulk_campaign_name")
        .eq("conversation_id", conversation.id)
        .eq("sender", "me")
        .is("bulk_campaign_id", "not.null")
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (campaignError) {
        console.error("❌ Error checking for campaign messages:", campaignError);
      } else if (relatedCampaigns && relatedCampaigns.length > 0 && relatedCampaigns[0].bulk_campaign_id) {
        const campaignId = relatedCampaigns[0].bulk_campaign_id;
        const campaignName = relatedCampaigns[0].bulk_campaign_name || `ID: ${campaignId}`;
        
        console.log(`✅ Found related campaign: ${campaignName} (${campaignId})`);
        
        // Check if user is already marked as having replied to this campaign
        const { data: existingReplies, error: replyCheckError } = await supabaseClient
          .from("campaign_replies")
          .select("*")
          .eq("campaign_id", campaignId)
          .eq("contact_id", contact.id)
          .single();
        
        if (replyCheckError) {
          // No existing reply record found, create one
          console.log(`🔔 Recording reply to campaign ${campaignId} from contact ${contact.id}`);
          
          const { error: insertError } = await supabaseClient
            .from("campaign_replies")
            .insert({
              campaign_id: campaignId,
              contact_id: contact.id,
              conversation_id: conversation.id,
              first_reply_time: new Date().toISOString(),
              was_opted_out: true
            });
          
          if (insertError) {
            console.error("❌ Error recording campaign reply:", insertError);
          } else {
            console.log(`✅ Successfully recorded reply to campaign ${campaignId}`);
            
            // Add a system message notification about being removed from the campaign
            try {
              const { error: systemMsgError } = await supabaseClient
                .from("messages")
                .insert([
                  {
                    conversation_id: conversation.id,
                    sender: "them",
                    text: `📣 This contact has been automatically removed from campaign "${campaignName}" because they replied`,
                    time: new Date().toISOString(),
                    is_automated: true,
                  },
                ]);
                
              if (systemMsgError) {
                console.error("❌ Error creating campaign opt-out notification message:", systemMsgError);
              } else {
                console.log("✅ Added notification about campaign opt-out");
              }
            } catch (systemError) {
              console.error("❌ Exception adding campaign opt-out message:", systemError);
            }
          }
        } else {
          console.log(`ℹ️ Contact has already replied to this campaign before`);
        }
      } else {
        console.log(`ℹ️ No related campaign found for this conversation`);
      }
    } catch (campaignCheckError) {
      console.error("❌ Error during campaign reply check:", campaignCheckError);
    }
    
    // Now handle STOPP message processing if needed
    if (isStoppMessage) {
      console.log(`🚫 Processing STOPP message: registering opt-out for ${from}`);
      
      // Register an opt-out
      const { error: optOutError } = await supabaseClient
        .from('bulk_sms_opt_outs')
        .insert({
          recipient_number: from,
          sender_phone_id: phoneNumber.id,
          reason: 'STOP_MESSAGE'
        })
        .select();
        
      if (optOutError) {
        console.error("❌ Error registering opt-out:", optOutError);
      } else {
        console.log(`✅ Successfully registered opt-out for ${from}`);
        
        // Add a system message notification about the opt-out
        try {
          const { data: systemMsg, error: systemMsgError } = await supabaseClient
            .from("messages")
            .insert([
              {
                conversation_id: conversation.id,
                sender: "them", // Use 'them' instead of 'system' for compatibility
                text: "⚠️ This contact has opted out of receiving bulk SMS by texting STOPP",
                time: new Date().toISOString(),
                is_automated: true,
              },
            ])
            .select();
            
          if (systemMsgError) {
            console.error("❌ Error creating system notification message:", systemMsgError);
          } else {
            console.log("✅ Added system notification about opt-out status:", systemMsg);
          }
        } catch (systemError) {
          console.error("❌ Exception adding system message:", systemError);
        }
      }
    }
    
    console.log(`🎉 SMS processing complete`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "SMS received and processed successfully",
        data: {
          from,
          to,
          message,
          external_id: id,
          conversation_id: conversation.id,
          message_id: newMessage[0]?.id,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
        stack: error.stack,
        message: "SMS received but encountered an error during processing"
      }),
      {
        status: 200, // Return 200 even on error to prevent 46elks from retrying
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});



