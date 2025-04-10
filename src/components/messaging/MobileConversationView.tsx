import React from 'react';
import ConversationHeader from './ConversationHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { MessageCircle } from 'lucide-react';

interface MobileConversationViewProps {
  selectedChat: {
    id: number;
    name: string;
    phoneNumber: string;
    avatar: string;
  } | null;
  messages: Array<{
    id: number | string;
    sender: 'me' | 'them';
    text: string;
    time: string;
    automated?: boolean;
    apiSource?: string;
    status?: string;
    receiverPhone?: string;
    receiverDevice?: string;
    senderName?: string;
    phoneNumber?: string;
  }>;
  onBackClick: () => void;
  onSendMessage: (text: string) => void;
  onEditName: () => void;
  onMoreOptions: () => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  activeDevice: {
    id: string;
    device: string;
    number?: string;
  };
  phoneNumbers: Array<{
    id: string;
    device: string;
    number?: string;
  }>;
  onSelectDevice: (deviceId: string) => void;
  isOptedOut?: boolean;
}

const MobileConversationView: React.FC<MobileConversationViewProps> = ({
  selectedChat,
  messages,
  onBackClick,
  onSendMessage,
  onEditName,
  onMoreOptions,
  isEditing,
  editValue,
  onEditChange,
  onEditSave,
  onEditKeyPress,
  activeDevice,
  phoneNumbers,
  onSelectDevice,
  isOptedOut = false,
}) => {
  if (!selectedChat) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ConversationHeader
        chat={selectedChat}
        isMobile={true}
        onBackClick={onBackClick}
        onEditName={onEditName}
        onMoreOptions={onMoreOptions}
        isEditing={isEditing}
        editValue={editValue}
        onEditChange={onEditChange}
        onEditSave={onEditSave}
        onEditKeyPress={onEditKeyPress}
        isOptedOut={isOptedOut}
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} />
        </div>
      </div>
      
      <MessageInput
        onSendMessage={onSendMessage}
        activeDevice={activeDevice}
        phoneNumbers={phoneNumbers}
        onSelectDevice={onSelectDevice}
      />
    </div>
  );
};

export default MobileConversationView;