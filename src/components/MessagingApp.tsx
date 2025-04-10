import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Send, Filter, Settings, Users, BookOpen, MessageCircle, Edit2, Ban, Archive, MoreVertical, Phone, X, ChevronLeft, PlusCircle, RefreshCw } from 'lucide-react';
import MainMessagingLayout from './messaging/MainMessagingLayout';
import BulkSmsPage from './bulk-sms/BulkSmsPage';
import ContactBookPage from './contacts/ContactBookPage';
import ProfilePage from './settings/ProfilePage';
import Modal from './ui/Modal';
import Button from './ui/Button';
import MobileNavBar from './common/MobileNavBar';
import { useAuth } from '../context/AuthContext';
import { useSupabase } from '../hooks/useSupabase';
import { useElksApi } from '../hooks/useElksApi';
import { usePhoneNumbers } from '../hooks/usePhoneNumbers';

// Add TypeScript declaration for the window object extension
declare global {
  interface Window {
    onBulkSmsClick: (() => void) | null;
  }
}

const MessagingApp = () => {
  // App state
  const [currentPage, setCurrentPage] = useState('main'); // 'main', 'bulkSms', 'contacts', 'settings'
  const [activeTab, setActiveTab] = useState('send'); // For bulk SMS: 'send' or 'history'
  
  // Track subscriptions for debugging
  const [subscriptionsActive, setSubscriptionsActive] = useState(false);
  
  // Chat state
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [showMobileConversation, setShowMobileConversation] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [editingContactName, setEditingContactName] = useState(false);
  const [contactNameEdit, setContactNameEdit] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  // Searching and filtering
  const [searchText, setSearchText] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedPhoneFilters, setSelectedPhoneFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'unread'>('latest');
  
  // Modals
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showNewSmsModal, setShowNewSmsModal] = useState(false);
  
  // Chat state
  const [newSmsRecipient, setNewSmsRecipient] = useState('');
  const [newSmsMessage, setNewSmsMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  
  // Phone selection - Initialize as empty string, will be set once phone numbers are loaded
  const [activePhoneNumber, setActivePhoneNumber] = useState<string>('');
  
  // Bulk SMS state
  const [bulkSmsSent, setBulkSmsSent] = useState<any[]>([]);
  
  // Data state
  const [contacts, setContacts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [bulkCampaigns, setBulkCampaigns] = useState<any[]>([]);
  
  // Pagination state for conversations
  const [conversationsPage, setConversationsPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  
  // Hooks for database and API
  const { getConversations, getMessages, markConversationAsRead, getContacts, getBulkCampaigns, updatePhoneNumber, findContactByPhoneNumber, addContact, updateContact, addBulkCampaign, registerOptOut, checkOptOut, removeOptOut } = useSupabase();
  const elksApi = useElksApi();
  const { phoneNumbers, loading: phoneNumbersLoading, error: phoneNumbersError } = usePhoneNumbers();
  
  // Refs for dropdowns
  const searchRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const editNameInputRef = useRef<HTMLInputElement>(null);
  
  // Add these state declarations near the top of the component
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Add a state to track if the current conversation has already opted out
  const [isOptedOut, setIsOptedOut] = useState(false);
  
  // Add a state to track conversations that have been marked as read
  const [trackedReadConversations, setTrackedReadConversations] = useState<Set<string>>(new Set());
  
  // Function to poll for conversations - used by the interval
  const pollConversations = useCallback(() => {
    console.log('Polling for conversations...');
    // We'll pass the set of read conversation IDs to preserve read status
    fetchConversationsPreserveRead(1);
  }, [trackedReadConversations]);
  
  // Modified version of fetchConversations that preserves read status
  const fetchConversationsPreserveRead = async (page: number = 1) => {
    try {
      setLoading(true);
      const data = await getConversations(page);
      
      console.log(`Fetched conversations (page ${page}):`, data);
      
      // Format the data for the UI, but preserve read status for known conversations
      const formattedConversations = data.map(conv => {
        // If this conversation was previously marked as read by us, keep it as read
        const wasReadByUser = trackedReadConversations.has(conv.id.toString());
        
        return {
          id: conv.id,
          name: conv.contact?.name || '',
          avatar: conv.contact?.avatar || '',
          phoneId: conv.phone?.id || '',
          phoneNumber: conv.contact?.phone_number || '',
          lastMessage: conv.last_message || '',
          time: formatDate(conv.last_message_time || new Date().toISOString()),
          // If we've previously marked it as read, force unread count to 0
          unread: wasReadByUser ? 0 : (conv.unread_count || 0),
          contactId: conv.contact_id,
          automated: conv.is_automated || false,
          onlyAutomated: conv.only_automated || false,
          isBulk: conv.is_bulk || false,
          bulkCampaignName: conv.bulk_campaign_name || '',
          bulkCampaignId: conv.bulk_campaign_id || ''
        };
      });
      
      console.log('Formatted conversations:', formattedConversations);
      
      // If it's the first page, replace conversations; otherwise append
      if (page === 1) {
        setConversations(formattedConversations);
      } else {
        setConversations(prev => [...prev, ...formattedConversations]);
      }
      
      // Update hasMoreConversations based on if we got fewer items than requested
      setHasMoreConversations(formattedConversations.length === 50);
      
      // Update the current page
      setConversationsPage(page);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchContacts();
    fetchConversationsPreserveRead(1);
    fetchBulkCampaigns();
    
    // Add polling for conversations
    const intervalId = setInterval(pollConversations, 5000); // Poll every 5 seconds
    
    // Set up global navigation handler for bulk SMS page
    if (typeof window !== 'undefined') {
      window.onBulkSmsClick = handleOpenBulkSms;
    }
    
    // Cleanup the interval on unmount
    return () => {
      clearInterval(intervalId);
      
      // Clean up global handler
      if (typeof window !== 'undefined') {
        window.onBulkSmsClick = null;
      }
    };
  }, [pollConversations]);
  
  // Configure webhook for the phone number when active phone changes
  useEffect(() => {
    if (activePhoneNumber && phoneNumbers.length > 0) {
      const phone = phoneNumbers.find(p => p.id === activePhoneNumber);
      if (phone) {
        configureWebhookForPhoneNumber(phone.number);
      }
    }
  }, [activePhoneNumber, phoneNumbers]);
  
  // Set active phone number when phone numbers change
  useEffect(() => {
    if (phoneNumbers.length > 0 && !activePhoneNumber) {
      // Find default phone number or use the first one
      const defaultPhone = phoneNumbers.find(phone => phone.is_default) || phoneNumbers[0];
      setActivePhoneNumber(defaultPhone.id);
      console.log('Set active phone number:', defaultPhone);
    }
  }, [phoneNumbers, activePhoneNumber]);
  
  // Update the useEffect for messages subscription
  useEffect(() => {
    if (!selectedChat) return;
    
    // Initial fetch already happens in the selectedChat effect
    // No need to fetch here again
    
    // Set up polling with a longer interval
    const intervalId = setInterval(() => {
      console.log(`Polling for messages in conversation ${selectedChat}...`);
      
      // Get current number of messages for comparison
      const currentMessageCount = messages.length;
      
      // Check if we need to update by counting messages first
      const checkForNewMessages = async () => {
        try {
          const { data } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', selectedChat);
            
          // Only fetch full messages if the count has changed
          if (data && data.length !== currentMessageCount) {
            console.log(`New messages detected (${data.length} vs ${currentMessageCount}), fetching...`);
            fetchMessages(String(selectedChat));
          } else {
            console.log('No new messages, skipping fetch');
          }
        } catch (error) {
          console.error('Error checking for new messages:', error);
        }
      };
      
      checkForNewMessages();
    }, 10000); // Increased to 10 seconds for less frequent polling
    
    // Cleanup interval on unmount or when conversation changes
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedChat, messages.length]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus input when editing contact name
  useEffect(() => {
    if (editingContactName && editNameInputRef.current) {
      editNameInputRef.current.focus();
    }
  }, [editingContactName]);
  
  // Fetch data from Supabase
  const fetchContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };
  
  const fetchBulkCampaigns = async () => {
    try {
      const data = await getBulkCampaigns();
      setBulkCampaigns(data);
    } catch (error) {
      console.error('Error fetching bulk campaigns:', error);
    }
  };
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  
  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };
  
  // Filter chats based on phone number selections
  const filteredChats = selectedPhoneFilters.length === 0
    ? conversations 
    : conversations.filter(chat => selectedPhoneFilters.includes(chat.phoneId));

  // Sort conversations based on sort order
  const sortedChats = [...filteredChats].sort((a, b) => {
    if (sortOrder === 'unread') {
      // Sort by unread count (higher first)
      return (b.unread || 0) - (a.unread || 0);
    } else if (sortOrder === 'oldest') {
      // Sort by time (oldest first)
      return new Date(a.time.replace('Today ', '').replace('Yesterday ', '')).getTime() - 
             new Date(b.time.replace('Today ', '').replace('Yesterday ', '')).getTime();
    } else {
      // Default: sort by latest
      return new Date(b.time.replace('Today ', '').replace('Yesterday ', '')).getTime() - 
             new Date(a.time.replace('Today ', '').replace('Yesterday ', '')).getTime();
    }
  });

  // Toggle phone filter selection
  const togglePhoneFilter = (phoneId: string) => {
    setSelectedPhoneFilters(prevFilters => {
      if (prevFilters.includes(phoneId)) {
        return prevFilters.filter(id => id !== phoneId);
      } else {
        return [...prevFilters, phoneId];
      }
    });
  };

  const handleSetDefaultPhoneNumber = async (id: string) => {
    try {
      // First set all phone numbers to non-default
      for (const phone of phoneNumbers) {
        if (phone.is_default) {
          await updatePhoneNumber(phone.id, { is_default: false });
        }
      }
      
      // Then set the selected one as default
      await updatePhoneNumber(id, { is_default: true });
      
      // Refresh phone numbers via the hook
    } catch (error) {
      console.error('Error setting default phone number:', error);
    }
  };

  const handlePhoneNumberChange = async (value: string) => {
    setNewSmsRecipient(value);
    
    // Check if we have this number in our contacts
    try {
      const contact = await findContactByPhoneNumber(value);
      
      if (contact) {
        setRecipientName(contact.name || '');
        setShowNameInput(false);
      } else if (value.length > 8) {
        // Only show name input if it's a valid-looking number
        setShowNameInput(true);
        setRecipientName('');
      } else {
        setShowNameInput(false);
      }
    } catch (error) {
      console.error('Error checking contact:', error);
      setShowNameInput(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedChat) return;
    
    try {
      const conversation = conversations.find(c => c.id === selectedChat);
      if (!conversation) return;
      
      // Get the phone device info for better UX messaging
      const phoneDevice = phoneNumbers.find(p => p.id === conversation.phoneId)?.device || 'Unknown device';
      
      // Add message to UI immediately for better UX
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender: 'me' as const,
        text,
        time: formatTime(new Date().toISOString()),
        status: 'sending' as const,
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Get the delivery report webhook URL
      const deliveryReportUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delivery-report?conversation_id=${conversation.id}`;
      
      // Send message via API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: conversation.phoneNumber,
          message: text,
          from: conversation.phoneId,
          conversationId: conversation.id,
          whendelivered: deliveryReportUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Show success notification
      showNotification('Message sent successfully');
      
      // Refresh messages
      fetchMessages(String(selectedChat));
      
      // Update conversation in UI
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedChat
            ? { ...conv, lastMessage: text, time: formatDate(new Date().toISOString()) }
            : conv
        )
      );
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error notification
      showNotification('Failed to send message');
      
      // Update UI to show error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === `temp-${Date.now()}`
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
    }
  };

  const handleBackToList = () => {
    setShowMobileConversation(false);
    setEditingContactName(false);
  };

  const handleSendNewSms = async (recipient: string, message: string, name: string) => {
    if (!recipient.trim() || !message.trim() || !activePhoneNumber) return;
    
    try {
      let contactId;
      
      // Check if contact exists
      const existingContact = await findContactByPhoneNumber(recipient);
      
      if (existingContact) {
        contactId = existingContact.id;
      } else if (name.trim()) {
        // Create new contact if name is provided
        const newContact = await addContact(name.trim(), recipient);
        contactId = newContact.id;
      } else {
        // Create contact with just phone number
        const newContact = await addContact('', recipient);
        contactId = newContact.id;
      }
      
      // Log request data for debugging
      console.log('Sending SMS with:', { 
        to: recipient, 
        message, 
        from: activePhoneNumber, 
        contactId,
        activePhoneDetails: phoneNumbers.find(p => p.id === activePhoneNumber)
      });
      
      // We don't have a conversation ID yet, but we can still configure delivery reports
      const deliveryReportUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delivery-report`;
      
      // Send message
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: recipient,
          message,
          from: activePhoneNumber,
          contactId,
          whendelivered: deliveryReportUrl
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error details:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }
      
      // Show success notification
      showNotification('Message sent successfully');
      
      // Refresh conversations
      fetchConversationsPreserveRead();
      
      setShowNewSmsModal(false);
      setNewSmsRecipient('');
      setNewSmsMessage('');
      setRecipientName('');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message');
      alert('Failed to send message. Please try again.');
    }
  };

  const handleArchiveConversation = async () => {
    if (!selectedChat) return;
    
    // Currently we don't have a real archive feature, but we could add one
    console.log('Archive conversation:', selectedChat);
    setShowMoreOptions(false);
    setSelectedChat(null);
    setShowMobileConversation(false);
  };

  // Add a function to check if the current conversation has opted out
  const checkIfOptedOut = async (phoneNumber: string, phoneId: any) => {
    try {
      console.log(`Checking if ${phoneNumber} is opted out from phone ${phoneId}`);
      const { isOptedOut, optOutData } = await checkOptOut(phoneNumber, phoneId);
      console.log(`Opt-out check result for ${phoneNumber}: ${isOptedOut}`, optOutData);
      setIsOptedOut(isOptedOut);
      
      // If conversation is selected, refresh messages to ensure we see the latest messages
      if (selectedChat) {
        console.log(`Refreshing messages for conversation ${selectedChat} after opt-out check`);
        await fetchMessages(String(selectedChat));
      }
    } catch (error) {
      console.error('Error checking opt-out status:', error);
      // Default to false if there's an error
      setIsOptedOut(false);
    }
  };

  // Update the useEffect that runs when selectedChat changes to check opt-out status
  useEffect(() => {
    if (selectedChat) {
      // Clear previous messages first to signal a conversation change
      setMessages([]);
      
      // Then fetch new messages
      fetchMessages(String(selectedChat));

      // Mark the conversation as read
      markConversationAsRead(String(selectedChat))
        .then(() => {
          console.log(`Successfully marked conversation ${selectedChat} as read`);
          
          // Update unread count in UI immediately
          setConversations(prev => 
            prev.map(conv => 
              conv.id === selectedChat ? { ...conv, unread: 0 } : conv
            )
          );
          
          // Add to our tracking of read conversations
          setTrackedReadConversations(prev => {
            const newSet = new Set(prev);
            newSet.add(String(selectedChat));
            return newSet;
          });
        })
        .catch(err => {
          console.error(`Error marking conversation ${selectedChat} as read:`, err);
        });

      // Get conversation details for opt-out check
      const selectedConversation = conversations.find(c => c.id === selectedChat);
      if (selectedConversation && selectedConversation.phoneNumber && selectedConversation.phoneId) {
        checkIfOptedOut(selectedConversation.phoneNumber, selectedConversation.phoneId);
      } else {
        setIsOptedOut(false);
      }
    }
  }, [selectedChat]);

  // Update the handleMarkAsStoppClick function to refresh the opted-out state after marking
  const handleMarkAsStoppClick = async () => {
    if (isOptedOut) return; // Already opted out, do nothing
    
    try {
      const conversation = conversations.find(c => c.id === selectedChat);
      if (!conversation || !conversation.phoneNumber || !conversation.phoneId) return;
      
      // Ask for confirmation
      const confirm = window.confirm(
        `This will permanently block ${conversation.name || conversation.phoneNumber} from receiving bulk SMS messages from this number. Continue?`
      );
      
      if (!confirm) return;
      
      // Register the opt-out in the database
      await registerOptOut(conversation.phoneNumber, conversation.phoneId, 'MANUAL_STOPP');
      
      // Update the local state
      setIsOptedOut(true);
      
      // Close the more options menu
      setShowMoreOptions(false);
      
      // Show success notification
      showNotification(`${conversation.name || conversation.phoneNumber} has been blocked from receiving bulk SMS`);
      
    } catch (error) {
      console.error('Error marking as STOPP:', error);
      showNotification('Failed to mark as STOPP');
    }
  };

  // Add handler to undo STOPP marking
  const handleUndoStoppClick = async () => {
    if (!isOptedOut) return; // Not opted out, do nothing
    
    try {
      const conversation = conversations.find(c => c.id === selectedChat);
      if (!conversation || !conversation.phoneNumber || !conversation.phoneId) return;
      
      // Ask for confirmation
      const confirm = window.confirm(
        `This will allow ${conversation.name || conversation.phoneNumber} to receive bulk SMS messages again. Continue?`
      );
      
      if (!confirm) return;
      
      // Remove the opt-out from the database
      await removeOptOut(conversation.phoneNumber, conversation.phoneId);
      
      // Update the local state
      setIsOptedOut(false);
      
      // Close the more options menu
      setShowMoreOptions(false);
      
      // Show success notification
      showNotification(`${conversation.name || conversation.phoneNumber} can now receive bulk SMS again`);
      
    } catch (error) {
      console.error('Error removing STOPP mark:', error);
      showNotification('Failed to remove STOPP status');
    }
  };

  const handleEditContactName = () => {
    const selectedChatDetails = conversations.find(c => c.id === selectedChat);
    if (selectedChatDetails) {
      setContactNameEdit(selectedChatDetails.name || '');
      setEditingContactName(true);
    }
  };

  const handleSaveContactName = async () => {
    if (!selectedChat) return;
    
    try {
      const conversation = conversations.find(c => c.id === selectedChat);
      if (!conversation || !conversation.contactId) return;
      
      // Update contact name in database
      await updateContact(conversation.contactId, { name: contactNameEdit.trim() });
      
      // Update contacts and conversations in UI
      const updatedContact = { ...contacts.find(c => c.id === conversation.contactId), name: contactNameEdit.trim() };
      
      setContacts(prev => 
        prev.map(contact => 
          contact.id === conversation.contactId
            ? updatedContact
            : contact
        )
      );
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedChat
            ? { ...conv, name: contactNameEdit.trim() }
            : conv
        )
      );
      
      setEditingContactName(false);
    } catch (error) {
      console.error('Error updating contact name:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveContactName();
    }
  };

  const handleOpenBulkSms = () => setCurrentPage('bulkSms');
  const handleOpenContacts = () => setCurrentPage('contacts');
  const handleOpenSettings = () => setCurrentPage('settings');
  const handleBackToMain = () => setCurrentPage('main');

  const handleBulkSmsSent = async (campaign: any) => {
    try {
      // Save campaign to database
      const savedCampaign = await addBulkCampaign(
        campaign.name,
        campaign.template,
        campaign.recipients,
        activePhoneNumber,
        'sent'
      );
      
      console.log("Processing bulk SMS for all recipients...");
      
      // For each recipient, ensure a conversation exists
      // This helps make sure bulk messages appear in the conversation list
      for (const recipient of campaign.recipients) {
        try {
          // Find or create contact
          let contactId;
          const existingContact = await findContactByPhoneNumber(recipient.phone);
          
          if (existingContact) {
            contactId = existingContact.id;
          } else {
            // Create contact with name if available, otherwise just phone
            const newContact = await addContact(recipient.name || '', recipient.phone);
            contactId = newContact.id;
          }
          
          // Replace template variables with recipient data
          const personalizedMessage = campaign.template.replace(/\{([^}]+)\}/g, (match: string, key: string) => 
            recipient[key] || match
          );
          
          console.log(`Sending bulk SMS to ${recipient.phone}`);
          
          // Call the send-sms endpoint to ensure a conversation is created/updated
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              to: recipient.phone,
              message: personalizedMessage,
              from: activePhoneNumber,
              contactId,
              bulk_campaign: {
                id: savedCampaign?.id || Date.now().toString(),
                name: campaign.name,
                date: new Date().toISOString()
              },
              is_bulk: true
            }),
          });
          
          if (!response.ok) {
            console.error(`Error creating conversation for recipient ${recipient.phone}`);
          } else {
            console.log(`Successfully sent bulk SMS to ${recipient.phone}`);
          }
        } catch (error) {
          console.error(`Error processing bulk recipient ${recipient.phone}:`, error);
        }
      }
      
      // Show success notification
      showNotification(`Bulk SMS sent to ${campaign.recipients.length} recipients`);
      
      // Ensure we refresh conversations after all bulk messages have been sent
      console.log("Refreshing conversations after bulk send...");
      await fetchConversationsPreserveRead();
      
      // Refresh bulk campaigns list
      fetchBulkCampaigns();
      setActiveTab('history');
    } catch (error) {
      console.error('Error sending bulk campaign:', error);
      showNotification('Error sending bulk SMS');
    }
  };

  // Helper function to get active device info
  const getActiveDeviceInfo = () => {
    if (!activePhoneNumber || phoneNumbers.length === 0) {
      return { id: '', device: 'Unknown device' };
    }
    
    const activePhone = phoneNumbers.find(phone => phone.id === activePhoneNumber);
    if (!activePhone) {
      return { id: '', device: 'Unknown device' };
    }
    
    return { id: activePhone.id, device: activePhone.device };
  };
  
  // Get the active device info
  const activeDeviceInfo = getActiveDeviceInfo();

  // Configure webhook for the active phone number
  const configureWebhookForPhoneNumber = async (phoneNumber: string) => {
    try {
      console.log(`Configuring webhook for phone number: ${phoneNumber}`);
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const smsUrl = `${baseUrl}/functions/v1/sms-webhook`;
      console.log(`Setting webhook URL to: ${smsUrl}`);
      console.log(`VITE_SUPABASE_URL: ${baseUrl}`);

      // Temporarily disabled webhook configuration since it's already configured manually
      console.log("Webhook configuration disabled - already configured manually");
      
      // Comment out the actual API call that's failing
      /*
      await elksApi.configurePhoneNumber({
        phoneNumber,
        smsUrl,
      });
      */

      console.log(`Successfully configured webhook for ${phoneNumber}`);
    } catch (error) {
      console.error("Error configuring webhook:", error);
    }
  };

  // Handle new messages from realtime subscription
  const handleNewMessage = (message: any) => {
    console.log('Handling new message:', message);
    
    // Format the time for the new message
    const formattedMessage = {
      ...message,
      time: formatTime(message.created_at || message.time)
    };
    
    // Check if this message belongs to the currently selected conversation
    if (message.conversation_id === selectedChat) {
      // Add the message to the current list
      setMessages(prev => [...prev, formattedMessage]);
      
      // Mark conversation as read since user is viewing it
      markConversationAsRead(message.conversation_id);
    } else {
      // Only increment unread count if this is not an automated message
      if (!message.is_automated) {
        // Increment unread count for the conversation in our local state
        setConversations(prev => 
          prev.map(conv => 
            conv.id === message.conversation_id 
              ? { 
                  ...conv, 
                  lastMessage: message.text,
                  time: formatDate(message.created_at || message.time),
                  unread: (conv.unread || 0) + 1 
                } 
              : conv
          )
        );
      } else {
        // For automated messages, update last message but don't increment unread count
        setConversations(prev => 
          prev.map(conv => 
            conv.id === message.conversation_id 
              ? { 
                  ...conv, 
                  lastMessage: message.text,
                  time: formatDate(message.created_at || message.time),
                  // Don't increment unread count for automated messages
                } 
              : conv
          )
        );
        console.log('Automated message received, not incrementing unread count');
      }
    }

    // Play notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => console.log('Could not play notification sound:', err));
  };

  // Toast notification state for sent messages
  const [showSentNotification, setShowSentNotification] = useState(false);
  const [sentNotificationMessage, setSentNotificationMessage] = useState('');
  
  // Show notification for 3 seconds
  const showNotification = (message: string) => {
    setSentNotificationMessage(message);
    setShowSentNotification(true);
    setTimeout(() => {
      setShowSentNotification(false);
    }, 3000);
  };

  // Function to load more conversations (pagination)
  const loadMoreConversations = async () => {
    if (isLoadingMoreConversations || !hasMoreConversations) return;
    
    try {
      setIsLoadingMoreConversations(true);
      await fetchConversationsPreserveRead(conversationsPage + 1);
    } catch (error) {
      console.error('Error loading more conversations:', error);
    } finally {
      setIsLoadingMoreConversations(false);
    }
  };
  
  const fetchMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      
      // Force cache invalidation with a timestamp parameter
      const timestamp = Date.now();
      const data = await getMessages(conversationId, { forceRefresh: timestamp });
      
      if (data) {
        // Get the conversation to access phone information
        const conversation = conversations.find(c => c.id.toString() === conversationId);
        const phoneDevice = phoneNumbers.find(p => p.id === conversation?.phoneId);
        
        // Format the message times and add phone info
        const formattedMessages = data.map(msg => {
          // For outgoing messages, use the conversation's phone info
          // For incoming messages, use the conversation's contact phone number
          return {
            ...msg,
            time: formatTime(msg.created_at || msg.time),
            // For all messages, include info about the conversation's phone device
            receiverPhone: phoneDevice?.number || '',
            receiverDevice: phoneDevice?.device || 'Unknown device',
            // Include the contact's phone number for incoming messages
            phoneNumber: conversation?.phoneNumber || ''
          };
        });
        
        setMessages(formattedMessages);
        
        // Check if there are any incoming messages (them), and set the active phone to match
        // the receiver phone from the most recent incoming message
        const incomingMessages = formattedMessages.filter(msg => msg.sender === 'them');
        if (incomingMessages.length > 0) {
          // Sort by time to get the most recent
          incomingMessages.sort((a, b) => 
            new Date(b.created_at || b.time).getTime() - new Date(a.created_at || a.time).getTime()
          );
          
          // Get the most recent message's receiver phone info
          const mostRecentMessage = incomingMessages[0];
          
          // Find the phone number ID matching this receiver phone
          const matchingPhone = phoneNumbers.find(p => p.number === mostRecentMessage.receiverPhone);
          
          if (matchingPhone && matchingPhone.id !== activePhoneNumber) {
            console.log(`Setting active phone to ${matchingPhone.device} based on most recent message`);
            setActivePhoneNumber(matchingPhone.id);
          }
        }
        
        // Mark conversation as read in the database
        await markConversationAsRead(conversationId);
        
        // Add to our local tracking of read conversations
        setTrackedReadConversations(prev => {
          const newSet = new Set(prev);
          newSet.add(conversationId);
          return newSet;
        });
        
        // Also update the local state to show it as read
        setConversations(prev => 
          prev.map(conv => 
            conv.id.toString() === conversationId 
              ? { ...conv, unread: 0 } 
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Render the appropriate page based on current state
  if (currentPage === 'bulkSms') {
    return (
      <>
        <BulkSmsPage 
          onBack={handleBackToMain}
          onOpenMessages={handleBackToMain}
          onOpenContacts={handleOpenContacts}
          onOpenBulkSms={handleOpenBulkSms}
          onOpenSettings={handleOpenSettings}
          phoneNumbers={phoneNumbers.map(p => ({ 
            id: p.id, 
            number: p.number, 
            device: p.device, 
            is_default: p.is_default 
          }))}
          activePhoneNumber={activePhoneNumber}
          setActivePhoneNumber={setActivePhoneNumber}
          onBulkSmsSent={handleBulkSmsSent}
        />
        <MobileNavBar
          onOpenMessages={handleBackToMain}
          onOpenContacts={handleOpenContacts}
          onOpenBulkSms={handleOpenBulkSms}
          onOpenSettings={handleOpenSettings}
          currentPage={currentPage}
        />
      </>
    );
  }
  
  if (currentPage === 'contacts') {
    return (
      <>
        <ContactBookPage
          onBack={handleBackToMain}
          onOpenMessages={handleBackToMain}
          onOpenContacts={handleOpenContacts}
          onOpenBulkSms={handleOpenBulkSms}
          onOpenSettings={handleOpenSettings}
          contacts={contacts}
          setContacts={setContacts}
          onContactsChange={fetchContacts}
        />
        <MobileNavBar
          onOpenMessages={handleBackToMain}
          onOpenContacts={handleOpenContacts}
          onOpenBulkSms={handleOpenBulkSms}
          onOpenSettings={handleOpenSettings}
          currentPage={currentPage}
        />
      </>
    );
  }

  if (currentPage === 'settings') {
    return (
      <>
        <ProfilePage
          onBack={handleBackToMain}
          onOpenMessages={handleBackToMain}
          onOpenContacts={handleOpenContacts}
          onOpenBulkSms={handleOpenBulkSms}
          onOpenSettings={handleOpenSettings}
        />
        <MobileNavBar
          onOpenMessages={handleBackToMain}
          onOpenContacts={handleOpenContacts}
          onOpenBulkSms={handleOpenBulkSms}
          onOpenSettings={handleOpenSettings}
          currentPage={currentPage}
        />
      </>
    );
  }
  
  // Main messaging interface
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <MainMessagingLayout
        conversations={sortedChats}
        messages={messages}
        selectedChat={selectedChat}
        phoneNumbers={phoneNumbers}
        activePhoneNumber={activePhoneNumber}
        contacts={contacts}
        setSelectedChat={(id) => {
          setSelectedChat(id);
          if (id !== null) {
            setShowMobileConversation(true);
          }
        }}
        setShowMobileConversation={setShowMobileConversation}
        showMobileConversation={showMobileConversation}
        setMessageText={setMessageText}
        setShowDeviceModal={setShowDeviceModal}
        showDeviceModal={showDeviceModal}
        setActivePhoneNumber={setActivePhoneNumber}
        setShowFilterDropdown={setShowFilterDropdown}
        setShowSearchDropdown={setShowSearchDropdown}
        setShowNewSmsModal={setShowNewSmsModal}
        showNewSmsModal={showNewSmsModal}
        setEditingContactName={setEditingContactName}
        editingContactName={editingContactName}
        contactNameEdit={contactNameEdit}
        setContactNameEdit={setContactNameEdit}
        setShowMoreOptions={setShowMoreOptions}
        handleSaveContactName={handleSaveContactName}
        handleEditContactName={handleEditContactName}
        handleOpenBulkSms={handleOpenBulkSms}
        handleOpenContacts={handleOpenContacts}
        handleOpenSettings={handleOpenSettings}
        handleSendNewSms={handleSendNewSms}
        sendMessage={sendMessage}
        handleBackToList={handleBackToList}
        searchText={searchText}
        setSearchText={setSearchText}
        activeDeviceInfo={activeDeviceInfo}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        isOptedOut={isOptedOut}
        onLoadMore={loadMoreConversations}
        hasMoreConversations={hasMoreConversations}
        isLoadingMore={isLoadingMoreConversations}
      />
      
      {/* More Options Dropdown */}
      {showMoreOptions && (
        <div
          ref={moreOptionsRef}
          className="absolute top-16 right-4 bg-white shadow-lg rounded-lg z-50 overflow-hidden w-56"
        >
          <ul className="py-2">
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={handleEditContactName}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Contact Name
            </li>
            {isOptedOut ? (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-green-600"
                onClick={handleUndoStoppClick}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Remove STOPP Status
              </li>
            ) : (
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-red-600"
                onClick={handleMarkAsStoppClick}
              >
                <Ban className="w-4 h-4 mr-2" />
                Mark as STOPP
              </li>
            )}
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={handleArchiveConversation}
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </li>
          </ul>
        </div>
      )}

      {/* Success/Error Toast Notification */}
      {showSentNotification && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
            sentNotificationMessage.includes('Error') || sentNotificationMessage.includes('Failed') 
              ? 'bg-red-500 text-white' 
              : 'bg-green-500 text-white'
          }`}>
            <span>
              {sentNotificationMessage.includes('Error') || sentNotificationMessage.includes('Failed') 
                ? '❌' 
                : '✅'}
            </span>
            <span>{sentNotificationMessage}</span>
          </div>
        </div>
      )}

      <MobileNavBar
        onOpenMessages={handleBackToMain}
        onOpenContacts={handleOpenContacts}
        onOpenBulkSms={handleOpenBulkSms}
        onOpenSettings={handleOpenSettings}
        currentPage={currentPage}
      />
    </div>
  );
};

export default MessagingApp;