import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// These environment variables are set by default and injected by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize the Supabase client with realtime
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export default supabase;

// Helper functions for common database operations

// Phone Numbers
export const getPhoneNumbers = async () => {
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('*')
    .order('is_default', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addPhoneNumber = async (number: string, device: string, isDefault: boolean = false) => {
  const { data, error } = await supabase
    .from('phone_numbers')
    .insert([{ number, device, is_default: isDefault }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updatePhoneNumber = async (id: string, updates: { device?: string, is_default?: boolean }) => {
  const { data, error } = await supabase
    .from('phone_numbers')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deletePhoneNumber = async (id: string) => {
  const { error } = await supabase
    .from('phone_numbers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Contacts
export const getContacts = async () => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
};

export const addContact = async (name: string, phoneNumber: string, avatar?: string) => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([{ name, phone_number: phoneNumber, avatar }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateContact = async (id: string, updates: { name?: string, phone_number?: string, avatar?: string }) => {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteContact = async (id: string) => {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const findContactByPhoneNumber = async (phoneNumber: string) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Conversations
export const getConversations = async (page: number = 1, page_size: number = 50) => {
  // Calculate offset based on page number
  const offset = (page - 1) * page_size;
  
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      contact:contact_id(id, name, phone_number, avatar),
      phone:phone_id(id, number, device),
      messages:messages(id, is_bulk, bulk_campaign_id, bulk_campaign_name)
    `)
    .order('last_message_time', { ascending: false })
    .range(offset, offset + page_size - 1);
  
  if (error) throw error;
  
  // Process data to add bulk SMS information
  const processedData = data.map(conv => {
    // Check if any messages in this conversation are bulk messages
    const bulkMessages = conv.messages?.filter(msg => msg.is_bulk) || [];
    const isBulk = bulkMessages.length > 0;
    const bulkCampaignName = bulkMessages.length > 0 ? bulkMessages[0].bulk_campaign_name : null;
    const bulkCampaignId = bulkMessages.length > 0 ? bulkMessages[0].bulk_campaign_id : null;
    
    // Add bulk SMS flags to the conversation
    return {
      ...conv,
      is_bulk: isBulk,
      bulk_campaign_name: bulkCampaignName,
      bulk_campaign_id: bulkCampaignId,
      messages: undefined // Remove messages array to avoid sending too much data
    };
  });
  
  return processedData;
};

export const getConversation = async (id: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      contact:contact_id(id, name, phone_number, avatar),
      phone:phone_id(id, number, device)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const findOrCreateConversation = async (contactId: string, phoneId: string) => {
  // First try to find existing conversation
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .eq('phone_id', phoneId)
    .maybeSingle();
  
  if (findError) throw findError;
  
  // If found, return it
  if (existing) return existing;
  
  // Otherwise create a new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ contact_id: contactId, phone_id: phoneId }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createOrUpdateConversation = async ({ 
  contact, 
  phone_id, 
  message 
}: { 
  contact: { name: string; phone_number: string; avatar?: string; }; 
  phone_id: string; 
  message: string;
}) => {
  try {
    // First, find or create the contact
    let contactId;
    const existingContact = await findContactByPhoneNumber(contact.phone_number);
    
    if (existingContact) {
      contactId = existingContact.id;
    } else {
      // Create new contact
      const newContact = await addContact(
        contact.name || contact.phone_number,
        contact.phone_number,
        contact.avatar
      );
      contactId = newContact.id;
    }
    
    // Then find or create the conversation
    const conversation = await findOrCreateConversation(contactId, phone_id);
    
    // Update the conversation with the last message
    await supabase
      .from('conversations')
      .update({
        last_message: message,
        last_message_time: new Date().toISOString(),
        unread_count: 0 // Reset unread count since we're sending a message
      })
      .eq('id', conversation.id);
    
    return conversation;
  } catch (error) {
    console.error('Error in createOrUpdateConversation:', error);
    throw error;
  }
};

export const markConversationAsRead = async (id: string) => {
  // Log that we're marking the conversation as read for debugging
  console.log(`🔍 Marking conversation ${id} as read`);
  
  try {
    // First verify the current unread count
    const { data: currentConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('unread_count, last_message, last_message_time')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error(`❌ Error fetching conversation ${id}:`, fetchError);
      throw fetchError;
    }
    
    console.log(`Current unread count for conversation ${id}: ${currentConversation?.unread_count || 0}`);
    
    // Only update if unread count is greater than 0
    if (currentConversation && currentConversation.unread_count > 0) {
      const { data, error } = await supabase
        .from('conversations')
        .update({ 
          unread_count: 0,
          // Re-set these in case automated messages changed them
          last_message: currentConversation.last_message,
          last_message_time: currentConversation.last_message_time
        })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`❌ Error updating conversation ${id}:`, error);
        throw error;
      }
      
      console.log(`✅ Successfully marked conversation ${id} as read`);
      return data[0];
    } else {
      console.log(`ℹ️ Conversation ${id} already has unread_count of 0, no update needed`);
      return currentConversation;
    }
  } catch (error) {
    console.error(`❌ Exception in markConversationAsRead for ${id}:`, error);
    throw error;
  }
};

// Messages
export const getMessages = async (conversationId: string, options?: { forceRefresh?: number }) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      bulk_campaign:bulk_campaign_id(id, name, created_at)
    `)
    .eq('conversation_id', conversationId)
    .order('time');
  
  if (error) throw error;
  
  // Process data to enhance bulk messages with campaign info
  return data.map(msg => {
    // Check if this is a bulk message
    const isBulk = !!msg.bulk_campaign_id || msg.is_bulk;
    
    // If it's a bulk message, format the campaign info for the UI
    let bulkCampaign = null;
    if (isBulk) {
      if (msg.bulk_campaign) {
        // We have a proper campaign reference
        bulkCampaign = {
          id: msg.bulk_campaign.id,
          name: msg.bulk_campaign.name,
          date: msg.bulk_campaign.created_at
        };
      } else if (msg.bulk_campaign_name) {
        // Only have the name, but missing ID
        bulkCampaign = {
          id: msg.bulk_campaign_id || 'unknown',
          name: msg.bulk_campaign_name,
          date: msg.created_at || msg.time
        };
      }
    }
    
    return {
      ...msg,
      bulk_campaign_name: msg.bulk_campaign?.name || msg.bulk_campaign_name || null,
      is_bulk: isBulk,
      bulk_campaign: bulkCampaign
    };
  });
};

export const addMessage = async (
  conversationId: string, 
  sender: 'me' | 'them', 
  text: string, 
  options?: { 
    status?: 'sent' | 'delivered' | 'read' | 'failed',
    isAutomated?: boolean,
    apiSource?: string,
    externalId?: string,
    bulk_campaign_id?: string,
    is_bulk?: boolean,
    bulk_campaign_name?: string
  }
) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ 
      conversation_id: conversationId, 
      sender, 
      text, 
      status: options?.status,
      is_automated: options?.isAutomated || false,
      api_source: options?.apiSource,
      external_id: options?.externalId,
      bulk_campaign_id: options?.bulk_campaign_id,
      is_bulk: options?.is_bulk || false,
      bulk_campaign_name: options?.bulk_campaign_name
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Bulk Campaigns
export const getBulkCampaigns = async () => {
  const { data, error } = await supabase
    .from('bulk_campaigns')
    .select(`
      *,
      phone:phone_id(id, number, device)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getBulkCampaignDetails = async (campaignId: string) => {
  // First get the campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('bulk_campaigns')
    .select(`
      *,
      phone:phone_id(id, number, device)
    `)
    .eq('id', campaignId)
    .single();
  
  if (campaignError) throw campaignError;
  
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  // Get all messages that are part of this campaign
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      id,
      text,
      time,
      status,
      conversation_id,
      conversation:conversation_id(
        id,
        contact_id,
        contact:contact_id(id, name, phone_number, avatar)
      )
    `)
    .eq('bulk_campaign_id', campaignId)
    .order('time');
  
  if (messagesError) throw messagesError;
  
  // Group messages by recipient for better display
  const recipients = messages.reduce((acc: any[], message: any) => {
    // Get contact details if available
    const contact = message.conversation?.contact || null;
    const conversationId = message.conversation_id;
    
    // Check if we already have this recipient in our list
    const existingRecipient = acc.find(r => r.conversation_id === conversationId);
    
    if (existingRecipient) {
      // Add this message to the existing recipient
      existingRecipient.messages.push({
        id: message.id,
        text: message.text,
        time: message.time,
        status: message.status
      });
    } else {
      // Create a new recipient entry
      acc.push({
        conversation_id: conversationId,
        phone_number: contact?.phone_number || 'Unknown',
        name: contact?.name || null,
        contact_id: contact?.id || null,
        messages: [{
          id: message.id,
          text: message.text,
          time: message.time,
          status: message.status
        }]
      });
    }
    
    return acc;
  }, []);
  
  return {
    campaign,
    recipients,
    totalRecipients: recipients.length,
    totalMessages: messages.length
  };
};

export const addBulkCampaign = async (
  name: string, 
  template: string, 
  recipientCount: number, 
  phoneId: string,
  status: 'draft' | 'sending' | 'sent' | 'failed' = 'draft'
) => {
  const { data, error } = await supabase
    .from('bulk_campaigns')
    .insert([{ name, template, recipient_count: recipientCount, phone_id: phoneId, status }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateBulkCampaignStatus = async (id: string, status: 'draft' | 'sending' | 'sent' | 'failed') => {
  const updates: any = { status };
  
  // If marking as sent, also set the sent_at timestamp
  if (status === 'sent') {
    updates.sent_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('bulk_campaigns')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateBulkCampaignRecipientCount = async (id: string, additionalRecipients: number) => {
  // First get the current recipient count
  const { data: campaign, error: getError } = await supabase
    .from('bulk_campaigns')
    .select('recipient_count')
    .eq('id', id)
    .single();
  
  if (getError) throw getError;
  
  // Calculate the new recipient count
  const newCount = (campaign.recipient_count || 0) + additionalRecipients;
  
  // Update the campaign with the new count
  const { data, error } = await supabase
    .from('bulk_campaigns')
    .update({ recipient_count: newCount })
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

// Get recipients who have replied to a campaign
export const getCampaignReplies = async (campaignId: string) => {
  // First get all the campaign messages
  const { data: campaignMessages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      created_at,
      conversation:conversation_id(
        contact_id,
        phone_id,
        contact:contact_id(phone_number)
      )
    `)
    .eq('bulk_campaign_id', campaignId)
    .order('created_at');
  
  if (messagesError) throw messagesError;
  
  // Create a list of conversations and message timestamps
  const campaignConversations = new Map();
  
  campaignMessages.forEach(message => {
    const convoId = message.conversation_id;
    const contactPhoneNumber = message.conversation?.contact?.phone_number;
    const timestamp = message.created_at;
    
    if (contactPhoneNumber) {
      campaignConversations.set(convoId, {
        phoneNumber: contactPhoneNumber,
        timestamp,
        conversationId: convoId,
        phoneId: message.conversation.phone_id
      });
    }
  });
  
  // Now check if any of these conversations have replies after the campaign message
  const replies = [];
  
  for (const [convoId, data] of campaignConversations.entries()) {
    const { data: conversationMessages, error: convoError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .eq('sender', 'them') // Only incoming messages
      .gt('created_at', data.timestamp) // Only messages after the campaign message
      .order('created_at');
    
    if (convoError) throw convoError;
    
    if (conversationMessages && conversationMessages.length > 0) {
      // This conversation has replies
      replies.push({
        phoneNumber: data.phoneNumber,
        conversationId: convoId,
        phoneId: data.phoneId,
        hasOptedOut: conversationMessages.some(msg => 
          msg.text.toUpperCase().includes('STOPP') || 
          msg.text.toUpperCase().includes('STOP')
        ),
        replies: conversationMessages
      });
    }
  }
  
  return replies;
};

// Check if a number has opted out of receiving bulk SMS from a specific phone
export const checkOptOut = async (recipientNumber: string, senderPhoneId: string | number) => {
  const phoneIdStr = String(senderPhoneId); // Ensure we have a string
  
  const { data, error } = await supabase
    .from('bulk_sms_opt_outs')
    .select('*')
    .eq('recipient_number', recipientNumber)
    .eq('sender_phone_id', phoneIdStr);
  
  if (error) throw error;
  
  return {
    isOptedOut: data && data.length > 0,
    optOutData: data && data.length > 0 ? data[0] : null
  };
};

// Register an opt-out for a recipient
export const registerOptOut = async (recipientNumber: string, senderPhoneId: string | number, reason: string = 'STOP_REQUEST') => {
  const phoneIdStr = String(senderPhoneId); // Ensure we have a string
  
  // Check if already opted out
  const { isOptedOut } = await checkOptOut(recipientNumber, phoneIdStr);
  
  if (isOptedOut) {
    return { alreadyOptedOut: true };
  }
  
  const { data, error } = await supabase
    .from('bulk_sms_opt_outs')
    .insert([{ 
      recipient_number: recipientNumber, 
      sender_phone_id: phoneIdStr, 
      reason: reason 
    }])
    .select();
  
  if (error) throw error;
  return { success: true, data: data[0] };
};

// SMS Delivery Tracking
export const recordSmsDeliveryStatus = async (
  messageId: string,
  externalId: string,
  recipientNumber: string,
  campaignId?: string,
  initialStatus: 'pending' | 'sent' | 'delivered' | 'failed' = 'pending'
) => {
  const { data, error } = await supabase
    .from('sms_delivery_status')
    .insert([{
      message_id: messageId,
      external_id: externalId,
      recipient_number: recipientNumber,
      campaign_id: campaignId,
      status: initialStatus
    }])
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get complete campaign message status details
export const getCampaignMessageStatus = async (campaignId: string) => {
  try {
    // First get the campaign details directly to access the recipient_count
    const { data: campaign, error: campaignError } = await supabase
      .from('bulk_campaigns')
      .select('recipient_count, phone_id')
      .eq('id', campaignId)
      .single();
      
    if (campaignError) throw campaignError;
    
    // Store the recipient count from the campaign record
    const campaignRecipientCount = campaign?.recipient_count || 0;
    const campaignPhoneId = campaign?.phone_id;
  
    // Query messages with their conversation and contact info
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        text,
        status,
        external_id,
        created_at,
        conversation:conversation_id (
          id,
          contact:contact_id (
            id,
            name,
            phone_number
          )
        )
      `)
      .eq('bulk_campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    // Try to get delivery statuses - handle case where table doesn't exist yet
    let deliveryStatuses = [];
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('sms_delivery_status')
        .select('*')
        .eq('campaign_id', campaignId);

      if (!statusError) {
        deliveryStatuses = statusData || [];
      } else {
        console.warn('Could not fetch delivery statuses, continuing without them:', statusError);
      }
    } catch (statusErr) {
      console.warn('Error fetching delivery statuses, continuing without them:', statusErr);
      // Continue without delivery statuses
    }

    // Try to get permanently failed numbers - handle case where table doesn't exist yet
    let failedNumbers = [];
    try {
      const { data: failedData, error: failedError } = await supabase
        .from('campaign_failed_numbers')
        .select('*')
        .eq('campaign_id', campaignId);

      if (!failedError) {
        failedNumbers = failedData || [];
      } else {
        console.warn('Could not fetch failed numbers, continuing without them:', failedError);
      }
    } catch (failedErr) {
      console.warn('Error fetching failed numbers, continuing without them:', failedErr);
      // Continue without failed numbers data
    }

    // Create a map of delivery statuses by message ID for quicker lookups
    const statusMap = new Map();
    deliveryStatuses?.forEach(status => {
      statusMap.set(status.message_id, status);
    });

    // Create a set of failed numbers for quick lookups
    const failedNumbersSet = new Set(failedNumbers?.map(failed => failed.recipient_number) || []);

    // Process the messages into a more usable structure
    const recipients = messages.reduce((acc, message) => {
      const phoneNumber = message.conversation?.contact?.phone_number;
      if (!phoneNumber) return acc;

      // Determine the message status
      let statusInfo = {
        status: message.status || 'unknown',
        extendedStatus: message.status || 'unknown'
      };

      // If we have delivery status info, use that
      const deliveryStatus = message.external_id ? 
        deliveryStatuses?.find(s => s.external_id === message.external_id) : 
        statusMap.get(message.id);

      if (deliveryStatus) {
        statusInfo.extendedStatus = deliveryStatus.status;
      }

      // Check if this number is in the permanently failed list
      const isPermanentlyFailed = failedNumbersSet.has(phoneNumber);
      if (isPermanentlyFailed) {
        statusInfo.extendedStatus = 'permanently_failed';
      }

      // Find or create the recipient entry
      if (acc[phoneNumber]) {
        acc[phoneNumber].messages.push({
          id: message.id,
          text: message.text,
          status: statusInfo.status,
          extendedStatus: statusInfo.extendedStatus,
          timestamp: message.created_at
        });
      } else {
        acc[phoneNumber] = {
          phoneNumber,
          name: message.conversation?.contact?.name || '',
          conversationId: message.conversation?.id,
          contactId: message.conversation?.contact?.id,
          messages: [{
            id: message.id,
            text: message.text,
            status: statusInfo.status,
            extendedStatus: statusInfo.extendedStatus,
            timestamp: message.created_at
          }]
        };
      }

      return acc;
    }, {});

    // Convert the recipients object to an array
    const recipientsList = Object.values(recipients);
    
    // If we don't have any recipients from messages but the campaign has a recipient count,
    // create synthetic recipient entries based on the campaign's recipient count
    if (recipientsList.length === 0 && campaignRecipientCount > 0) {
      // Get all conversations for this campaign's phone ID
      const { data: conversations, error: convoError } = await supabase
        .from('conversations')
        .select(`
          id,
          contact:contact_id (
            id,
            name,
            phone_number
          )
        `)
        .eq('phone_id', campaignPhoneId)
        .not('contact_id', 'is', null)
        .limit(campaignRecipientCount);
      
      if (!convoError && conversations && conversations.length > 0) {
        for (let i = 0; i < Math.min(campaignRecipientCount, conversations.length); i++) {
          const conversation = conversations[i];
          const contact = conversation?.contact;
          if (contact?.phone_number) {
            recipientsList.push({
              phoneNumber: contact.phone_number,
              name: contact.name || '',
              conversationId: conversation.id,
              contactId: contact.id,
              messages: []
            });
          }
        }
      }
    }

    return {
      recipients: recipientsList,
      totalRecipients: recipientsList.length > 0 ? recipientsList.length : campaignRecipientCount,
      failedNumbers: failedNumbers || [],
      stats: {
        delivered: messages.filter(m => m.status === 'delivered').length,
        sent: messages.filter(m => m.status === 'sent').length,
        failed: messages.filter(m => m.status === 'failed').length + (failedNumbers?.length || 0),
        total: messages.length || campaignRecipientCount
      }
    };
  } catch (error) {
    console.error('Error fetching campaign message status:', error);
    
    // Try to get just the campaign details for the recipient count
    try {
      const { data: campaign } = await supabase
        .from('bulk_campaigns')
        .select('recipient_count')
        .eq('id', campaignId)
        .single();
      
      const recipientCount = campaign?.recipient_count || 0;
      
      // Even if message fetch failed, return the campaign's recipient count
      return {
        recipients: [],
        totalRecipients: recipientCount,
        failedNumbers: [],
        stats: {
          delivered: 0,
          sent: 0,
          failed: 0,
          total: recipientCount
        }
      };
    } catch (innerError) {
      console.error('Error getting campaign recipient count:', innerError);
      
      // If everything fails, return empty result
      return {
        recipients: [],
        totalRecipients: 0,
        failedNumbers: [],
        stats: {
          delivered: 0,
          sent: 0,
          failed: 0,
          total: 0
        }
      };
    }
  }
};

export const updateSmsDeliveryStatus = async (
  externalId: string,
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'retry_failed',
  errorMessage?: string
) => {
  // First get the current record to check retry count
  const { data: current, error: fetchError } = await supabase
    .from('sms_delivery_status')
    .select('*')
    .eq('external_id', externalId)
    .single();
    
  if (fetchError) throw fetchError;
  
  // For failures, handle retry logic
  let updatedStatus = status;
  let retryCount = current.retry_count;
  
  if (status === 'failed') {
    // Increment retry count
    retryCount += 1;
    
    // If retry count exceeds max (1), mark as permanently failed
    if (retryCount > 1) {
      updatedStatus = 'retry_failed';
    } else {
      // Otherwise, keep as failed for retry
      updatedStatus = 'failed';
    }
  }
  
  // Update the record
  const { data, error } = await supabase
    .from('sms_delivery_status')
    .update({ 
      status: updatedStatus,
      retry_count: retryCount,
      error_message: errorMessage,
      last_status_change: new Date().toISOString()
    })
    .eq('external_id', externalId)
    .select();
    
  if (error) throw error;
  return data[0];
};

export const retryFailedMessage = async (externalId: string) => {
  try {
    // Get the delivery status record
    const { data: delivery, error: fetchError } = await supabase
      .from('sms_delivery_status')
      .select(`
        *,
        message:message_id(
          conversation_id,
          text
        )
      `)
      .eq('external_id', externalId)
      .eq('status', 'failed')
      .single();
      
    if (fetchError) throw fetchError;
    
    // Only retry if this is the first failure
    if (delivery.retry_count > 1) {
      throw new Error('Message already retried the maximum number of times');
    }
    
    // Get the conversation to find the phone number to use
    const { data: conversation, error: convoError } = await supabase
      .from('conversations')
      .select(`
        *,
        contact:contact_id(phone_number)
      `)
      .eq('id', delivery.message.conversation_id)
      .single();
      
    if (convoError) throw convoError;
    
    // Use the ElksApi service to resend the message
    // This would be implemented in your actual code
    // const result = await elksApi.sendSms(
    //   conversation.contact.phone_number,
    //   delivery.message.text,
    //   { from: conversation.phone_id }
    // );
    
    // For now, we'll simulate this with a placeholder
    const mockResult = {
      id: `retry_${externalId}`,
      status: 'sent'
    };
    
    // Update the delivery status with the new external ID for the retry
    await supabase
      .from('sms_delivery_status')
      .update({
        external_id: mockResult.id,
        status: 'pending',
        retry_count: delivery.retry_count + 1,
        last_status_change: new Date().toISOString()
      })
      .eq('id', delivery.id);
      
    return {
      success: true,
      new_external_id: mockResult.id
    };
  } catch (error) {
    console.error('Error retrying failed message:', error);
    throw error;
  }
};

export const getCampaignFailedNumbers = async (campaignId: string) => {
  const { data, error } = await supabase
    .from('campaign_failed_numbers')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const addFailedNumberToCampaign = async (campaignId: string, recipientNumber: string, reason: string) => {
  const { data, error } = await supabase
    .from('campaign_failed_numbers')
    .insert([{
      campaign_id: campaignId,
      recipient_number: recipientNumber,
      reason
    }])
    .select();
    
  if (error) throw error;
  return data[0];
};

export const getCampaignDeliveryStats = async (campaignId: string) => {
  // Get stats grouped by status
  const { data, error } = await supabase
    .rpc('get_campaign_delivery_stats', { campaign_uuid: campaignId });
    
  if (error) throw error;
  
  // Format the stats for easier use
  const stats = {
    total: 0,
    pending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    retry_failed: 0
  };
  
  data.forEach((item: any) => {
    stats[item.status] = item.count;
    stats.total += item.count;
  });
  
  return stats;
};

// Update the getExcludedRecipients function to also check for failed numbers
export const getExcludedRecipients = async (campaignId: string, phoneId: string, recipientNumbers: string[]) => {
  // Get recipients who have replied to this campaign
  const campaignReplies = await getCampaignReplies(campaignId);
  
  // Get all opt-outs for this phone number
  const { data: optOuts, error: optOutError } = await supabase
    .from('bulk_sms_opt_outs')
    .select('*')
    .eq('sender_phone_id', phoneId);
  
  if (optOutError) throw optOutError;
  
  // Get all failed numbers for this campaign
  const { data: failedNumbers, error: failedError } = await supabase
    .from('campaign_failed_numbers')
    .select('*')
    .eq('campaign_id', campaignId);
    
  if (failedError) throw failedError;
  
  // Create maps for quick lookups
  const replyMap = new Map();
  campaignReplies.forEach(reply => {
    replyMap.set(reply.phoneNumber, {
      reason: 'replied',
      hasOptedOut: reply.hasOptedOut,
      conversationId: reply.conversationId
    });
  });
  
  const optOutMap = new Map();
  optOuts.forEach(optOut => {
    optOutMap.set(optOut.recipient_number, {
      reason: optOut.reason,
      created_at: optOut.created_at
    });
  });
  
  const failedMap = new Map();
  failedNumbers.forEach(failed => {
    failedMap.set(failed.recipient_number, {
      reason: failed.reason,
      created_at: failed.created_at
    });
  });
  
  // Check each recipient
  const excludedRecipients = recipientNumbers.map(number => {
    const normalizedNumber = number.trim();
    
    // Check if number has failed delivery
    if (failedMap.has(normalizedNumber)) {
      return {
        phoneNumber: normalizedNumber,
        excluded: true,
        reason: 'delivery_failed',
        details: failedMap.get(normalizedNumber)
      };
    }
    
    // Check if number has opted out
    if (optOutMap.has(normalizedNumber)) {
      return {
        phoneNumber: normalizedNumber,
        excluded: true,
        reason: 'opted_out',
        details: optOutMap.get(normalizedNumber)
      };
    }
    
    // Check if number has replied
    if (replyMap.has(normalizedNumber)) {
      const replyData = replyMap.get(normalizedNumber);
      
      // If they replied with STOPP, register an opt-out automatically
      if (replyData.hasOptedOut && !optOutMap.has(normalizedNumber)) {
        registerOptOut(normalizedNumber, phoneId, 'STOP_REPLY');
      }
      
      return {
        phoneNumber: normalizedNumber,
        excluded: true,
        reason: replyData.hasOptedOut ? 'opted_out_via_reply' : 'replied',
        details: replyData
      };
    }
    
    return {
      phoneNumber: normalizedNumber,
      excluded: false
    };
  });
  
  // Calculate statistics
  const stats = {
    total: recipientNumbers.length,
    excluded: excludedRecipients.filter(r => r.excluded).length,
    eligible: recipientNumbers.length - excludedRecipients.filter(r => r.excluded).length,
    byReason: {
      replied: excludedRecipients.filter(r => r.reason === 'replied').length,
      opted_out: excludedRecipients.filter(r => r.reason === 'opted_out' || r.reason === 'opted_out_via_reply').length,
      delivery_failed: excludedRecipients.filter(r => r.reason === 'delivery_failed').length
    }
  };
  
  return {
    excludedRecipients,
    stats
  };
};

// Todos
export const getTodos = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const addTodo = async ({
  conversationId,
  messageId,
  content,
  priority,
  dueDate
}: {
  conversationId: string;
  messageId?: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}) => {
  const { data, error } = await supabase
    .from('todos')
    .insert([{
      conversation_id: conversationId,
      message_id: messageId,
      content,
      priority,
      due_date: dueDate
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateTodo = async (
  id: string,
  updates: {
    content?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }
) => {
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteTodo = async (id: string) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Remove an opt-out for a recipient
export const removeOptOut = async (recipientNumber: string, senderPhoneId: string | number) => {
  const phoneIdStr = String(senderPhoneId); // Ensure we have a string
  
  const { data, error } = await supabase
    .from('bulk_sms_opt_outs')
    .delete()
    .eq('recipient_number', recipientNumber)
    .eq('sender_phone_id', phoneIdStr);
  
  if (error) throw error;
  return { success: true };
};