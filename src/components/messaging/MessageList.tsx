import React, { useRef, useEffect, useState } from 'react';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Array<{
    id: number | string;
    sender: 'me' | 'them' | 'system';
    text: string;
    time: string;
    automated?: boolean;
    apiSource?: string;
    status?: string;
    externalId?: string;
    bulk_campaign?: {
      id: string;
      name: string;
      date: string;
    };
    bulk_test?: {
      template: string;
      test_row: number;
    };
    is_test?: boolean;
    receiverPhone?: string;
    receiverDevice?: string;
    senderName?: string;
    phoneNumber?: string;
  }>;
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const firstLoadRef = useRef<boolean>(true);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [prevMessagesLength, setPrevMessagesLength] = useState(messages.length);

  // Detect when user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    
    if (!isAtBottom) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Consolidated scroll logic into a single useEffect
  useEffect(() => {
    // Only scroll to bottom if:
    // 1. It's the initial load, OR
    // 2. User is already at the bottom, OR
    // 3. A new message has been added
    const hasNewMessages = messages.length > prevMessagesLength;
    
    // Check if this is the first load
    if (firstLoadRef.current) {
      console.log('First load - scrolling to bottom');
      scrollToBottom();
      firstLoadRef.current = false;
    } else if (!userHasScrolled || hasNewMessages) {
      // Only scroll if the user is already at the bottom or there are new messages
      scrollToBottom();
    }
    
    setPrevMessagesLength(messages.length);
    
    // Debug info
    if (hasNewMessages) {
      console.log('New messages arrived - scrolling to bottom');
    }
  }, [messages, userHasScrolled, prevMessagesLength]);

  // Monitor conversation changes to reset the firstLoad flag
  useEffect(() => {
    // If the messages array is reset (length becomes 0), treat this as a new conversation
    if (messages.length === 0) {
      firstLoadRef.current = true;
      setUserHasScrolled(false);
    }
  }, [messages.length]);

  return (
    <div 
      className="h-full overflow-y-auto p-4 bg-gray-100 custom-scrollbar"
      ref={messagesContainerRef}
      onScroll={handleScroll}
    >
      <div className="space-y-3">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;