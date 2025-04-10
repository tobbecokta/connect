import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Smartphone, ChevronDown } from 'lucide-react';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipient: string, message: string, recipientName: string) => void;
  onOpenDeviceModal: () => void;
  activePhoneNumber: {
    id: string;
    device: string;
  };
  onCheckContact: (phoneNumber: string) => {
    name: string;
    exists: boolean;
  };
  phoneNumbers: {
    id: string;
    device: string;
    number?: string;
  }[];
  onSelectDevice: (deviceId: string) => void;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  onOpenDeviceModal,
  activePhoneNumber,
  onCheckContact,
  phoneNumbers,
  onSelectDevice,
}) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [smsMetrics, setSmsMetrics] = useState({ charCount: 0, smsCount: 0, cost: '0.00' });
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const deviceButtonRef = React.useRef<HTMLButtonElement>(null);
  const deviceDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate SMS metrics
    const charCount = message.length;
    const smsCount = Math.ceil(charCount / 160) || 1;
    const cost = (smsCount * 0.5).toFixed(2);
    setSmsMetrics({ charCount, smsCount, cost });
  }, [message]);

  const handleRecipientChange = (value: string) => {
    setRecipient(value);
    
    // Check if contact exists
    if (value.length > 8) {
      const contact = onCheckContact(value);
      if (contact.exists) {
        setRecipientName(contact.name);
        setShowNameInput(false);
      } else {
        setShowNameInput(true);
        setRecipientName('');
      }
    } else {
      setShowNameInput(false);
    }
  };

  const handleSend = () => {
    if (recipient.trim() && message.trim()) {
      onSend(recipient, message, recipientName);
      setRecipient('');
      setMessage('');
      setRecipientName('');
      onClose();
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    onSelectDevice(deviceId);
    setShowDeviceDropdown(false);
  };

  const footer = (
    <div className="flex justify-end">
      <Button
        variant="outline"
        onClick={onClose}
        className="mr-2"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSend}
        disabled={!recipient.trim() || !message.trim()}
      >
        Send
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Message"
      footer={footer}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sending from</label>
          <div className="relative">
            <button
              ref={deviceButtonRef}
              className="w-full flex items-center justify-between p-2 border rounded-md hover:border-blue-500 transition-colors duration-200"
              onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
            >
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-gray-600" />
                <span>{activePhoneNumber?.device || 'Select device'}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {showDeviceDropdown && (
              <div
                ref={deviceDropdownRef}
                className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto"
              >
                {phoneNumbers?.map((phone) => (
                  <button
                    key={phone.id}
                    onClick={() => handleDeviceSelect(phone.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center"
                  >
                    <Smartphone className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{phone.device}</span>
                    {phone.number && (
                      <span className="ml-2 text-gray-500">({phone.number})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="text"
            placeholder="Phone number"
            value={recipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {recipientName && (
            <div className="mt-1 text-sm text-gray-600">
              <span>Contact: {recipientName}</span>
            </div>
          )}
          {showNameInput && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
              <input
                type="text"
                placeholder="Add a name for this contact"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            placeholder="Type your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          
          {message && (
            <div className="mt-2 text-sm flex justify-between text-gray-600">
              <span>{smsMetrics.charCount} characters</span>
              <span>{smsMetrics.smsCount} SMS ({smsMetrics.cost} SEK)</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NewMessageModal;