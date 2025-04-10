import React from 'react';
import { Smartphone } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface ConversationItemProps {
  conversation: {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    phoneId: number;
    phoneNumber: string;
    automated?: boolean;
    onlyAutomated?: boolean;
    isBulk?: boolean;
    bulkCampaignName?: string;
    bulkCampaignId?: string;
  };
  isActive: boolean;
  phoneDeviceName: string;
  onSelect: (id: number) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  phoneDeviceName,
  onSelect,
}) => {
  // Create a display name that includes the phone device for clear identification
  const displayName = conversation.name || conversation.phoneNumber;

  return (
    <div
      className={`flex items-center p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors duration-200 ${isActive ? 'bg-blue-50' : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      <Avatar 
        src={conversation.avatar} 
        alt={displayName} 
        size="lg" 
      />
      
      <div className="flex-1 ml-4 min-w-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 truncate">
            <div className="flex flex-col">
              <h3 className="font-semibold truncate">{displayName}</h3>
              <div className="flex items-center text-xs text-gray-500">
                <Smartphone className="w-3 h-3 mr-0.5" />
                <span className="truncate font-medium">via {phoneDeviceName}</span>
              </div>
            </div>
            
            {conversation.automated && (
              <Badge variant="warning" size="sm">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-3 h-3 mr-1 fill-current" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
                </svg>
                <span className="truncate">Auto</span>
              </Badge>
            )}
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">{conversation.time}</span>
        </div>
        
        <div className="flex items-center mt-1">
          <p className={`text-sm ${conversation.automated ? 'text-amber-700' : 'text-gray-600'} truncate mr-2`}>
            {conversation.lastMessage}
          </p>
          {conversation.onlyAutomated && (
            <span className="text-xs italic text-amber-700 flex-shrink-0">No replies</span>
          )}
        </div>
      </div>
      
      {conversation.unread > 0 && (
        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs ml-2">
          {conversation.unread}
        </div>
      )}
    </div>
  );
};

export default ConversationItem;