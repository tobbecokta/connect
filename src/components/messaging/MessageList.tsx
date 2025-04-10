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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only scroll to bottom if:
    // 1. User hasn't manually scrolled up, OR
    // 2. New message has been added
    const hasNewMessages = messages.length > prevMessagesLength;
    
    if (!userHasScrolled || hasNewMessages) {
      scrollToBottom();
    }
    
    setPrevMessagesLength(messages.length);
  }, [messages, userHasScrolled, prevMessagesLength]);

  // Log messages for debugging
  useEffect(() => {
    console.log('Rendering messages in MessageList:', messages);
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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