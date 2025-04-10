import { useState } from 'react';
import * as supabaseService from '../services/supabase';

export function useSupabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Phone Numbers
  const getPhoneNumbers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getPhoneNumbers();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const addPhoneNumber = async (number: string, device: string, isDefault: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.addPhoneNumber(number, device, isDefault);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const updatePhoneNumber = async (id: string, updates: { device?: string, is_default?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.updatePhoneNumber(id, updates);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Contacts
  const getContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getContacts();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const addContact = async (name: string, phoneNumber: string, avatar?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.addContact(name, phoneNumber, avatar);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const updateContact = async (id: string, updates: { name?: string, phone_number?: string, avatar?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.updateContact(id, updates);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const deleteContact = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.deleteContact(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const findContactByPhoneNumber = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.findContactByPhoneNumber(phoneNumber);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Conversations
  const getConversations = async (page: number = 1, page_size: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getConversations(page, page_size);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const getConversation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getConversation(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const findOrCreateConversation = async (contactId: string, phoneId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.findOrCreateConversation(contactId, phoneId);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const markConversationAsRead = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.markConversationAsRead(id);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Messages
  const getMessages = async (conversationId: string, options?: { forceRefresh?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getMessages(conversationId, options);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const addMessage = async (
    conversationId: string, 
    sender: 'me' | 'them', 
    text: string, 
    options?: { 
      status?: 'sent' | 'delivered' | 'read' | 'failed',
      isAutomated?: boolean,
      apiSource?: string,
      externalId?: string
    }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.addMessage(conversationId, sender, text, options);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Bulk Campaigns
  const getBulkCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getBulkCampaigns();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const addBulkCampaign = async (
    name: string, 
    template: string, 
    recipientCount: number, 
    phoneId: string,
    status: 'draft' | 'sending' | 'sent' | 'failed' = 'draft'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.addBulkCampaign(name, template, recipientCount, phoneId, status);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const updateBulkCampaignStatus = async (id: string, status: 'draft' | 'sending' | 'sent' | 'failed') => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.updateBulkCampaignStatus(id, status);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const updateBulkCampaignRecipientCount = async (id: string, additionalRecipients: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.updateBulkCampaignRecipientCount(id, additionalRecipients);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };
  
  const getCampaignReplies = async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getCampaignReplies(campaignId);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const checkOptOut = async (recipientNumber: string, senderPhoneId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const phoneIdStr = String(senderPhoneId); // Convert to string for consistency
      const result = await supabaseService.checkOptOut(recipientNumber, phoneIdStr);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };
  
  const registerOptOut = async (recipientNumber: string, senderPhoneId: string | number, reason: string = 'STOP_REQUEST') => {
    setLoading(true);
    setError(null);
    try {
      const phoneIdStr = String(senderPhoneId); // Convert to string for consistency
      const result = await supabaseService.registerOptOut(recipientNumber, phoneIdStr, reason);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  const getExcludedRecipients = async (campaignId: string, phoneId: string, recipientNumbers: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await supabaseService.getExcludedRecipients(campaignId, phoneId, recipientNumbers);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  // Add the removeOptOut function
  const removeOptOut = async (recipientNumber: string, senderPhoneId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const phoneIdStr = String(senderPhoneId); // Convert to string for consistency
      const result = await supabaseService.removeOptOut(recipientNumber, phoneIdStr);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    // Phone Numbers
    getPhoneNumbers,
    addPhoneNumber,
    updatePhoneNumber,
    // Contacts
    getContacts,
    addContact,
    updateContact,
    deleteContact,
    findContactByPhoneNumber,
    // Conversations
    getConversations,
    getConversation,
    findOrCreateConversation,
    markConversationAsRead,
    // Messages
    getMessages,
    addMessage,
    // Bulk Campaigns
    getBulkCampaigns,
    addBulkCampaign,
    updateBulkCampaignStatus,
    updateBulkCampaignRecipientCount,
    getCampaignReplies,
    checkOptOut,
    registerOptOut,
    removeOptOut,
    getExcludedRecipients,
  };
}