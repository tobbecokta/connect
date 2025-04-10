import React from 'react';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import Button from '../ui/Button';

interface BulkSmsTestProps {
  testRecipientNumber: string;
  setTestRecipientNumber: (value: string) => void;
  csvRows: any[];
  selectedTestRow: number;
  testPreview: {
    message: string;
    recipient: string;
  };
  onChangeTestRow: (direction: 'prev' | 'next') => void;
  onSendTest: () => void;
}

const BulkSmsTest: React.FC<BulkSmsTestProps> = ({
  testRecipientNumber,
  setTestRecipientNumber,
  csvRows,
  selectedTestRow,
  testPreview,
  onChangeTestRow,
  onSendTest,
}) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Test your message</h3>
        <p className="text-gray-600 mb-4">
          Send a test message to verify how it will look before sending to all recipients.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Test Mode:</span> Your test message will be sent to the specified number but won't be saved to your conversations.
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Enter test recipient number</label>
          <input
            type="text"
            placeholder="Enter phone number for test"
            value={testRecipientNumber}
            onChange={(e) => setTestRecipientNumber(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {csvRows.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test with contact data ({selectedTestRow + 1} of {csvRows.length})
            </label>
            
            <div className="flex items-center mb-3">
              <button 
                onClick={() => onChangeTestRow('prev')}
                disabled={selectedTestRow <= 0}
                className={`p-1 rounded-full ${
                  selectedTestRow <= 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'
                }`}
                aria-label="Previous contact"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-sm font-medium">
                  {csvRows[selectedTestRow]?.name || csvRows[selectedTestRow]?.company || 'Contact'} 
                  {csvRows[selectedTestRow]?.phone && ` (${csvRows[selectedTestRow]?.phone})`}
                </div>
              </div>
              
              <button 
                onClick={() => onChangeTestRow('next')}
                disabled={selectedTestRow >= csvRows.length - 1}
                className={`p-1 rounded-full ${
                  selectedTestRow >= csvRows.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'
                }`}
                aria-label="Next contact"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
              <div className="mb-2 text-sm text-gray-500">Message Preview:</div>
              <div className="p-3 bg-blue-500 text-white rounded-lg rounded-br-none">
                <p className="whitespace-pre-line">{testPreview.message}</p>
                <p className="text-xs mt-1 text-blue-100">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
              <div>
                <div className="text-sm font-medium">Contact details:</div>
                <div className="text-xs text-gray-600 mt-1">
                  {Object.entries(csvRows[selectedTestRow] || {}).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}:</span> {value as string}
                    </div>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={onSendTest}
                disabled={!testRecipientNumber}
                variant={testRecipientNumber ? 'primary' : 'secondary'}
              >
                Send Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkSmsTest;