import React, { useState, useRef } from 'react';
import { ChevronLeft, Search, Edit2, Trash2, X, Check, Plus, RefreshCw, ArrowDown, ArrowUp, Phone, User } from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  avatar: string;
}

interface ContactBookProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  onBack: () => void;
}

const ContactBook: React.FC<ContactBookProps> = ({ contacts, setContacts, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [editingContact, setEditingContact] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [sortField, setSortField] = useState<'name' | 'phoneNumber'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus search input on component mount
  React.useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const filteredContacts = contacts.filter(contact => {
    const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = contact.phoneNumber.includes(searchTerm);
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
      
      setContacts(prevContacts => [...prevContacts, newContact]);
      setNewContactName('');
      setNewContactPhone('');
      setIsAddingContact(false);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact.id);
    setEditName(contact.name);
    setEditPhone(contact.phoneNumber);
  };

  const handleSaveEdit = () => {
    if (editingContact && editName.trim() && editPhone.trim()) {
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === editingContact
            ? { ...contact, name: editName.trim(), phoneNumber: editPhone.trim() }
            : contact
        )
      );
      setEditingContact(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
  };

  const handleDeleteContact = (id: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      setContacts(prevContacts => prevContacts.filter(contact => contact.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white sticky top-0 z-10">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Contact Book</h1>
          </div>
        </div>
      </div>
      
      {/* Search & Filters */}
      <div className="p-4 bg-white border-b">
        <div className="relative mb-4">
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search contacts by name or phone" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          {searchTerm && (
            <button 
              className="absolute right-3 top-2.5 text-gray-400" 
              onClick={() => setSearchTerm('')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <span>{sortedContacts.length} contacts</span>
          </div>
          <div className="flex items-center">
            <button 
              className="flex items-center ml-2 px-2 py-1 border rounded hover:bg-gray-100"
              onClick={() => toggleSort('name')}
            >
              <span className="mr-1">Name</span>
              {sortField === 'name' && (
                sortDirection === 'asc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              )}
            </button>
            <button 
              className="flex items-center ml-2 px-2 py-1 border rounded hover:bg-gray-100"
              onClick={() => toggleSort('phoneNumber')}
            >
              <span className="mr-1">Phone</span>
              {sortField === 'phoneNumber' && (
                sortDirection === 'asc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              )}
            </button>
            <button 
              className="flex items-center ml-2 px-2 py-1 border rounded hover:bg-gray-100"
              onClick={() => setContacts([...contacts])}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {sortedContacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try a different search term' : 'Add contacts to your contact book'}
              </p>
              <button
                onClick={() => {
                  setIsAddingContact(true);
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Add Contact
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 px-4">
              {sortedContacts.map(contact => (
                <li key={contact.id} className="py-4">
                  {editingContact === contact.id ? (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center mb-3">
                        <img
                          src={contact.avatar}
                          alt={contact.name || 'Contact'}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <h3 className="text-lg font-medium">Edit Contact</h3>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-blue-500 text-white rounded"
                          disabled={!editName.trim() || !editPhone.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img
                          src={contact.avatar}
                          alt={contact.name || 'Contact'}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <h3 className="font-medium">{contact.name || 'Unnamed Contact'}</h3>
                          <p className="text-gray-600 text-sm">{contact.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-1 text-gray-500 hover:text-blue-500 rounded-full hover:bg-gray-100"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={`tel:${contact.phoneNumber}`}
                          className="p-1 text-gray-500 hover:text-green-500 rounded-full hover:bg-gray-100"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button
                          className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100"
                          onClick={() => handleDeleteContact(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Add Contact Button */}
      {!isAddingContact && (
        <div className="fixed bottom-5 right-5">
          <button 
            className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"
            onClick={() => setIsAddingContact(true)}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
      
      {/* Add Contact Form */}
      {isAddingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Add New Contact</h2>
              <button onClick={() => setIsAddingContact(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter contact name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleAddContact}
                  className={`px-4 py-2 rounded-lg ${
                    newContactName.trim() && newContactPhone.trim() 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!newContactName.trim() || !newContactPhone.trim()}
                >
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactBook;