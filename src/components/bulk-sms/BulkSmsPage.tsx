import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, AlertCircle, Send, MessageSquare, Users, BookOpen, Settings, Clock } from 'lucide-react';
import Header from '../common/Header';
import BulkSmsFooter from './BulkSmsFooter';
import BulkSmsUpload from './BulkSmsUpload';
import BulkSmsCompose from './BulkSmsCompose';
import BulkSmsTest from './BulkSmsTest';
import BulkSmsSend from './BulkSmsSend';
import BulkSmsHistory from './BulkSmsHistory';
import DeviceSelectionModal from '../messaging/DeviceSelectionModal';
import StepIndicator from '../ui/StepIndicator';
import { Step } from '../ui/StepIndicator';
import * as elksApi from '../../services/elksApi';
import supabase from '../../services/supabase';
import { addMessage, createOrUpdateConversation } from '../../services/supabase';

interface BulkSmsPageProps {
  onBack: () => void;
  onOpenMessages?: () => void;
  onOpenContacts?: () => void;
  onOpenBulkSms?: () => void;
  onOpenSettings?: () => void;
  phoneNumbers: Array<{
    id: string;
    number: string;
    device: string;
    is_default: boolean;
  }>;
  activePhoneNumber: string;
  setActivePhoneNumber: (id: string) => void;
  onBulkSmsSent: (campaign: any) => void;
}

const BulkSmsPage: React.FC<BulkSmsPageProps> = ({ 
  onBack, 
  onOpenMessages,
  onOpenContacts,
  onOpenBulkSms,
  onOpenSettings,
  phoneNumbers, 
  activePhoneNumber, 
  setActivePhoneNumber,
  onBulkSmsSent
}) => {
  const [activeTab, setActiveTab] = useState('send');
  const [bulkSmsStep, setBulkSmsStep] = useState(1); // 1: Upload, 2: Compose, 3: Test, 4: Send
  const [csvData, setCsvData] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [templateMessage, setTemplateMessage] = useState('');
  const [testPreview, setTestPreview] = useState({ message: '', recipient: '' });
  const [selectedTestRow, setSelectedTestRow] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [phoneColumnName, setPhoneColumnName] = useState<string>('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [testRecipientNumber, setTestRecipientNumber] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [smsMetrics, setSmsMetrics] = useState({ charCount: 0, smsCount: 0, cost: '0.00' });
  const [saveToContacts, setSaveToContacts] = useState(true); // Default to saving contacts
  const [contactNameColumn, setContactNameColumn] = useState<string>(''); // Column to use for contact names
  const [overwriteExistingContacts, setOverwriteExistingContacts] = useState(false); // Default to not overwriting existing contacts
  
  // Added state for campaign continuation
  const [continuingCampaignId, setContinuingCampaignId] = useState<string | null>(null);
  const [continuingCampaignName, setContinuingCampaignName] = useState<string>('');
  
  // Added state for excluded recipients
  const [excludedRecipients, setExcludedRecipients] = useState<any[]>([]);
  const [recipientStats, setRecipientStats] = useState<any>(null);
  const [showExcludedDetails, setShowExcludedDetails] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps configuration
  const steps: Step[] = [
    { id: 1, label: 'Upload CSV', icon: <Upload className="w-5 h-5" /> },
    { id: 2, label: 'Compose Message', icon: <FileText className="w-5 h-5" /> },
    { id: 3, label: 'Test SMS', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 4, label: 'Send Bulk SMS', icon: <Send className="w-5 h-5" /> },
  ];

  // Fetch bulk campaigns on component mount
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  const fetchCampaigns = async () => {
    try {
      // Import the service function
      const { getBulkCampaigns } = await import('../../services/supabase');
      const data = await getBulkCampaigns();
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching bulk campaigns:', error);
    }
  };
  
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Update SMS metrics whenever the template message changes
  useEffect(() => {
    const metrics = calculateSmsMetrics(templateMessage);
    setSmsMetrics(metrics);
  }, [templateMessage]);

  // Calculate SMS metrics
  const calculateSmsMetrics = (text: string) => {
    const charCount = text.length;
    const smsCount = Math.ceil(charCount / 160) || 1;
    const cost = (smsCount * 0.5).toFixed(2);
    return { charCount, smsCount, cost };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseCsvData(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCsvData = (content: string) => {
    try {
      // Simple CSV parsing logic (in a real app, you'd use a CSV parsing library)
      const lines = content.split('\n');
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(header => header.trim());
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has a different number of columns than the header row`);
          continue;
        }

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvData(content);
      setAvailableTags(headers.map(h => `{{${h}}}`));
      
      // Try to auto-detect a phone number column
      const phoneColumnPatterns = [
        /^phone$/i, 
        /^mobile$/i, 
        /^telephone$/i, 
        /^tel$/i, 
        /^number$/i, 
        /^phone.*number$/i, 
        /^mobile.*number$/i, 
        /^contact.*number$/i
      ];
      
      const phoneColumn = headers.find(header => 
        phoneColumnPatterns.some(pattern => pattern.test(header))
      );
      
      if (phoneColumn) {
        console.log(`Auto-detected phone column: "${phoneColumn}"`);
        setPhoneColumnName(phoneColumn);
      }
      
      // Move to the next step if we have valid data
      if (rows.length > 0) {
        setBulkSmsStep(2);
      }
    } catch (error) {
      alert(`Error parsing CSV file: ${error}`);
    }
  };

  const renderTemplateForRow = (template: string, rowData: Record<string, string>) => {
    if (!rowData || !template) return '';
    
    // First capture the line breaks in the original template
    // by replacing them with a special marker
    const lineBreakMarker = '###LINE_BREAK###';
    let result = template.replace(/\n/g, lineBreakMarker);
    
    // Replace standard tags [tag] with values 
    for (const [key, value] of Object.entries(rowData)) {
      result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value || '');
    }
    
    // Replace handlebar style tags with fallback values {{tag | fallback}}
    const handlebarsPattern = /\{\{([^|]+)\|([^}]+)\}\}/g;
    result = result.replace(handlebarsPattern, (match, key, fallback) => {
      key = key.trim();
      fallback = fallback.trim();
      
      // Check if the key exists in the row data and has a value
      if (rowData[key] && rowData[key].trim() !== '') {
        return rowData[key];
      }
      
      // Otherwise use the fallback value
      return fallback;
    });
    
    // Also support {{tag}} without fallback
    const simpleHandlebarsPattern = /\{\{([^}]+)\}\}/g;
    result = result.replace(simpleHandlebarsPattern, (match, key) => {
      key = key.trim();
      return rowData[key] || '';
    });
    
    // Restore the line breaks
    return result.replace(new RegExp(lineBreakMarker, 'g'), '\n');
  };

  const updateTestPreview = (rowIndex: number) => {
    if (rowIndex >= 0 && rowIndex < csvRows.length) {
      const row = csvRows[rowIndex];
      const message = renderTemplateForRow(templateMessage, row);
      
      // Use the test recipient number provided by the user, or a placeholder
      setTestPreview({
        message,
        recipient: testRecipientNumber || 'Enter test number'
      });
    }
  };

  const handleNextStep = () => {
    if (bulkSmsStep === 2 && !templateMessage.trim()) {
      alert('Please enter a message template');
      return;
    }
    
    if (bulkSmsStep === 2) {
      // Moving to test step, prepare the preview
      updateTestPreview(0);
    }
    
    if (bulkSmsStep < 4) {
      setBulkSmsStep(bulkSmsStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (bulkSmsStep > 1) {
      setBulkSmsStep(bulkSmsStep - 1);
    } else {
      onBack();
    }
  };

  const handleSendTestSms = async () => {
    if (!testRecipientNumber) {
      alert('Please enter a phone number to send the test SMS');
      return;
    }
    
    // Find the phone number to use as sender
    const phoneNumber = phoneNumbers.find(p => p.id === activePhoneNumber);
    if (!phoneNumber) {
      alert('Please select a phone number to send from');
      return;
    }
    
    console.log('Sending test SMS to', testRecipientNumber, 'with message:', testPreview.message);
    console.log('Using phone ID:', phoneNumber.id, 'Phone number:', phoneNumber.number);
    
    try {
      // Send the actual test SMS using the elksApi
      const result = await elksApi.sendSms(
        testRecipientNumber,
        testPreview.message,
        { 
          from: phoneNumber.id, // Use the phone ID as the 'from' parameter
          actualPhoneNumber: phoneNumber.number, // Send the actual phone number as a separate parameter
          dontSaveToConversation: true 
        }
      );
      
      console.log('Test SMS sent response:', JSON.stringify(result, null, 2));
      
      // Show success message - inform user that the test message was sent but not saved
      alert(`Test SMS sent to ${testRecipientNumber}\n\nNote: This test message was sent but not saved to your conversations.`);
    } catch (error) {
      console.error('Error sending test SMS:', error);
      alert(`Error sending test SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleChangeTestRow = (direction: 'prev' | 'next') => {
    let newIndex = selectedTestRow;
    
    if (direction === 'next' && selectedTestRow < csvRows.length - 1) {
      newIndex = selectedTestRow + 1;
    } else if (direction === 'prev' && selectedTestRow > 0) {
      newIndex = selectedTestRow - 1;
    }
    
    setSelectedTestRow(newIndex);
    updateTestPreview(newIndex);
  };

  const handleSendBulkSms = async () => {
    if (!campaignName.trim()) {
      alert('Please enter a name for this campaign');
      return;
    }
    
    // Require phone column selection
    if (!phoneColumnName) {
      alert('Please select which column contains phone numbers');
      return;
    }

    // If saving contacts is enabled, make sure we have a name column selected
    if (saveToContacts && !contactNameColumn) {
      alert('Please select a column to use for contact names or disable saving to contacts');
      return;
    }
    
    // Find the phone number to use as sender
    const phoneNumber = phoneNumbers.find(p => p.id === activePhoneNumber);
    if (!phoneNumber) {
      alert('Please select a phone number to send from');
      return;
    }
    
    try {
      // Prepare recipient list with personalized messages
      const recipients = csvRows.map(row => {
        // Generate personalized message by replacing placeholders with actual data
        const personalizedMessage = renderTemplateForRow(templateMessage, row);
        
        // Use the phone number from the user-selected column
        const recipientPhone = row[phoneColumnName];
        
        if (!recipientPhone) {
          console.warn('No phone number found for recipient:', row);
          return null;
        }
        
        return {
          to: recipientPhone,
          message: personalizedMessage,
          recipient: row // Store the full recipient data for conversation creation
        };
      }).filter(Boolean); // Remove any null entries
      
      if (recipients.length === 0) {
        alert('No valid recipients found in CSV. Please ensure there is a column with phone numbers.');
        return;
      }
      
      // Get the list of phone numbers only
      const recipientPhoneNumbers = recipients.map(r => r.to);
      
      // If continuing a campaign, check for excluded recipients
      let eligibleRecipients = recipients;
      
      if (continuingCampaignId) {
        // Import the function to check for excluded recipients
        const { getExcludedRecipients } = await import('../../services/supabase');
        
        // Check which recipients are excluded (replied or opted out)
        const exclusionData = await getExcludedRecipients(
          continuingCampaignId, 
          activePhoneNumber,
          recipientPhoneNumbers
        );
        
        // Store for UI display
        setExcludedRecipients(exclusionData.excludedRecipients);
        setRecipientStats(exclusionData.stats);
        
        // Filter out excluded recipients
        const eligiblePhoneNumbers = new Set(
          exclusionData.excludedRecipients
            .filter(r => !r.excluded)
            .map(r => r.phoneNumber)
        );
        
        eligibleRecipients = recipients.filter(r => eligiblePhoneNumbers.has(r.to));
        
        if (eligibleRecipients.length === 0) {
          alert('All recipients in this CSV have either replied to the previous campaign or opted out. No messages will be sent.');
          return;
        }
        
        // Confirm with the user if there are exclusions
        if (eligibleRecipients.length < recipients.length) {
          const excluded = recipients.length - eligibleRecipients.length;
          const confirmation = confirm(
            `${excluded} out of ${recipients.length} recipients will not receive the message because they either replied to the previous campaign or opted out by texting STOPP.\n\nProceed with sending to the remaining ${eligibleRecipients.length} recipients?`
          );
          
          if (!confirmation) {
            return;
          }
        }
      } else {
        // For new campaigns, check global opt-outs
        const { data: optOuts, error: optOutError } = await supabase
          .from('bulk_sms_opt_outs')
          .select('*')
          .eq('sender_phone_id', activePhoneNumber)
          .in('recipient_number', recipientPhoneNumbers);
        
        if (!optOutError && optOuts.length > 0) {
          // Build a set of opted-out numbers
          const optedOutNumbers = new Set(optOuts.map(o => o.recipient_number));
          
          // Filter out opted-out recipients
          const originalCount = eligibleRecipients.length;
          eligibleRecipients = eligibleRecipients.filter(r => !optedOutNumbers.has(r.to));
          
          // Notify the user
          if (eligibleRecipients.length < originalCount) {
            const excluded = originalCount - eligibleRecipients.length;
            const confirmation = confirm(
              `${excluded} out of ${originalCount} recipients will not receive the message because they have previously opted out by texting STOPP.\n\nProceed with sending to the remaining ${eligibleRecipients.length} recipients?`
            );
            
            if (!confirmation) {
              return;
            }
          }
        }
      }
      
      console.log(`Sending bulk SMS to ${eligibleRecipients.length} recipients from ${phoneNumber.number}`);
      
      // Show sending in progress
      alert(`Sending ${eligibleRecipients.length} messages. This may take a few moments...`);
      
      // Import necessary functions
      const { 
        addBulkCampaign, 
        updateBulkCampaignStatus, 
        updateBulkCampaignRecipientCount 
      } = await import('../../services/supabase');
      
      let campaign;
      
      // If continuing an existing campaign
      if (continuingCampaignId) {
        console.log(`Continuing existing campaign ${continuingCampaignId} with ${eligibleRecipients.length} more recipients`);
        
        // Update the campaign's recipient count
        await updateBulkCampaignRecipientCount(continuingCampaignId, eligibleRecipients.length);
        
        // Set status to sending
        campaign = await updateBulkCampaignStatus(continuingCampaignId, 'sending');
      } else {
        // Create a new campaign
        campaign = await addBulkCampaign(
          campaignName.trim(),
          templateMessage,
          eligibleRecipients.length,
          activePhoneNumber,
          'sending'
        );
        
        console.log("Created new bulk campaign:", campaign);
      }
      
      // Use the elksApi service to send the bulk SMS
      const { results, summary } = await elksApi.sendBulkSms(
        eligibleRecipients,
        phoneNumber.id,        // Use the phone ID as the 'from' parameter
        phoneNumber.number     // Pass the actual phone number as a separate parameter
      );
      
      // Create conversations for all successfully sent messages
      console.log("Creating conversations for sent messages...");
      const conversationPromises = eligibleRecipients.map(async (recipient, index) => {
        const recipientData = recipient.recipient;
        const recipientPhone = recipient.to;
        const messageText = recipient.message;
        const result = results[index];
        const status = result.status === 'success' ? 'sent' : 'failed';

        // Get the contact name from the selected column if available
        const recipientName = saveToContacts && contactNameColumn 
          ? recipientData[contactNameColumn] || ''
          : '';
        
        try {
          let contactId;
          
          // Only process contacts if saving is enabled
          if (saveToContacts && recipientName.trim() !== '') {
            // Try to find the existing contact first
            const { data: existingContact } = await supabase.from('contacts')
              .select('*')
              .eq('phone_number', recipientPhone)
              .single();
              
            if (existingContact) {
              contactId = existingContact.id;
              
              // If overwriteExistingContacts is true or the contact has no name, update it
              if (overwriteExistingContacts || 
                  (!existingContact.name || existingContact.name.trim() === '')) {
                console.log(`Updating name for existing contact ${recipientPhone} from "${existingContact.name || ''}" to "${recipientName}"`);
                await supabase.from('contacts')
                  .update({ name: recipientName })
                  .eq('id', existingContact.id);
              }
            } else {
              // Create new contact since it doesn't exist yet
              console.log(`Creating new contact: ${recipientName} (${recipientPhone})`);
              const { data: newContact } = await supabase.from('contacts')
                .insert({ name: recipientName, phone_number: recipientPhone })
                .select();
                
              if (newContact && newContact.length > 0) {
                contactId = newContact[0].id;
              }
            }
          } else {
            // If not saving new contacts, just check if the contact already exists
            const { data: existingContact } = await supabase.from('contacts')
              .select('id')
              .eq('phone_number', recipientPhone)
              .single();
              
            if (existingContact) {
              contactId = existingContact.id;
            }
          }
          
          // Now create or update the conversation
          const conversation = await createOrUpdateConversation({
            contact: {
              id: contactId, // Pass contact ID if we have it
              name: recipientName,
              phone_number: recipientPhone
            },
            phone_id: activePhoneNumber,
            message: messageText
          });
          
          if (conversation) {
            // Add the message to the conversation with appropriate status
            const campaignId = continuingCampaignId || campaign.id;
            if (!campaignId) {
              console.error('Missing campaign ID when adding message');
            }
            
            // Log that we're adding a message with a campaign ID
            console.log(`Adding message to conversation ${conversation.id} with campaign ID: ${campaignId}`);
            
            const message = await addMessage(
              conversation.id.toString(),
              'me',
              messageText,
              {
                status: status,
                externalId: result.status === 'success' ? result.id : undefined,
                bulk_campaign_id: campaignId,
                is_bulk: true,
                bulk_campaign_name: continuingCampaignId ? continuingCampaignName : campaignName.trim()
              }
            );
            
            // Verify message was created with campaign ID
            if (message && message.bulk_campaign_id !== campaignId) {
              console.error(`Message ${message.id} created but campaign ID mismatch: expected ${campaignId}, got ${message.bulk_campaign_id}`);
              
              // Try to update the message with the correct campaign ID
              try {
                await supabase
                  .from('messages')
                  .update({ bulk_campaign_id: campaignId })
                  .eq('id', message.id);
                console.log(`Fixed campaign ID for message ${message.id}`);
              } catch (updateError) {
                console.error(`Failed to fix campaign ID for message ${message.id}:`, updateError);
              }
            }
            
            console.log(`Created conversation for ${recipientPhone} with status: ${status}`);
            
            // If the message was successful, also record in the sms_delivery_status table
            if (result.status === 'success' && message && campaignId) {
              try {
                const { recordSmsDeliveryStatus } = await import('../../services/supabase');
                await recordSmsDeliveryStatus(
                  message.id,
                  result.id,
                  recipientPhone,
                  campaignId,
                  'sent'
                );
              } catch (deliveryError) {
                console.warn(`Failed to record delivery status for ${recipientPhone}:`, deliveryError);
                // Don't fail the entire operation for this
              }
            }
            
            return { success: true, conversation, recipient: recipientPhone };
          }
        } catch (error) {
          console.error(`Error creating conversation for ${recipientPhone}:`, error);
          return { success: false, error, recipient: recipientPhone };
        }
      });
      
      // Wait for all conversation creations to complete
      const conversationResults = await Promise.all(conversationPromises);
      console.log("Conversations created successfully");
      
      // Update the campaign status to sent
      await updateBulkCampaignStatus(continuingCampaignId || campaign.id, 'sent');
      
      // Clear continuing campaign state after successful send
      if (continuingCampaignId) {
        setContinuingCampaignId(null);
        setContinuingCampaignName('');
        setExcludedRecipients([]);
        setRecipientStats(null);
        setShowExcludedDetails(false);
      }
      
      // Notify parent component about the sent campaign
      onBulkSmsSent(campaign);
      
      // Show results
      alert(`Bulk SMS campaign completed.\nSuccessfully sent: ${summary.success}\nFailed: ${summary.failed}\n\nMessages have been added to your conversations.`);
      
      // Reset to step 1 for a new campaign
      setBulkSmsStep(1);
      setCsvData(null);
      setCsvRows([]);
      setCsvHeaders([]);
      setTemplateMessage('');
      setCampaignName('');
      setPhoneColumnName('');
      setContactNameColumn('');
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      alert(`Error sending bulk SMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInsertTag = (tag: string) => {
    // Set focus on the textarea to ensure selection/cursor state is available
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      
      // Get cursor position
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tag at cursor position
      const newText = 
        templateMessage.substring(0, start) +
        tag +
        templateMessage.substring(end);
      
      setTemplateMessage(newText);
      
      // Move cursor after the inserted tag (for next typing)
      setTimeout(() => {
        textarea.selectionStart = start + tag.length;
        textarea.selectionEnd = start + tag.length;
        textarea.focus();
      }, 0);
    } else {
      // Fallback if textarea not found
    setTemplateMessage(templateMessage + tag);
    }
  };

  // Calculate total cost for bulk SMS
  const calculateBulkSmsCost = () => {
    if (!templateMessage || csvRows.length === 0) return { total: 0, perMessage: 0 };
    
    // Get an average message length by rendering a few examples
    let totalLength = 0;
    const samplesToCheck = Math.min(csvRows.length, 5);
    
    for (let i = 0; i < samplesToCheck; i++) {
      const renderedMessage = renderTemplateForRow(templateMessage, csvRows[i]);
      totalLength += renderedMessage.length;
    }
    
    const averageLength = totalLength / samplesToCheck;
    const smsPerMessage = Math.ceil(averageLength / 160) || 1;
    const costPerMessage = (smsPerMessage * 0.5).toFixed(2);
    const totalCost = (csvRows.length * parseFloat(costPerMessage)).toFixed(2);
    
    return { total: totalCost, perMessage: costPerMessage };
  };

  // Find the active device
  const getActiveDevice = () => {
    const phone = phoneNumbers.find(p => p.id === activePhoneNumber);
    return {
      id: activePhoneNumber,
      device: phone?.device || 'Unknown device',
      number: phone?.number || ''
    };
  };

  const activeDeviceInfo = getActiveDevice();

  // Check if we can progress to the next step
  const canProgress = () => {
    if (bulkSmsStep === 1) return csvData !== null;
    if (bulkSmsStep === 2) return templateMessage.trim() !== '';
    return true;
  };

  // Handle continuing a campaign
  const handleContinueCampaign = async (campaignId: string, template: string, campaignName: string) => {
    try {
      // Set the continuing campaign state
      setContinuingCampaignId(campaignId);
      setContinuingCampaignName(campaignName);
      
      // Pre-fill the template message
      setTemplateMessage(template);
      
      // Get the original campaign details and message status
      const { getCampaignMessageStatus } = await import('../../services/supabase');
      const messageStatus = await getCampaignMessageStatus(campaignId);
      
      // Get campaign details to find the phone ID
      const { data: campaign, error: campaignError } = await supabase
        .from('bulk_campaigns')
        .select('phone_id')
        .eq('id', campaignId)
        .single();
        
      if (campaignError) throw campaignError;
      
      // Set the active phone number to the one used in the original campaign
      if (campaign.phone_id) {
        setActivePhoneNumber(campaign.phone_id);
      }
      
      // Create a list of recipients from the message status
      if (messageStatus && messageStatus.recipients) {
        // Filter out recipients who should be excluded:
        // - Failed messages
        // - Replied messages
        // - Opted out
        // - Manually stopped
        const eligibleRecipients = messageStatus.recipients.filter(recipient => {
          // Skip if no messages or no phone number
          if (!recipient.phoneNumber) return false;
          
          // Check messages for failures or replies
          const lastMessage = recipient.messages?.[0]; // Messages are sorted newest first
          
          // Exclude if message failed
          if (lastMessage?.status === 'failed' || 
              lastMessage?.extendedStatus === 'permanently_failed') {
            return false;
          }
          
          // Exclude if message wasn't delivered
          if (lastMessage?.status !== 'delivered') {
            return false;
          }
          
          // Note: replies and opt-outs will be excluded by getExcludedRecipients later
          return true;
        });
        
        // Format the eligible recipients for our CSV data structure
        const recipients = eligibleRecipients.map(recipient => ({
          phoneNumber: recipient.phoneNumber,
          name: recipient.name || ''
        }));
        
        // Create CSV-like data structure with headers
        const headers = ['phoneNumber', 'name'];
        
        // Set this as our CSV data
        setCsvHeaders(headers);
        setCsvRows(recipients);
        
        // Create a fake CSV file for display
        const csvContent = 'phoneNumber,name\n' + recipients.map(r => 
          `${r.phoneNumber},${r.name || ''}`
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], `${campaignName}_recipients.csv`, { type: 'text/csv' });
        
        // Set the CSV data file
        setCsvData(file);
        
        // Set the phone column name
        setPhoneColumnName('phoneNumber');
        
        // If we have names, also set the contact name column
        if (recipients.some(r => r.name)) {
          setContactNameColumn('name');
        }
        
        // Preload the campaign name
        setCampaignName(`${campaignName} (New Message)`);
        
        // Skip to the second step
        setBulkSmsStep(2);
      }
      
      // Switch to the Send tab
      setActiveTab('send');
      
    } catch (error) {
      console.error('Error continuing campaign:', error);
      alert('Failed to load campaign data. Please try again.');
    }
  };

  // Handle showing/hiding excluded recipient details
  const toggleExcludedDetails = () => {
    setShowExcludedDetails(!showExcludedDetails);
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (bulkSmsStep) {
      case 1:
        return (
          <BulkSmsUpload
            onFileUpload={handleFileUpload}
            csvData={csvData}
            phoneNumbers={phoneNumbers}
            activePhoneNumber={activePhoneNumber}
            setActivePhoneNumber={setActivePhoneNumber}
          />
        );
      case 2:
        return (
          <BulkSmsCompose 
            availableTags={availableTags}
            templateMessage={templateMessage}
            setTemplateMessage={setTemplateMessage}
            onInsertTag={handleInsertTag}
            smsMetrics={smsMetrics}
            activeDevice={activeDeviceInfo}
            onChangeDevice={() => setShowDeviceModal(true)}
            csvRows={csvRows}
            renderTemplateForRow={renderTemplateForRow}
            calculateBulkSmsCost={calculateBulkSmsCost}
          />
        );
      case 3:
        return (
          <BulkSmsTest 
            testRecipientNumber={testRecipientNumber}
            setTestRecipientNumber={setTestRecipientNumber}
            csvRows={csvRows}
            selectedTestRow={selectedTestRow}
            testPreview={testPreview}
            onChangeTestRow={handleChangeTestRow}
            onSendTest={handleSendTestSms}
          />
        );
      case 4:
        return (
          <BulkSmsSend 
            campaignName={campaignName}
            setCampaignName={setCampaignName}
            csvRows={csvRows}
            templateMessage={templateMessage}
            activeDevice={activeDeviceInfo}
            calculateBulkSmsCost={calculateBulkSmsCost}
            onSendBulk={handleSendBulkSms}
            saveToContacts={saveToContacts}
            setSaveToContacts={setSaveToContacts}
            csvHeaders={csvHeaders}
            contactNameColumn={contactNameColumn}
            setContactNameColumn={setContactNameColumn}
            overwriteExistingContacts={overwriteExistingContacts}
            setOverwriteExistingContacts={setOverwriteExistingContacts}
            phoneColumnName={phoneColumnName}
            setPhoneColumnName={setPhoneColumnName}
            isContinuingCampaign={!!continuingCampaignId}
            continuingCampaignName={continuingCampaignName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header 
        title={continuingCampaignId ? `Send New Message: ${continuingCampaignName}` : "Bulk SMS"}
        onBack={onBack}
        onOpenMessages={onOpenMessages}
        onOpenContacts={onOpenContacts}
        onOpenBulkSms={onOpenBulkSms}
        onOpenSettings={onOpenSettings}
      />
      
      {/* Tab Navigation */}
      <div className="bg-white border-b flex">
        <button
          className={`flex items-center justify-center py-4 px-6 font-medium text-sm ${
            activeTab === 'send' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('send')}
        >
          <Send className="w-4 h-4 mr-2" />
          {continuingCampaignId ? "Send New Message" : "Send Bulk SMS"}
        </button>
        <button
          className={`flex items-center justify-center py-4 px-6 font-medium text-sm ${
            activeTab === 'history' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('history')}
        >
          <Clock className="w-4 h-4 mr-2" />
          History
        </button>
      </div>
      
      {activeTab === 'send' ? (
        <>
          {/* Step indicator */}
          <div className="px-6 pt-6 bg-white border-b">
            {continuingCampaignId && (
              <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  You are sending a new message in campaign "{continuingCampaignName}" to the same recipients, 
                  excluding those who replied, opted out, or had failed/undelivered messages.
                </p>
                
                {/* Show recipient exclusion information after CSV upload */}
                {(bulkSmsStep > 1 && csvData && recipientStats) && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Recipient Analysis:</p>
                        <ul className="text-xs text-blue-700 mt-1">
                          <li>Original recipients: {recipientStats.total} recipients</li>
                          <li>Will receive message: {recipientStats.eligible} recipients</li>
                          <li>Excluded (already replied): {recipientStats.byReason.replied} recipients</li>
                          <li>Excluded (opted out): {recipientStats.byReason.opted_out} recipients</li>
                          <li>Excluded (delivery failed): {recipientStats.byReason.delivery_failed || 0} recipients</li>
                        </ul>
                      </div>
                      
                      <button 
                        onClick={toggleExcludedDetails}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded"
                      >
                        {showExcludedDetails ? 'Hide Details' : 'Show Details'}
                      </button>
                    </div>
                    
                    {/* Excluded recipients details */}
                    {showExcludedDetails && excludedRecipients.filter(r => r.excluded).length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto bg-white rounded p-2 text-xs">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="py-1 px-2">Phone Number</th>
                              <th className="py-1 px-2">Status</th>
                              <th className="py-1 px-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {excludedRecipients
                              .filter(r => r.excluded)
                              .map((recipient, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                  <td className="py-1 px-2">{recipient.phoneNumber}</td>
                                  <td className="py-1 px-2">Excluded</td>
                                  <td className="py-1 px-2">
                                    {recipient.reason === 'opted_out' && "Opted out (STOPP)"}
                                    {recipient.reason === 'opted_out_via_reply' && "Opted out via reply (STOPP)"}
                                    {recipient.reason === 'replied' && "Replied to campaign"}
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <StepIndicator 
              steps={steps}
              currentStep={bulkSmsStep}
              className="mb-6"
            />
          </div>
          
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
              {renderStepContent()}
            </div>
          </div>
          
          {/* Footer */}
          <BulkSmsFooter 
            currentStep={bulkSmsStep}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            isFirstStep={bulkSmsStep === 1}
            isLastStep={bulkSmsStep === 4}
            canProgress={canProgress()}
          />
        </>
      ) : (
        <BulkSmsHistory 
          campaigns={campaigns}
          onCreateNew={() => setActiveTab('send')}
          onRefresh={fetchCampaigns}
          onContinueCampaign={handleContinueCampaign}
        />
      )}
      
      {/* Device Selection Modal */}
      <DeviceSelectionModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        phoneNumbers={phoneNumbers}
        activePhoneNumber={activePhoneNumber}
        onSelect={setActivePhoneNumber}
      />
    </div>
  );
};

export default BulkSmsPage;