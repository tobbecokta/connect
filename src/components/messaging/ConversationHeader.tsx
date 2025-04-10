import React, { useState } from 'react';
import { ChevronLeft, MoreVertical, Edit2, Ban } from 'lucide-react';
import Avatar from '../ui/Avatar';
import IconButton from '../ui/IconButton';
import Badge from '../ui/Badge';

interface ConversationHeaderProps {
  chat: {
    id: number;
    name: string;
    phoneNumber: string;
    avatar: string;
  } | null;
  isMobile: boolean;
  onBackClick: () => void;
  onEditName: () => void;
  onMoreOptions: () => void;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isOptedOut?: boolean;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  chat,
  isMobile,
  onBackClick,
  onEditName,
  onMoreOptions,
  isEditing,
  editValue,
  onEditChange,
  onEditSave,
  onEditKeyPress,
  isOptedOut = false,
}) => {
  if (!chat) return null;

  return (
    <div className="bg-white border-b p-3 flex items-center">
      {isMobile && (
        <IconButton
          icon={<ChevronLeft />}
          onClick={onBackClick}
          ariaLabel="Back to conversations"
          className="mr-2 md:hidden"
        />
      )}
      
      <Avatar 
        src={chat.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80'} 
        alt="Contact" 
        size="md" 
      />
      
      <div className="flex-1 ml-3">
        {isEditing ? (
          <div className="flex items-center">
            <input
              type="text"
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditSave}
              onKeyPress={onEditKeyPress}
              className="flex-1 p-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter contact name"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center">
              <h2 className="font-semibold">
                {chat.name || chat.phoneNumber || 'Unknown'}
              </h2>
              <IconButton
                icon={<Edit2 className="w-4 h-4" />}
                onClick={onEditName}
                ariaLabel="Edit contact name"
                className="ml-2 text-gray-500"
                size="sm"
              />
              {isOptedOut && (
                <Badge variant="danger" size="sm" className="ml-2">
                  <Ban className="w-3 h-3 mr-1" />
                  STOPP
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">{chat.phoneNumber}</p>
            <p className="text-xs text-gray-400 opacity-70">ID: {chat.id}</p>
          </div>
        )}
      </div>
      
      <IconButton
        icon={<MoreVertical />}
        onClick={onMoreOptions}
        ariaLabel="More options"
        className="text-gray-600"
      />
    </div>
  );
};

export default ConversationHeader;