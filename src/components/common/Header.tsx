import React from 'react';
import { User, MessageSquare, Contact, Megaphone } from 'lucide-react';
import IconButton from '../ui/IconButton';
import Logo from '../ui/Logo';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  onOpenMessages?: () => void;
  onOpenContacts?: () => void;
  onOpenBulkSms?: () => void;
  onOpenSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  onOpenMessages,
  onOpenContacts,
  onOpenBulkSms,
  onOpenSettings,
}) => {
  return (
    <div className="bg-blue-600 text-white sticky top-0 z-10">
      <div className="w-full py-4 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Logo 
              onClick={onOpenMessages} 
              className="ml-2" 
            />
            <h1 className="text-xl font-bold ml-5">{title}</h1>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            {/* Messages Button */}
            {onOpenMessages && (
              <IconButton 
                icon={<MessageSquare className="w-5 h-5" />}
                onClick={onOpenMessages}
                ariaLabel="Messages"
                variant="primary"
              />
            )}
            
            {/* Contacts Button */}
            {onOpenContacts && (
              <IconButton 
                icon={<Contact className="w-5 h-5" />}
                onClick={onOpenContacts}
                ariaLabel="Contacts"
                variant="primary"
              />
            )}
            
            {/* Bulk SMS Button */}
            {onOpenBulkSms && (
              <IconButton 
                icon={<Megaphone className="w-5 h-5" />}
                onClick={onOpenBulkSms}
                ariaLabel="Bulk SMS"
                variant="primary"
              />
            )}
            
            {/* Profile Button */}
            {onOpenSettings && (
              <IconButton 
                icon={<User className="w-5 h-5" />}
                onClick={onOpenSettings}
                ariaLabel="Profile"
                variant="primary"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 