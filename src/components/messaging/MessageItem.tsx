import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Info, AlertCircle } from 'lucide-react';

interface MessageItemProps {
  message: {
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
  };
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  // Helper function to render recipient info icon with tooltip
  const renderRecipientInfo = () => {
    // Show info icon for both incoming and outgoing messages
    if ((message.sender === 'them' && message.receiverPhone) || 
        (message.sender === 'me' && message.receiverPhone)) {
      return (
        <div className="relative inline-block ml-2 group">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center border cursor-help ${
            message.sender === 'me' ? 'bg-blue-400 border-blue-300' : 'bg-gray-100 border-gray-300'
          }`}>
            <Info className={`w-3 h-3 ${message.sender === 'me' ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 shadow-lg whitespace-nowrap z-10">
            {message.sender === 'them' ? (
              // For incoming messages
              <div>Sent to: {message.receiverDevice ? `${message.receiverDevice} (${message.receiverPhone})` : message.receiverPhone}</div>
            ) : (
              // For outgoing messages
              <div>Sent from: {message.receiverDevice ? `${message.receiverDevice} (${message.receiverPhone})` : message.receiverPhone}</div>
            )}
            {message.sender === 'them' && message.phoneNumber && 
              <div>Sent from: {message.phoneNumber}</div>
            }
          </div>
        </div>
      );
    }
    return null;
  };

  // System message
  if (message.sender === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-full flex items-center max-w-xs md:max-w-md">
          <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      </div>
    );
  }

  if (message.automated) {
    // Special styling for campaign opt-out messages
    if (message.text.includes('removed from campaign') || message.text.includes('opted out of')) {
      return (
        <div className="flex justify-center my-4">
          <div className="bg-purple-100 border border-purple-300 text-purple-800 px-4 py-2 rounded-full flex items-center max-w-xs md:max-w-md">
            <svg 
              viewBox="0 0 24 24" 
              className="w-4 h-4 mr-2 fill-current text-purple-700"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2zm0 6h2v2h-2z"/>
            </svg>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      );
    }
    
    // Standard automated message styling
    return (
      <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={twMerge(
            'max-w-xs md:max-w-md rounded-lg p-3 shadow-sm border-2',
            message.sender === 'me'
              ? 'bg-amber-50 text-gray-800 rounded-br-none border-amber-300'
              : 'bg-white text-gray-800 rounded-bl-none border-amber-300'
          )}
        >
          <div className="flex items-center mb-1 bg-amber-100 -m-1 mb-2 p-1 rounded">
            <svg 
              viewBox="0 0 24 24" 
              className="w-4 h-4 mr-1 fill-current text-amber-700" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/>
            </svg>
            <span className="text-xs font-bold text-amber-700 uppercase">
              {message.apiSource || 'Automated Message'}
            </span>
          </div>
          <p className="whitespace-pre-line">{message.text}</p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span>{message.time}</span>
            {renderRecipientInfo()}
          </div>
        </div>
      </div>
    );
  }

  // Bulk SMS test message
  if (message.is_test && message.bulk_test) {
    return (
      <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-xs md:max-w-md rounded-lg p-3 shadow-sm bg-green-100 text-gray-800 border-l-4 border-green-500">
          <div className="flex items-center mb-1">
            <svg 
              viewBox="0 0 24 24" 
              className="w-4 h-4 mr-1 fill-current text-green-600" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <span className="text-xs font-bold text-green-700">BULK SMS TEST</span>
          </div>
          <p className="whitespace-pre-line">{message.text}</p>
          <div className="flex items-center justify-between mt-1 text-gray-500 text-xs">
            <div className="flex items-center">
              <span>{message.time}</span>
              {renderRecipientInfo()}
            </div>
            <span className="font-medium">Test #{message.bulk_test.test_row + 1}</span>
          </div>
        </div>
      </div>
    );
  }

  // Bulk SMS campaign message
  if (message.bulk_campaign) {
    return (
      <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={twMerge(
            'max-w-xs md:max-w-md rounded-lg p-3 shadow-sm border-2',
            message.sender === 'me'
              ? 'bg-purple-100 text-gray-800 rounded-br-none border-purple-400'
              : 'bg-white text-gray-800 rounded-bl-none border-purple-400'
          )}
        >
          <div className="flex items-center mb-1 bg-purple-200 -m-1 mb-2 p-1 rounded">
            <svg 
              viewBox="0 0 24 24" 
              className="w-4 h-4 mr-1 fill-current text-purple-700"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
            </svg>
            <span className="text-xs font-bold text-purple-700 uppercase">
              CAMPAIGN: {message.bulk_campaign.name}
            </span>
          </div>
          <p className="whitespace-pre-line">{message.text}</p>
          <div className="flex flex-col mt-2">
            <div className="flex items-center">
              <span className="text-xs text-gray-500">{message.time}</span>
              {renderRecipientInfo()}
            </div>
            {message.bulk_campaign.id && (
              <a 
                href={`#/bulk-sms/campaign/${message.bulk_campaign.id}`}
                className="text-xs text-purple-700 hover:text-purple-900 font-medium hover:underline mt-1"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== 'undefined') {
                    if (window.onBulkSmsClick) {
                      window.onBulkSmsClick();
                    }
                    window.location.hash = `campaign/${message.bulk_campaign.id}`;
                  }
                }}
              >
                View Campaign
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular message
  return (
    <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={twMerge(
          'max-w-xs md:max-w-md rounded-lg p-3 shadow-sm',
          message.sender === 'me'
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        )}
      >
        <p className="whitespace-pre-line">{message.text}</p>
        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center">
            <span className={`text-xs ${message.sender === 'me' ? 'text-blue-100' : 'text-gray-500'}`}>
              {message.time}
            </span>
            {renderRecipientInfo()}
          </div>
          {message.sender === 'me' && message.status && (
            <span className="ml-2">
              {message.status === 'sent' && (
                <svg className="w-4 h-4 text-blue-100" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              )}
              {message.status === 'delivered' && (
                <svg className="w-4 h-4 text-blue-100" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              )}
              {message.status === 'read' && (
                <svg className="w-4 h-4 text-blue-100" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 19v-8.93a2 2 0 01.89-1.66l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"></path>
                </svg>
              )}
              {message.status === 'failed' && (
                <svg className="w-4 h-4 text-red-300" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;