import React, { useState } from 'react';
import { Smartphone, ChevronDown, Plus } from 'lucide-react';
import Button from '../ui/Button';

interface BulkSmsComposeProps {
  availableTags: string[];
  templateMessage: string;
  setTemplateMessage: (message: string) => void;
  onInsertTag: (tag: string) => void;
  smsMetrics: {
    charCount: number;
    smsCount: number;
    cost: string;
  };
  activeDevice: {
    id: number;
    device: string;
  };
  onChangeDevice: () => void;
  csvRows: any[];
  renderTemplateForRow: (template: string, rowData: Record<string, string>) => string;
  calculateBulkSmsCost: () => { total: number | string; perMessage: number | string };
}

const BulkSmsCompose: React.FC<BulkSmsComposeProps> = ({
  availableTags,
  templateMessage,
  setTemplateMessage,
  onInsertTag,
  smsMetrics,
  activeDevice,
  onChangeDevice,
  csvRows,
  renderTemplateForRow,
  calculateBulkSmsCost,
}) => {
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [fallbackValue, setFallbackValue] = useState('');

  const handleTagClick = (tag: string) => {
    // Regular tag click - insert directly
    onInsertTag(tag);
  };

  const handleAddFallback = (tag: string) => {
    setSelectedTag(tag);
    setFallbackValue('');
    setShowFallbackInput(true);
  };

  const handleInsertWithFallback = () => {
    if (!selectedTag || !fallbackValue.trim()) return;
    
    // Convert {{tag}} to {{tag | fallback}}
    const tagName = selectedTag.replace(/\{\{|\}\}/g, '');
    const tagWithFallback = `{{${tagName} | ${fallbackValue.trim()}}}`;
    
    onInsertTag(tagWithFallback);
    setShowFallbackInput(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Compose your message template</h3>
        <p className="text-gray-600 mb-4">
          Use dynamic variables to personalize each message with data from your CSV. For example, <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> will be replaced with the recipient's name.
          You can also set fallback values for missing data using <code className="bg-gray-100 px-1 rounded">{"{{name | Dear Customer}}"}</code>.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Dynamic Variables</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableTags.map((tag) => (
              <div key={tag} className="inline-flex">
                <button
                  onClick={() => handleTagClick(tag)}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-l text-sm hover:bg-blue-200 transition-colors duration-200"
                >
                  {tag}
                </button>
                <button
                  onClick={() => handleAddFallback(tag)}
                  className="px-1 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-r text-sm transition-colors duration-200 border-l border-blue-200"
                  title="Add fallback value"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Fallback value input */}
          {showFallbackInput && (
            <div className="bg-blue-50 p-3 rounded-lg mb-3 flex items-center">
              <span className="text-sm mr-2">
                Add fallback for <code className="bg-blue-100 px-1 rounded">{selectedTag}</code>:
              </span>
              <input
                type="text"
                value={fallbackValue}
                onChange={(e) => setFallbackValue(e.target.value)}
                placeholder="Enter fallback value"
                className="px-2 py-1 border rounded flex-1 mr-2"
                autoFocus
              />
              <Button 
                size="sm" 
                onClick={handleInsertWithFallback}
                disabled={!fallbackValue.trim()}
              >
                Insert
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFallbackInput(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          
          <textarea
            placeholder="Type your message template. Example: Hi {{first_name | there}}, we wanted to inform {{company}} about our new service in {{city}}. Line breaks are preserved."
            value={templateMessage}
            onChange={(e) => setTemplateMessage(e.target.value)}
            rows={6}
            className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Line breaks entered here will be preserved in the sent SMS messages.
          </p>
          
          {/* SMS metrics */}
          {templateMessage && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center text-sm">
                <div className="font-medium">Message metrics:</div>
                <div className="text-gray-600">{smsMetrics.charCount} characters</div>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <div>SMS count:</div>
                <div className="text-gray-600">{smsMetrics.smsCount} SMS ({smsMetrics.cost} SEK per message)</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Set sending device</h4>
          <div 
            className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:border-blue-500 transition-colors duration-200"
            onClick={onChangeDevice}
          >
            <div className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-gray-600" />
              <span>{activeDevice.device || 'Select device'}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </div>
        
        {csvRows.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border mt-6">
            <h4 className="font-medium text-sm mb-2">Preview with first contact:</h4>
            <div className="bg-white p-3 rounded border text-gray-800 whitespace-pre-line">
              {renderTemplateForRow(templateMessage, csvRows[0]) || 'Your message preview will appear here'}
            </div>
          </div>
        )}
        
        {templateMessage && (
          <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Recipients:</span> {csvRows.length}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Estimated total cost:</span> {calculateBulkSmsCost().total} SEK
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkSmsCompose;