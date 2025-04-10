import React, { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import Modal from '../ui/Modal';
import IconButton from '../ui/IconButton';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import Header from '../common/Header';

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  avatar: string;
}

interface ContactBookPageProps {
  contacts: Contact[];
  setContacts?: React.Dispatch<React.SetStateAction<Contact[]>>;
  onBack: () => void;
  onContactsChange?: () => Promise<void>;
  onOpenMessages?: () => void;
  onOpenContacts?: () => void;
  onOpenBulkSms?: () => void;
  onOpenSettings?: () => void;
}

const ContactBookPage: React.FC<ContactBookPageProps> = ({ 
  contacts, 
  setContacts, 
  onBack,
  onContactsChange,
  onOpenMessages,
  onOpenContacts,
  onOpenBulkSms,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [sortField, setSortField] = useState<'name' | 'phoneNumber'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deletingContact, setDeletingContact] = useState<number | null>(null);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    if (!contact) return false;
    const nameMatch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const phoneMatch = contact.phoneNumber?.includes(searchTerm) || false;
    return nameMatch || phoneMatch;
  });
  
  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const fieldA = sortField === 'name' ? (a.name || '').toLowerCase() : a.phoneNumber;
    const fieldB = sortField === 'name' ? (b.name || '').toLowerCase() : b.phoneNumber;
    
    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'name' | 'phoneNumber') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      const newContact = {
        id: Date.now(),
        name: newContactName.trim(),
        phoneNumber: newContactPhone.trim(),
        avatar: `https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&h=40&q=80`
      };
      
      if (setContacts) {
        setContacts(prevContacts => [...prevContacts, newContact]);
      }

      // Refresh contacts if callback provided
      if (onContactsChange) {
        onContactsChange();
      }
      
      setNewContactName('');
      setNewContactPhone('');
      setIsAddingContact(false);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name);
    setEditPhone(contact.phoneNumber);
  };

  const handleSaveEdit = () => {
    if (editingContact && editName.trim() && editPhone.trim()) {
      if (setContacts) {
        setContacts(prevContacts => 
          prevContacts.map(contact => 
            contact.id === editingContact.id
              ? { ...contact, name: editName.trim(), phoneNumber: editPhone.trim() }
              : contact
          )
        );
      }

      // Refresh contacts if callback provided
      if (onContactsChange) {
        onContactsChange();
      }
      
      setEditingContact(null);
    }
  };

  const handleDeleteContact = (id: number) => {
    setDeletingContact(id);
  };

  const handleConfirmDelete = () => {
    if (deletingContact !== null && setContacts) {
      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== deletingContact));
      setDeletingContact(null);

      // Refresh contacts if callback provided
      if (onContactsChange) {
        onContactsChange();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header 
        title="Contact Book"
        onBack={onBack}
        onOpenMessages={onOpenMessages}
        onOpenContacts={onOpenContacts}
        onOpenBulkSms={onOpenBulkSms}
        onOpenSettings={onOpenSettings}
      />
      
      {/* Contact List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ContactList
          contacts={contacts}
          filteredContacts={sortedContacts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEditContact}
          onDelete={handleDeleteContact}
          onAddNew={() => setIsAddingContact(true)}
          sortField={sortField}
          sortDirection={sortDirection}
          onToggleSort={toggleSort}
        />
      </div>
      
      {/* Add Contact Floating Button */}
      {!isAddingContact && (
        <div className="fixed bottom-16 md:bottom-5 right-5 z-20">
          <button 
            className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors duration-200"
            onClick={() => setIsAddingContact(true)}
            aria-label="Add contact"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddingContact}
        onClose={() => setIsAddingContact(false)}
        title="Add New Contact"
      >
        <ContactForm
          name={newContactName}
          phone={newContactPhone}
          onNameChange={setNewContactName}
          onPhoneChange={setNewContactPhone}
          onSubmit={handleAddContact}
          onCancel={() => setIsAddingContact(false)}
        />
      </Modal>
      
      {/* Edit Contact Modal */}
      <Modal
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        title="Edit Contact"
      >
        {editingContact && (
          <ContactForm
            name={editingContact.name}
            phone={editingContact.phone}
            onNameChange={(name) => setEditingContact({ ...editingContact, name })}
            onPhoneChange={(phone) => setEditingContact({ ...editingContact, phone })}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditingContact(null)}
          />
        )}
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        title="Delete Contact"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this contact?</p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeletingContact(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContactBookPage;