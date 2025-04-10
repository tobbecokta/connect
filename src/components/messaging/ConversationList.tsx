import React, { useState, useRef, useMemo, useEffect } from 'react';
import ConversationItem from './ConversationItem';
import { ArrowDownAZ, ArrowUpAZ, Bell, Filter, ArrowUpDown, Check } from 'lucide-react';

interface Conversation {
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
}

interface PhoneNumber {
  id: number;
  number: string;
  device: string;
  isDefault: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: number | null;
  phoneNumbers: PhoneNumber[];
  onSelectConversation: (id: number) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  sortOrder: 'latest' | 'oldest' | 'unread';
  onSortChange: (order: 'latest' | 'oldest' | 'unread') => void;
  onFilterChange: (phoneIds: number[] | null) => void;
  selectedPhoneIds: number[] | null;
  onLoadMore: () => void;
  hasMoreConversations: boolean;
  isLoadingMore: boolean;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  phoneNumbers,
  onSelectConversation,
  searchText,
  onSearchChange,
  sortOrder,
  onSortChange,
  onFilterChange,
  selectedPhoneIds,
  onLoadMore,
  hasMoreConversations,
  isLoadingMore,
}) => {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown && 
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node) &&
          filterButtonRef.current &&
          !filterButtonRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Filter conversations based on search text and selected phone
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = searchText.trim() 
      ? conversation.name.toLowerCase().includes(searchText.toLowerCase()) ||
        conversation.phoneNumber.includes(searchText) ||
        conversation.lastMessage.toLowerCase().includes(searchText.toLowerCase())
      : true;

    const matchesPhone = selectedPhoneIds ? selectedPhoneIds.includes(conversation.phoneId) : true;

    return matchesSearch && matchesPhone;
  });

  const getPhoneDeviceName = (phoneId: number) => {
    const phone = phoneNumbers.find(p => p.id === phoneId);
    return phone ? phone.device : 'Unknown';
  };

  // Get sort icon based on current sort
  const getSortIcon = () => {
    switch (sortOrder) {
      case 'latest':
        return <ArrowDownAZ size={18} className="text-gray-600" />;
      case 'oldest':
        return <ArrowUpAZ size={18} className="text-gray-600" />;
      case 'unread':
        return <Bell size={18} className="text-gray-600" />;
      default:
        return <ArrowDownAZ size={18} className="text-gray-600" />;
    }
  };

  // Toggle sort dropdown
  const toggleSortDropdown = () => {
    setShowSortDropdown(!showSortDropdown);
    setShowFilterDropdown(false);
  };

  // Toggle filter dropdown
  const toggleFilterDropdown = () => {
    setShowFilterDropdown(!showFilterDropdown);
    setShowSortDropdown(false);
  };

  // Get unique phone numbers from conversations
  const uniquePhoneNumbers = useMemo(() => {
    const numbers = new Set<number>();
    conversations.forEach(conversation => {
      if (conversation.phoneId) {
        numbers.add(conversation.phoneId);
      }
    });
    return Array.from(numbers);
  }, [conversations]);

  // Get phone number details for the unique numbers
  const availablePhoneNumbers = useMemo(() => {
    return uniquePhoneNumbers.map(id => phoneNumbers.find(p => p.id === id)).filter(Boolean) as PhoneNumber[];
  }, [uniquePhoneNumbers, phoneNumbers]);

  const handleFilterSelect = (phoneId: number | null) => {
    if (phoneId === null) {
      // Select "All Numbers"
      onFilterChange(null);
    } else {
      // Toggle the selected phone number
      const newSelectedIds = selectedPhoneIds ? [...selectedPhoneIds] : [];
      const index = newSelectedIds.indexOf(phoneId);
      
      if (index === -1) {
        newSelectedIds.push(phoneId);
      } else {
        newSelectedIds.splice(index, 1);
      }
      
      onFilterChange(newSelectedIds.length > 0 ? newSelectedIds : null);
    }
  };

  const isPhoneSelected = (phoneId: number) => {
    return selectedPhoneIds?.includes(phoneId) || false;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <Filter className="w-5 h-5" />
            </button>
            {showFilterDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border"
              >
                <div className="py-1">
                  <button
                    onClick={() => handleFilterSelect(null)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                      !selectedPhoneIds ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {!selectedPhoneIds && <Check className="w-3 h-3 text-white" />}
                    </div>
                    All Numbers
                  </button>
                  {availablePhoneNumbers.map((phone) => (
                    <button
                      key={phone.id}
                      onClick={() => handleFilterSelect(phone.id)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                        isPhoneSelected(phone.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {isPhoneSelected(phone.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {phone.device} {phone.number ? `(${phone.number})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onSortChange('latest');
                      setShowSortDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      sortOrder === 'latest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Latest First
                  </button>
                  <button
                    onClick={() => {
                      onSortChange('oldest');
                      setShowSortDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      sortOrder === 'oldest' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Oldest First
                  </button>
                  <button
                    onClick={() => {
                      onSortChange('unread');
                      setShowSortDropdown(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      sortOrder === 'unread' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Unread First
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center p-6 text-gray-500">
            <p>No conversations found</p>
          </div>
        ) : (
          <>
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={selectedConversation === conversation.id}
                phoneDeviceName={getPhoneDeviceName(conversation.phoneId)}
                onSelect={onSelectConversation}
              />
            ))}
            
            {hasMoreConversations && (
              <div className="p-4 text-center">
                <button 
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  {isLoadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationList;