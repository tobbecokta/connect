import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Smartphone, ChevronDown } from 'lucide-react';
import IconButton from '../ui/IconButton';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  activeDevice: {
    id: string;
    device: string;
    number?: string;
  };
  phoneNumbers: Array<{
    id: string;
    device: string;
    number?: string;
  }>;
  onSelectDevice: (deviceId: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  activeDevice,
  phoneNumbers,
  onSelectDevice,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);
  const deviceButtonRef = useRef<HTMLButtonElement>(null);

  // Calculate SMS metrics
  const calculateSmsMetrics = (text: string) => {
    const charCount = text.length;
    const smsCount = Math.ceil(charCount / 160) || 1;
    const cost = (smsCount * 0.5).toFixed(2);
    return { charCount, smsCount, cost };
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // If shift+enter is pressed, a new line will be inserted naturally
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowDeviceDropdown(false);
  };

  const toggleDeviceDropdown = () => {
    setShowDeviceDropdown(!showDeviceDropdown);
    setShowEmojiPicker(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle emoji picker
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current && 
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }

      // Handle device dropdown
      if (
        deviceDropdownRef.current &&
        !deviceDropdownRef.current.contains(event.target as Node) &&
        deviceButtonRef.current &&
        !deviceButtonRef.current.contains(event.target as Node)
      ) {
        setShowDeviceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const deviceDisplay = activeDevice.number 
    ? `${activeDevice.device} (${activeDevice.number})` 
    : activeDevice.device;

  const metrics = calculateSmsMetrics(message);

  return (
    <div className="p-3 bg-white border-t">
      {/* Device selector */}
      <div className="mb-2 relative">
        <button
          ref={deviceButtonRef}
          onClick={toggleDeviceDropdown}
          className="flex items-center text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-full transition-colors duration-200"
        >
          <Smartphone className="w-3 h-3 mr-1" />
          <span>Sending from: {deviceDisplay}</span>
          <ChevronDown className={`w-3 h-3 ml-1 transform transition-transform duration-200 ${showDeviceDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDeviceDropdown && phoneNumbers.length > 0 && (
          <div 
            ref={deviceDropdownRef}
            className="absolute left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto"
          >
            {phoneNumbers.map((device) => (
              <button
                key={device.id}
                onClick={() => {
                  onSelectDevice(device.id);
                  setShowDeviceDropdown(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center ${
                  device.id === activeDevice.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <Smartphone className="w-3 h-3 mr-2" />
                {device.number ? `${device.device} (${device.number})` : device.device}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center bg-gray-100 rounded-lg p-1 relative">
        <button
          ref={emojiButtonRef}
          onClick={toggleEmojiPicker}
          className="p-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-gray-200 transition-colors"
          aria-label="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-14 left-0 z-10"
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Message (Shift+Enter for new line)"
          className="flex-1 bg-transparent border-none focus:outline-none px-3 py-2 resize-none min-h-[40px] max-h-32"
          rows={message.split('\n').length > 3 ? 3 : message.split('\n').length || 1}
        />
        
        <IconButton
          icon={<Send />}
          onClick={handleSend}
          ariaLabel="Send message"
          variant={message.trim() ? 'primary' : 'secondary'}
          disabled={!message.trim()}
          className={message.trim() ? '' : 'opacity-50 cursor-not-allowed'}
        />
      </div>

      {/* Character count and cost */}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>{metrics.charCount} characters</span>
        <span>{metrics.smsCount} SMS ({metrics.cost} SEK)</span>
      </div>
    </div>
  );
};

export default MessageInput;