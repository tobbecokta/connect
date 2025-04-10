import React from 'react';
import { AlertCircle, BookOpen, Phone } from 'lucide-react';
import Button from '../ui/Button';

interface BulkSmsSendProps {
  campaignName: string;
  setCampaignName: (name: string) => void;
  csvRows: any[];
  templateMessage: string;
  activeDevice: {
    id: number;
    device: string;
    number: string;
  };
  calculateBulkSmsCost: () => { total: number | string; perMessage: number | string };
  onSendBulk: () => void;
  saveToContacts: boolean;
  setSaveToContacts: (save: boolean) => void;
  csvHeaders: string[];
  contactNameColumn: string;
  setContactNameColumn: (column: string) => void;
  overwriteExistingContacts: boolean;
  setOverwriteExistingContacts: (overwrite: boolean) => void;
  phoneColumnName: string;
  setPhoneColumnName: (column: string) => void;
  isContinuingCampaign?: boolean;
  continuingCampaignName?: string;
}

const BulkSmsSend: React.FC<BulkSmsSendProps> = ({
  campaignName,
  setCampaignName,
  csvRows,
  templateMessage,
  activeDevice,
  calculateBulkSmsCost,
  onSendBulk,
  saveToContacts,
  setSaveToContacts,
  csvHeaders,
  contactNameColumn,
  setContactNameColumn,
  overwriteExistingContacts,
  setOverwriteExistingContacts,
  phoneColumnName,
  setPhoneColumnName,
  isContinuingCampaign = false,
  continuingCampaignName
}) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Send Bulk SMS</h2>
      
      {/* Campaign name input */}
      <div className="mb-6">
        <label htmlFor="campaignName" className="block text-sm font-medium mb-2">Campaign Name</label>
        <input
          type="text"
          id="campaignName"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="block w-full max-w-md p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter a name for this campaign"
        />
      </div>

      {/* CSV Data Preview */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Recipient Data</h3>

        {isContinuingCampaign && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700">
              <strong>Continuing campaign:</strong> {continuingCampaignName || 'Previous campaign'}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              {csvRows.length} recipients loaded from the original campaign. Recipients who have replied or opted out will be automatically excluded when you send.
            </p>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {csvHeaders.map((header, i) => (
                  <th key={i} className="px-4 py-2 text-left font-medium">
                    {header}
                    
                    {/* Phone column selector */}
                    {header === phoneColumnName ? (
                      <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Phone
                      </span>
                    ) : (
                      <button
                        className="ml-1 text-xs text-blue-500 hover:text-blue-700"
                        onClick={() => setPhoneColumnName(header)}
                      >
                        Set as phone
                      </button>
                    )}
                    
                    {/* Contact name column selector */}
                    {saveToContacts && (
                      <>
                        {header === contactNameColumn ? (
                          <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Name
                          </span>
                        ) : (
                          <button
                            className="ml-1 text-xs text-purple-500 hover:text-purple-700"
                            onClick={() => setContactNameColumn(header)}
                          >
                            Set as name
                          </button>
                        )}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {csvRows.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {csvHeaders.map((header, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2">
                      {row[header] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {csvRows.length > 5 && (
            <div className="text-center mt-2 text-gray-500 text-sm">
              {csvRows.length - 5} more rows not shown
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-700">
          <p>Total recipients: <strong>{csvRows.length}</strong></p>
        </div>
      </div>

      {/* Phone number selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">
          Sender Phone
        </h3>
        <div className="flex items-center">
          <div className="bg-gray-100 p-3 rounded-md flex items-center">
            <Phone className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <div className="font-medium">{activeDevice.device}</div>
              <div className="text-sm text-gray-600">{activeDevice.number}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save to contacts option */}
      <div className="mb-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="saveToContacts"
            checked={saveToContacts}
            onChange={(e) => setSaveToContacts(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="saveToContacts" className="ml-2 block text-sm">
            Save recipients to contact book
          </label>
        </div>
        
        {saveToContacts && (
          <div className="mt-3 ml-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="overwriteExisting"
                checked={overwriteExistingContacts}
                onChange={(e) => setOverwriteExistingContacts(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="overwriteExisting" className="ml-2 block text-sm">
                Overwrite existing contact names
              </label>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Name column:</label>
              <select
                value={contactNameColumn}
                onChange={(e) => setContactNameColumn(e.target.value)}
                className="block w-full max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a column --</option>
                {csvHeaders.map((header) => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* SMS Cost Calculation */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Estimated Cost</h3>
        <div className="bg-gray-50 p-4 rounded-md shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Cost per message:</div>
              <div className="font-medium">${calculateBulkSmsCost().perMessage}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total recipients:</div>
              <div className="font-medium">{csvRows.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total cost:</div>
              <div className="font-medium">${calculateBulkSmsCost().total}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Send Button */}
      <div className="mt-8 flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={onSendBulk}
          disabled={!phoneColumnName || !campaignName.trim() || !templateMessage.trim()}
        >
          Send Bulk SMS
        </Button>
      </div>
      
      {/* Warning about recipient exclusions */}
      {isContinuingCampaign && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Important:</h4>
              <p className="text-sm text-yellow-700 mt-1">
                When you send, the system will automatically exclude:
              </p>
              <ul className="list-disc ml-5 text-sm text-yellow-700 mt-2">
                <li>Recipients who have replied to previous messages in this campaign</li>
                <li>Recipients who have sent STOPP to opt out</li>
                <li>Recipients whose previous message delivery failed</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSmsSend;