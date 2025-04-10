import React from 'react';
import { LogOut } from 'lucide-react';
import Header from '../common/Header';
import { useAuth } from '../../context/AuthContext';

interface ProfilePageProps {
  onBack: () => void;
  onOpenMessages?: () => void;
  onOpenContacts?: () => void;
  onOpenBulkSms?: () => void;
  onOpenSettings?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  onBack,
  onOpenMessages,
  onOpenContacts,
  onOpenBulkSms,
  onOpenSettings
}) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header 
        title="Profile"
        onBack={onBack}
        onOpenMessages={onOpenMessages}
        onOpenContacts={onOpenContacts}
        onOpenBulkSms={onOpenBulkSms}
        onOpenSettings={onOpenSettings}
      />

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          {/* User Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Account</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-800">{user?.email}</p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
            {/* Notifications Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="desktop-notifications" className="flex-1">
                    Desktop notifications
                    <p className="text-sm text-gray-500">Get notified about new messages</p>
                  </label>
                  <input
                    type="checkbox"
                    id="desktop-notifications"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="sound-notifications" className="flex-1">
                    Sound notifications
                    <p className="text-sm text-gray-500">Play a sound for new messages</p>
                  </label>
                  <input
                    type="checkbox"
                    id="sound-notifications"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="darkmode" className="flex-1">
                    Dark mode
                    <p className="text-sm text-gray-500">Use dark theme</p>
                  </label>
                  <input
                    type="checkbox"
                    id="darkmode"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Message Settings Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Message Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="read-receipts" className="flex-1">
                    Send read receipts
                    <p className="text-sm text-gray-500">Let others know when you've read their messages</p>
                  </label>
                  <input
                    type="checkbox"
                    id="read-receipts"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 