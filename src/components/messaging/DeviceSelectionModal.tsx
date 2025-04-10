import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Smartphone, Check, Phone } from 'lucide-react';

interface DeviceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumbers: Array<{
    id: string;
    number: string;
    device: string;
    is_default: boolean;
  }>;
  activePhoneNumber: string;
  onSelect: (id: string) => void;
}

const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  isOpen,
  onClose,
  phoneNumbers,
  activePhoneNumber,
  onSelect,
}) => {
  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Your Phone Numbers"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Select the phone number you want to use for messaging</p>
        
        <div className="max-h-60 overflow-y-auto">
          {phoneNumbers.length === 0 ? (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No phone numbers available</p>
              <p className="text-xs text-gray-400 mt-1">Contact your administrator to add phone numbers</p>
            </div>
          ) : (
            phoneNumbers.map((phone) => (
              <div 
                key={phone.id} 
                className={`flex items-center justify-between p-3 border-b cursor-pointer transition-colors duration-200 ${
                  activePhoneNumber === phone.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelect(phone.id)}
              >
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <p className="font-medium">{phone.device}</p>
                    <p className="text-sm text-gray-600">{phone.number}</p>
                    {phone.is_default && (
                      <span className="text-xs text-blue-600">Default Sender</span>
                    )}
                  </div>
                </div>
                
                {activePhoneNumber === phone.id && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Need to add a new number?</p>
              <p className="text-sm text-gray-600">Contact your system administrator</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <Button
          onClick={onClose}
          variant="outline"
          fullWidth
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default DeviceSelectionModal;