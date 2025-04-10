import React from 'react';
import Button from '../ui/Button';

interface ContactFormProps {
  name: string;
  setName: (value: string) => void;
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  contact?: {
    id: number;
    name: string;
    phoneNumber: string;
    avatar: string;
  };
}

const ContactForm: React.FC<ContactFormProps> = ({
  name,
  setName,
  phoneNumber,
  setPhoneNumber,
  onSave,
  onCancel,
  isEditing = false,
  contact,
}) => {
  return (
    <div className="space-y-4">
      {isEditing && contact && (
        <div className="flex items-center mb-3">
          <img
            src={contact.avatar}
            alt={contact.name || 'Contact'}
            className="w-10 h-10 rounded-full mr-3"
          />
          <h3 className="text-lg font-medium">Edit Contact</h3>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          placeholder="Enter contact name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
          autoFocus
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="text"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow duration-200"
        />
      </div>
      
      <div className="flex justify-end pt-2 space-x-2">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={!name.trim() || !phoneNumber.trim()}
        >
          {isEditing ? 'Save Changes' : 'Add Contact'}
        </Button>
      </div>
    </div>
  );
};

export default ContactForm;