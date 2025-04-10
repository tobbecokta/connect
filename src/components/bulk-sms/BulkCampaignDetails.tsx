import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, User, Clock, Check, X, Send, AlertCircle, Smartphone, Download, UserPlus, RefreshCw, Ban } from 'lucide-react';
import { getBulkCampaignDetails, getCampaignMessageStatus, getCampaignFailedNumbers } from '../../services/supabase';
import Button from '../ui/Button';
import * as elksApi from '../../services/elksApi';
import Badge from '../ui/Badge';

interface BulkCampaignDetailsProps {
  campaignId: string;
  onBack: () => void;
  onSendMoreMessages?: (campaignId: string, template: string, campaignName: string) => void;
}

const BulkCampaignDetails: React.FC<BulkCampaignDetailsProps> = ({ 
  campaignId, 
  onBack,
  onSendMoreMessages 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any>(null);
  const [messageStatus, setMessageStatus] = useState<any>(null);
  const [failedNumbers, setFailedNumbers] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingMessage, setRetryingMessage] = useState<string | null>(null);
  
  const fetchCampaignDetails = async () => {
    try {
      setLoading(true);
      
      // First get the basic campaign details
      const details = await getBulkCampaignDetails(campaignId);
      setCampaignDetails(details);
      
      try {
        // Then get the message status for all recipients
        const status = await getCampaignMessageStatus(campaignId);
        setMessageStatus(status);
      } catch (statusErr) {
        console.warn('Failed to get message status details, continuing with basic details:', statusErr);
        // Don't set error state, let the app continue with the basic details
      }
      
      try {
        // Fetch failed numbers
        const failed = await getCampaignFailedNumbers(campaignId);
        setFailedNumbers(failed || []);
      } catch (failedErr) {
        console.warn('Failed to get failed numbers, continuing without them:', failedErr);
        // Continue without failed numbers data
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCampaignDetails();
  }, [campaignId]);
  
  const handleSendMoreMessages = () => {
    if (onSendMoreMessages && campaignDetails?.campaign) {
      onSendMoreMessages(
        campaignDetails.campaign.id, 
        campaignDetails.campaign.template,
        campaignDetails.campaign.name
      );
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const refreshCampaignDetails = async () => {
    try {
      setRefreshing(true);
      await fetchCampaignDetails();
    } catch (error) {
      console.error("Error refreshing campaign details:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleRetryMessage = async (externalId: string) => {
    try {
      setRetryingMessage(externalId);
      
      // Call the retry API
      const result = await elksApi.retrySms(externalId);
      
      // Show success message
      alert(`Message has been scheduled for retry. New message ID: ${result.newExternalId}`);
      
      // Refresh the campaign details
      await refreshCampaignDetails();
    } catch (error) {
      console.error('Error retrying message:', error);
      alert(`Failed to retry message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRetryingMessage(null);
    }
  };
  
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="animate-pulse text-gray-500">Loading campaign details...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto bg-red-50 text-red-700 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p>{error}</p>
          <Button 
            className="mt-4"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Campaign List
          </Button>
        </div>
      </div>
    );
  }
  
  if (!campaignDetails) {
    return null;
  }
  
  const { campaign, recipients, totalRecipients, totalMessages } = campaignDetails;
  const { 
    recipients: statusRecipients = [], 
    totalRecipients: statusTotalRecipients = 0,
    stats = {
      delivered: 0,
      sent: 0,
      failed: 0,
      total: 0
    }
  } = messageStatus || {};
  
  // Use recipient_count from the campaign record when no detailed recipient data is available
  const displayedRecipientCount = statusTotalRecipients > 0 ? statusTotalRecipients : 
                                (totalRecipients > 0 ? totalRecipients : campaign.recipient_count || 0);
  
  // Get delivery statistics
  const deliveryStats = stats || {
    sent: 0,
    delivered: 0,
    failed: 0,
    total: 0
  };
  
  // Get status counts for display
  const statusCounts = {
    delivered: 0,
    sent: 0,
    failed: 0,
    blocked: 0,
    optedOut: 0,
    unknown: 0
  };
  
  // Count message statuses if we have status recipients data
  if (statusRecipients && statusRecipients.length > 0) {
    statusRecipients.forEach(recipient => {
      const lastMessage = recipient.messages?.[0]; // Messages are sorted newest first
      if (!lastMessage) return;
      
      if (lastMessage.status === 'delivered') {
        statusCounts.delivered += 1;
      } else if (lastMessage.status === 'sent') {
        statusCounts.sent += 1;
      } else if (lastMessage.status === 'failed' || lastMessage.extendedStatus === 'permanently_failed') {
        statusCounts.failed += 1;
      } else if (lastMessage.extendedStatus === 'blocked') {
        statusCounts.blocked += 1;
      } else if (lastMessage.extendedStatus === 'opted_out') {
        statusCounts.optedOut += 1;
      } else {
        statusCounts.unknown += 1;
      }
    });
  }
  
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button and campaign actions */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Campaigns
          </Button>
          
          {/* Actions */}
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshCampaignDetails}
              leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
              disabled={refreshing}
            >
              Refresh
            </Button>
          
            {/* Only show the send more messages button if the campaign status is 'sent' */}
            {campaign.status === 'sent' && onSendMoreMessages && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendMoreMessages}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Send New Message
              </Button>
            )}
          </div>
        </div>
        
        {/* Campaign header section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <div className="mt-2 flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>Sent: {formatDate(campaign.sent_at || campaign.created_at)}</span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Campaign ID: {campaign.id}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'sent' ? 'bg-green-100 text-green-800' : 
                campaign.status === 'failed' ? 'bg-red-100 text-red-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {campaign.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Recipients</div>
              <div className="text-xl font-semibold flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-500" />
                {displayedRecipientCount}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Total Messages</div>
              <div className="text-xl font-semibold flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-gray-500" />
                {totalMessages || displayedRecipientCount || 0}
              </div>
              {deliveryStats.failed > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-green-600">{deliveryStats.delivered} delivered</span>
                  {' · '}
                  <span className="text-blue-600">{deliveryStats.sent} sent</span>
                  {' · '}
                  <span className="text-red-600">{deliveryStats.failed} failed</span>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Sender Phone</div>
              <div className="text-xl font-semibold flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-gray-500" />
                {campaign.phone?.device || 'Unknown'}: {campaign.phone?.number || 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Template message */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Message Template</h3>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
              {campaign.template}
            </div>
          </div>
        </div>
        
        {/* Failed Numbers section */}
        {failedNumbers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-700 flex items-center">
              <X className="w-5 h-5 mr-2" />
              Permanently Failed Numbers
              <Badge className="ml-2 bg-red-100 text-red-800">{failedNumbers.length}</Badge>
            </h2>
            
            <div className="bg-red-50 p-4 rounded-lg mb-4 text-sm text-red-700">
              These numbers have been excluded from receiving further messages in this campaign
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Phone Number</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Reason</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Failed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failedNumbers.map((failed, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{failed.recipient_number}</td>
                      <td className="px-4 py-2">{failed.reason}</td>
                      <td className="px-4 py-2">
                        {formatDate(failed.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Recipients list */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Recipients</h2>
          
          {(!statusRecipients || statusRecipients.length === 0) ? (
            <div className="text-center py-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 text-lg">
                  This campaign was sent to <span className="font-bold">{displayedRecipientCount}</span> recipients.
                </p>
                {!messageStatus && (
                  <p className="text-sm text-gray-500 mt-2">
                    Detailed message status information is not available for this campaign.
                    {campaign.recipient_count > 0 && (
                      <> According to the campaign record, {campaign.recipient_count} message{campaign.recipient_count !== 1 ? 's were' : ' was'} sent.</>
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Status summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-md font-medium mb-3">Message Status Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Delivered: <strong>{statusCounts.delivered}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">Sent: <strong>{statusCounts.sent}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Failed: <strong>{statusCounts.failed}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm">Blocked: <strong>{statusCounts.blocked}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm">Opted Out: <strong>{statusCounts.optedOut}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-sm">Unknown: <strong>{statusCounts.unknown}</strong></span>
                  </div>
                </div>
              </div>
            
              {/* Recipient table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Recipient</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Phone Number</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statusRecipients.map((recipient) => {
                      const lastMessage = recipient.messages?.[0]; // First message is newest
                      
                      // Determine status badge styling
                      let statusBadge = { 
                        bg: 'bg-gray-100', 
                        text: 'text-gray-800',
                        label: 'Unknown'
                      };
                      
                      if (!lastMessage) {
                        statusBadge = { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
                      } else if (lastMessage.status === 'delivered') {
                        statusBadge = { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' };
                      } else if (lastMessage.status === 'sent') {
                        statusBadge = { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' };
                      } else if (lastMessage.status === 'failed') {
                        statusBadge = { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' };
                      } else if (lastMessage.extendedStatus === 'permanently_failed') {
                        statusBadge = { bg: 'bg-red-100', text: 'text-red-800', label: 'Permanently Failed' };
                      } else if (lastMessage.extendedStatus === 'blocked') {
                        statusBadge = { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Blocked' };
                      } else if (lastMessage.extendedStatus === 'opted_out') {
                        statusBadge = { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Opted Out (STOPP)' };
                      }
                      
                      return (
                        <tr key={recipient.phoneNumber} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{recipient.name || 'Unknown'}</td>
                          <td className="px-4 py-2">{recipient.phoneNumber}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {lastMessage?.timestamp ? formatDate(lastMessage?.timestamp) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkCampaignDetails; 