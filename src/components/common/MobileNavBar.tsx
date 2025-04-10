import React from 'react';
import { User, MessageSquare, Contact, Megaphone } from 'lucide-react';

interface MobileNavBarProps {
  onOpenMessages?: () => void;
  onOpenContacts?: () => void;
  onOpenBulkSms?: () => void;
  onOpenSettings?: () => void;
  currentPage: string;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({
  onOpenMessages,
  onOpenContacts,
  onOpenBulkSms,
  onOpenSettings,
  currentPage
}) => {
  return (
    <>
      {/* Spacer div to prevent content from being hidden behind the nav bar */}
      <div className="h-14 md:hidden"></div>
      
      {/* Actual navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-1.5 md:hidden z-10">
        <button 
          onClick={onOpenMessages}
          className={`flex flex-col items-center justify-center w-1/4 py-0.5 ${currentPage === 'main' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="mt-0.5 text-xs">SMS</span>
        </button>
        
        <button 
          onClick={onOpenContacts}
          className={`flex flex-col items-center justify-center w-1/4 py-0.5 ${currentPage === 'contacts' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Contact className="w-5 h-5" />
          <span className="mt-0.5 text-xs">Contacts</span>
        </button>
        
        <button 
          onClick={onOpenBulkSms}
          className={`flex flex-col items-center justify-center w-1/4 py-0.5 ${currentPage === 'bulkSms' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <Megaphone className="w-5 h-5" />
          <span className="mt-0.5 text-xs">Campaigns</span>
        </button>
        
        <button 
          onClick={onOpenSettings}
          className={`flex flex-col items-center justify-center w-1/4 py-0.5 ${currentPage === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}
        >
          <User className="w-5 h-5" />
          <span className="mt-0.5 text-xs">Profile</span>
        </button>
      </div>
    </>
  );
};

export default MobileNavBar; 