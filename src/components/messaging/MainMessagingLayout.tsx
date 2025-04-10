import React, { useState } from 'react';
import { MessageCircle as Message } from 'lucide-react';
import ConversationList from './ConversationList';
import MobileConversationView from './MobileConversationView';
import IconButton from '../ui/IconButton';
import NewMessageModal from './NewMessageModal';
import DeviceSelectionModal from './DeviceSelectionModal';
import Header from '../common/Header';

interface MainMessagingLayoutProps {
  conversations: any[];
  messages: any[];
  selectedChat: number | null;
  phoneNumbers: any[];
  activePhoneNumber: string;
  contacts: any[];
  setSelectedChat: (id: number | null) => void;
  setShowMobileConversation: (show: boolean) => void;
  showMobileConversation: boolean;
  setMessageText: (text: string) => void;
  setShowDeviceModal: (show: boolean) => void;
  showDeviceModal: boolean;
  setActivePhoneNumber: (id: string) => void;
  setShowFilterDropdown: (show: boolean) => void;
  setShowSearchDropdown: (show: boolean) => void;
  setShowNewSmsModal: (show: boolean) => void;
  showNewSmsModal: boolean;
  setEditingContactName: (editing: boolean) => void;
  editingContactName: boolean;
  contactNameEdit: string;
  setContactNameEdit: (name: string) => void;
  setShowMoreOptions: (show: boolean) => void;
  handleSaveContactName: () => void;
  handleEditContactName: () => void;
  handleOpenBulkSms: () => void;
  handleOpenContacts: () => void;
  handleOpenSettings: () => void;
  handleSendNewSms: (recipient: string, message: string, recipientName: string) => void;
  sendMessage: (text: string) => void;
  handleBackToList: () => void;
  searchText: string;
  setSearchText: (text: string) => void;
  activeDeviceInfo: { id: string; device: string };
  sortOrder: 'latest' | 'oldest' | 'unread';
  setSortOrder: (order: 'latest' | 'oldest' | 'unread') => void;
  isOptedOut?: boolean;
  onLoadMore: () => void;
  hasMoreConversations: boolean;
  isLoadingMore: boolean;
}

const MainMessagingLayout: React.FC<MainMessagingLayoutProps> = ({
  conversations,
  messages,
  selectedChat,
  phoneNumbers,
  activePhoneNumber,
  contacts,
  setSelectedChat,
  setShowMobileConversation,
  showMobileConversation,
  setMessageText,
  setShowDeviceModal,
  showDeviceModal,
  setActivePhoneNumber,
  setShowFilterDropdown,
  setShowSearchDropdown,
  setShowNewSmsModal,
  showNewSmsModal,
  setEditingContactName,
  editingContactName,
  contactNameEdit,
  setContactNameEdit,
  setShowMoreOptions,
  handleSaveContactName,
  handleEditContactName,
  handleOpenBulkSms,
  handleOpenContacts,
  handleOpenSettings,
  handleSendNewSms,
  sendMessage,
  handleBackToList,
  searchText,
  setSearchText,
  activeDeviceInfo,
  sortOrder,
  setSortOrder,
  isOptedOut,
  onLoadMore,
  hasMoreConversations,
  isLoadingMore,
}) => {
  const selectedChatDetails = conversations.find(c => c.id === selectedChat) || null;
  
  // Local state for dropdowns
  const [localShowSearchDropdown, setLocalShowSearchDropdown] = useState(false);
  const [localShowFilterDropdown, setLocalShowFilterDropdown] = useState(false);
  const [selectedPhoneIds, setSelectedPhoneIds] = useState<number[] | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedPhoneId, setSelectedPhoneId] = useState<number | null>(null);
  
  const handleChatSelect = (chatId: number) => {
    setSelectedChat(chatId);
    setShowMobileConversation(true);
    setEditingContactName(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveContactName();
    }
  };

  const checkContact = (phoneNumber: string) => {
    const matchingContact = contacts.find(contact => 
      contact.phoneNumber && contact.phoneNumber.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '')
    );
    
    return {
      name: matchingContact?.name || '',
      exists: !!matchingContact
    };
  };

  // Responsive layout classes
  const conversationListClasses = showMobileConversation 
    ? 'hidden md:block md:w-1/3 border-r' 
    : 'w-full md:w-1/3 border-r';
  
  const conversationDetailClasses = showMobileConversation
    ? 'w-full' 
    : 'hidden md:block md:w-2/3';

  // Function to toggle search dropdown
  const toggleSearchDropdown = () => {
    setLocalShowSearchDropdown(!localShowSearchDropdown);
    setLocalShowFilterDropdown(false);
    setShowSearchDropdown(!localShowSearchDropdown);
    setShowFilterDropdown(false);
  };

  // Function to toggle filter dropdown
  const toggleFilterDropdown = () => {
    setLocalShowFilterDropdown(!localShowFilterDropdown);
    setLocalShowSearchDropdown(false);
    setShowFilterDropdown(!localShowFilterDropdown);
    setShowSearchDropdown(false);
  };

  return (
    <>
      <Header 
        title="Messages"
        onOpenMessages={() => {
          setSelectedChat(null);
          setShowMobileConversation(false);
        }}
        onOpenContacts={handleOpenContacts}
        onOpenBulkSms={handleOpenBulkSms}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className={conversationListClasses}>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedChat}
            phoneNumbers={phoneNumbers}
            onSelectConversation={handleChatSelect}
            searchText={searchText}
            onSearchChange={setSearchText}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            onFilterChange={setSelectedPhoneIds}
            selectedPhoneIds={selectedPhoneIds}
            onLoadMore={onLoadMore}
            hasMoreConversations={hasMoreConversations}
            isLoadingMore={isLoadingMore}
          />
        </div>

        {/* Conversation Detail */}
        <div className={conversationDetailClasses}>
          {selectedChatDetails ? (
            <MobileConversationView
              selectedChat={selectedChatDetails}
              messages={messages}
              onBackClick={handleBackToList}
              onSendMessage={sendMessage}
              onEditName={handleEditContactName}
              onMoreOptions={() => setShowMoreOptions(true)}
              isEditing={editingContactName}
              editValue={contactNameEdit}
              onEditChange={setContactNameEdit}
              onEditSave={handleSaveContactName}
              onEditKeyPress={handleKeyPress}
              activeDevice={activeDeviceInfo}
              phoneNumbers={phoneNumbers}
              onSelectDevice={setActivePhoneNumber}
              isOptedOut={isOptedOut}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* New SMS Floating Action Button - Only show when not in a conversation */}
      {!showMobileConversation && (
        <div className="fixed bottom-16 md:bottom-5 right-5 z-20">
          <button 
            className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors duration-200"
            onClick={() => setShowNewSmsModal(true)}
            aria-label="New message"
          >
            <Message className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* New Message Modal */}
      <NewMessageModal
        isOpen={showNewSmsModal}
        onClose={() => setShowNewSmsModal(false)}
        onSend={handleSendNewSms}
        phoneNumbers={phoneNumbers}
        activePhoneNumber={activeDeviceInfo}
        onSelectDevice={setActivePhoneNumber}
        onCheckContact={checkContact}
        contacts={contacts}
      />
      
      {/* Device Selection Modal */}
      <DeviceSelectionModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        phoneNumbers={phoneNumbers}
        activePhoneNumber={activePhoneNumber}
        onSelect={setActivePhoneNumber}
      />
    </>
  );
};

export default MainMessagingLayout;