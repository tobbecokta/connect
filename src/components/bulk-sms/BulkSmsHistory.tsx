import React, { useState } from 'react';
import { Clock, RefreshCw, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import BulkCampaignDetails from './BulkCampaignDetails';

interface Campaign {
  id: string;
  name: string;
  created_at: string;
  sent_at: string;
  recipient_count: number;
  template: string;
  status: string;
}

interface BulkSmsHistoryProps {
  campaigns: Campaign[];
  onCreateNew: () => void;
  onRefresh?: () => void;
  onContinueCampaign?: (campaignId: string, template: string, campaignName: string) => void;
}

const BulkSmsHistory: React.FC<BulkSmsHistoryProps> = ({ 
  campaigns, 
  onCreateNew, 
  onRefresh,
  onContinueCampaign
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  
  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
  };
  
  const handleBackToList = () => {
    setSelectedCampaignId(null);
  };
  
  // Display campaign details if a campaign is selected
  if (selectedCampaignId) {
    return (
      <BulkCampaignDetails 
        campaignId={selectedCampaignId} 
        onBack={handleBackToList}
        onSendMoreMessages={onContinueCampaign}
      />
    );
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Bulk SMS History</h2>
        
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No bulk SMS history yet</h3>
            <p className="text-gray-600 mb-4">Your sent bulk SMS campaigns will appear here</p>
            <Button onClick={onCreateNew}>
              Create Bulk SMS
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Your sent bulk SMS campaigns</h3>
            </div>
            
            <div className="divide-y">
              {campaigns.map((campaign) => (
                <div 
                  key={campaign.id} 
                  className="py-4 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg px-2"
                  onClick={() => handleSelectCampaign(campaign.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{campaign.name || "Unnamed Campaign"}</span>
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(campaign.sent_at || campaign.created_at)} - Sent to {campaign.recipient_count} recipients
                        <span className="ml-2 text-xs text-gray-500">ID: {campaign.id.substring(0, 8)}</span>
                      </p>
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-1" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {campaign.template.length > 100 
                        ? campaign.template.substring(0, 100) + '...' 
                        : campaign.template}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkSmsHistory;