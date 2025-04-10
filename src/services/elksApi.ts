// Helper functions for interacting with 46elks API
import supabase from '../services/supabase';
import { recordSmsDeliveryStatus, updateSmsDeliveryStatus } from './supabase';

// API credentials
const API_USERNAME = 'a39194da10174dd9b9c96a53315263865';
const API_PASSWORD = '97E4DE9E73C9AA6A55EF2462A6B29B10';
const DEFAULT_SENDER = '+46766866251'; // Default number to send from

// Base URL for the 46elks API
const API_BASE_URL = 'https://api.46elks.com/a1';

// Supabase Edge Functions URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

// Delivery report webhook URL
const DELIVERY_REPORT_URL = `${EDGE_FUNCTION_URL}/delivery-reports`;

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

// Send SMS via Supabase Edge Function
export const sendSms = async (
  to: string, 
  message: string, 
  options?: { 
    from?: string,          // The database ID of the phone (used as 'from')
    actualPhoneNumber?: string, // The actual phone number (for reference only)
    flashsms?: boolean,
    whendelivered?: string,
    dryrun?: boolean,
    conversationId?: string,
    contactId?: string,
    dontSaveToConversation?: boolean,
    campaignId?: string,
    messageId?: string
  }
) => {
  try {
    console.log('Sending SMS via Supabase Edge Function');
    console.log('SMS details:', { 
      to, 
      message: message.substring(0, 30) + '...', 
      from: options?.from,
      actualPhoneNumber: options?.actualPhoneNumber
    });
    
    // Get the current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth session exists:', !!session);
    
    // Prepare the request data to send to our Edge Function
    const requestData = {
      to,
      message,
      from: options?.from || DEFAULT_SENDER,
      actualPhoneNumber: options?.actualPhoneNumber, // Include actual phone number for reference
      flashsms: options?.flashsms,
      whendelivered: options?.whendelivered || DELIVERY_REPORT_URL, // Default to our delivery webhook
      dryrun: options?.dryrun,
      conversationId: options?.conversationId,
      contactId: options?.contactId,
      dontSaveToConversation: options?.dontSaveToConversation,
      campaignId: options?.campaignId
    };

    console.log('Edge function request data:', JSON.stringify(requestData, (key, value) => 
      key === 'message' ? value.substring(0, 30) + '...' : value, 2));

    // Make the API request to our Edge Function with auth
    const url = `${EDGE_FUNCTION_URL}/send-sms`;
    console.log('Making request to edge function:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    console.log('Edge function response status:', response.status);

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
        console.error('Error response data:', errorData);
      } catch {
        errorText = await response.text();
        console.error('Error response text:', errorText);
      }
      throw new Error(`Failed to send SMS: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('SMS send success response:', JSON.stringify(responseData, null, 2));
    
    // If we have a message ID and the message was saved to the database, record the delivery status
    if (responseData.id && options?.messageId && !options.dryrun) {
      try {
        await recordSmsDeliveryStatus(
          options.messageId,
          responseData.id,
          to,
          options.campaignId,
          'pending'
        );
        console.log(`Recorded delivery status for message ${options.messageId}, external ID ${responseData.id}`);
      } catch (error) {
        console.error('Error recording delivery status:', error);
        // Don't fail the send operation if recording status fails
      }
    }
    
    return responseData;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Get SMS history
export const getSmsHistory = async (start?: string, end?: string) => {
  try {
    let url = `${API_BASE_URL}/SMS`;
    const params = new URLSearchParams();
    
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get SMS history: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting SMS history:', error);
    throw error;
  }
};

// Get a specific SMS by ID
export const getSmsById = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/SMS/${id}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get SMS with ID ${id}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting SMS with ID ${id}:`, error);
    throw error;
  }
};

// Configure webhook URLs for a virtual phone number
export const configurePhoneNumber = async (
  phoneNumber: string, 
  options: { 
    smsUrl?: string; 
    mmsUrl?: string; 
    voiceStart?: string;
    smsReplies?: boolean;
  }
) => {
  try {
    console.log('Configuring phone number via Supabase Edge Function');
    
    // Get the current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    
    // Create a configure-webhook edge function to handle this
    const requestData = {
      phoneNumber,
      smsUrl: options.smsUrl || `${SUPABASE_URL}/functions/v1/sms-webhook`,
      smsReplies: true
    };

    console.log('Webhook configuration request:', requestData);
    
    const response = await fetch(`${EDGE_FUNCTION_URL}/configure-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch {
        errorText = await response.text();
      }
      throw new Error(`Failed to configure webhook: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error configuring phone number:', error);
    throw error;
  }
};

// Estimate SMS cost and message parts
export const estimateSmsDetails = async (
  message: string, 
  to: string,
  from: string = DEFAULT_SENDER
) => {
  try {
    // Use the dryrun parameter to get cost estimation without sending
    const response = await sendSms(to, message, { from, dryrun: true });
    
    return {
      parts: response.parts || 1,
      estimatedCost: response.estimated_cost || 0,
    };
  } catch (error) {
    console.error('Error estimating SMS details:', error);
    throw error;
  }
};

// Calculate SMS metrics locally (without API call)
export const calculateSmsMetrics = (text: string) => {
  // Check if message contains non-GSM characters (simplified check)
  const hasUnicode = /[^\u0000-\u007F]/.test(text);
  
  // GSM 03.38 has 160 chars per SMS, Unicode has 70
  const charsPerSms = hasUnicode ? 70 : 160;
  
  // For concatenated SMS, the limit is slightly lower
  const charsPerConcatenatedSms = hasUnicode ? 67 : 153;
  
  const charCount = text.length;
  
  // Calculate number of SMS parts needed
  let smsCount = 0;
  if (charCount <= charsPerSms) {
    smsCount = 1;
  } else {
    smsCount = Math.ceil(charCount / charsPerConcatenatedSms);
  }
  
  // Assume 0.50 SEK per SMS part (this should be configurable in a real app)
  const costPerSms = 0.50;
  const cost = (smsCount * costPerSms).toFixed(2);
  
  return { charCount, smsCount, cost };
};

// Send a bulk SMS campaign
export const sendBulkSms = async (
  recipients: Array<{ to: string, message: string, recipient?: any }>,
  fromPhoneId: string,         // The database ID of the phone to use as 'from'
  actualPhoneNumber?: string,  // The actual phone number (for reference only)
  whendelivered?: string,
  campaignId?: string
) => {
  try {
    console.log(`Starting bulk SMS campaign to ${recipients.length} recipients using phone ID ${fromPhoneId}`);
    
    // Send messages in sequence
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (const recipient of recipients) {
      try {
        console.log(`Sending SMS to ${recipient.to}`);
        
        // Create a message in the database using the conversation ID
        let messageId;
        
        if (recipient.messageId) {
          messageId = recipient.messageId;
        }
        
        // Send the SMS with original line breaks preserved and delivery tracking
        const result = await sendSms(
          recipient.to, 
          recipient.message,
          { 
            from: fromPhoneId,
            actualPhoneNumber: actualPhoneNumber,
            whendelivered: whendelivered || DELIVERY_REPORT_URL,
            messageId: messageId,
            campaignId: campaignId
          }
        );
        
        results.push({ 
          ...result, 
          status: 'success', 
          to: recipient.to,
          messageId: messageId
        });
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to send SMS to ${recipient.to}:`, error);
        results.push({ 
          to: recipient.to, 
          status: 'failed', 
          error: error instanceof Error ? error.message : String(error) 
        });
        failCount++;
      }
    }
    
    console.log(`Bulk SMS campaign completed. Success: ${successCount}, Failed: ${failCount}`);
    return { results, summary: { total: recipients.length, success: successCount, failed: failCount } };
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

// Retry a failed message
export const retrySms = async (externalId: string) => {
  try {
    console.log(`Attempting to retry failed SMS with external ID: ${externalId}`);
    
    // Use the Supabase service to get message details and retry it
    const retryResult = await supabase.retryFailedMessage(externalId);
    
    return {
      success: true,
      newExternalId: retryResult.new_external_id,
      message: 'SMS retry has been scheduled'
    };
  } catch (error) {
    console.error('Error retrying SMS:', error);
    throw error;
  }
};

// Get delivery status for a message
export const getDeliveryStatus = async (externalId: string) => {
  try {
    console.log(`Getting delivery status for SMS: ${externalId}`);
    
    // First check in our local database
    const { data: deliveryStatus, error: dbError } = await supabase
      .from('sms_delivery_status')
      .select(`
        *,
        message:message_id(
          id,
          text,
          conversation_id,
          created_at
        )
      `)
      .eq('external_id', externalId)
      .single();
    
    if (dbError) {
      // If not found in our database, try to get it from the 46elks API
      const smsDetails = await getSmsById(externalId);
      
      return {
        external_id: smsDetails.id,
        status: smsDetails.status,
        to: smsDetails.to,
        from: smsDetails.from,
        delivered: smsDetails.delivered,
        created: smsDetails.created,
        source: '46elks'
      };
    }
    
    return {
      ...deliveryStatus,
      source: 'database'
    };
  } catch (error) {
    console.error('Error getting delivery status:', error);
    throw error;
  }
};