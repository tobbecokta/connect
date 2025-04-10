import React from 'react';
import Header from '../common/Header';

interface SettingsPageProps {
  onBack: () => void;
  onOpenMessages?: () => void;
  onOpenContacts?: () => void;
  onOpenBulkSms?: () => void;
  onOpenSettings?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onBack,
  onOpenMessages,
  onOpenContacts,
  onOpenBulkSms,
  onOpenSettings
}) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header 
        title="Settings"
        onBack={onBack}
        onOpenMessages={onOpenMessages}
        onOpenContacts={onOpenContacts}
        onOpenBulkSms={onOpenBulkSms}
        onOpenSettings={onOpenSettings}
      />

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
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

export default SettingsPage; 