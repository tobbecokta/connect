import React from 'react';
import { User, Edit2, Trash2, Phone } from 'lucide-react';
import SearchInput from '../ui/SearchInput';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  avatar: string;
}

interface ContactListProps {
  contacts: Contact[];
  filteredContacts: Contact[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
  onAddNew: () => void;
  sortField: 'name' | 'phoneNumber';
  sortDirection: 'asc' | 'desc';
  onToggleSort: (field: 'name' | 'phoneNumber') => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  filteredContacts,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
  onAddNew,
  sortField,
  sortDirection,
  onToggleSort,
}) => {
  return (
    <>
      <div className="p-4 bg-white border-b">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search contacts by name or phone"
          autoFocus
        />
        
        <div className="flex justify-between items-center text-sm text-gray-600 mt-4">
          <div>
            <span>{filteredContacts.length} contacts</span>
          </div>
          <div className="flex items-center space-x-2">
            <SortButton
              label="Name"
              field="name"
              currentField={sortField}
              direction={sortDirection}
              onClick={() => onToggleSort('name')}
            />
            <SortButton
              label="Phone"
              field="phoneNumber"
              currentField={sortField}
              direction={sortDirection}
              onClick={() => onToggleSort('phoneNumber')}
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {filteredContacts.length === 0 ? (
            <EmptyContactList 
              searchTerm={searchTerm} 
              onAddNew={onAddNew} 
            />
          ) : (
            <ul className="divide-y divide-gray-200 px-4">
              {filteredContacts.map(contact => (
                <li key={contact.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar
                        src={contact.avatar}
                        alt={contact.name || 'Contact'}
                        size="md"
                      />
                      <div className="ml-3">
                        <h3 className="font-medium">{contact.name || 'Unnamed Contact'}</h3>
                        <p className="text-gray-600 text-sm">{contact.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="p-1 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => onEdit(contact)}
                        aria-label="Edit contact"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <a 
                        href={`tel:${contact.phoneNumber}`}
                        className="p-1 text-gray-500 hover:text-green-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        aria-label="Call contact"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button
                        className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => onDelete(contact.id)}
                        aria-label="Delete contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

const SortButton = ({ 
  label, 
  field, 
  currentField, 
  direction, 
  onClick 
}: { 
  label: string;
  field: 'name' | 'phoneNumber';
  currentField: 'name' | 'phoneNumber';
  direction: 'asc' | 'desc';
  onClick: () => void;
}) => {
  const isActive = currentField === field;
  
  return (
    <button 
      className={`flex items-center px-2 py-1 border rounded transition-colors duration-200 ${
        isActive ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      <span className={isActive ? 'text-blue-700' : 'text-gray-600'}>{label}</span>
      {isActive && (
        <svg 
          className={`w-3 h-3 ml-1 fill-current ${isActive ? 'text-blue-700' : 'text-gray-400'}`} 
          viewBox="0 0 24 24"
        >
          {direction === 'asc' ? (
            <path d="M7 14l5-5 5 5H7z" />
          ) : (
            <path d="M7 10l5 5 5-5H7z" />
          )}
        </svg>
      )}
    </button>
  );
};

const EmptyContactList = ({ 
  searchTerm, 
  onAddNew 
}: { 
  searchTerm: string;
  onAddNew: () => void;
}) => (
  <div className="p-8 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <User className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium mb-2">No contacts found</h3>
    <p className="text-gray-600 mb-4">
      {searchTerm ? 'Try a different search term' : 'Add contacts to your contact book'}
    </p>
    <Button 
      onClick={onAddNew}
    >
      Add Contact
    </Button>
  </div>
);

export default ContactList;