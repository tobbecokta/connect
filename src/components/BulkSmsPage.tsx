import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Upload, FileText, AlertCircle, ChevronRight, Smartphone, ChevronDown, X, Check, Phone, RefreshCw } from 'lucide-react';

interface BulkSmsPageProps {
  onBack: () => void;
  phoneNumbers: Array<{
    id: number;
    number: string;
    device: string;
    isDefault: boolean;
  }>;
  activePhoneNumber: number;
  setActivePhoneNumber: (id: number) => void;
  onBulkSmsSent: (campaign: any) => void;
}

const BulkSmsPage: React.FC<BulkSmsPageProps> = ({ 
  onBack, 
  phoneNumbers, 
  activePhoneNumber, 
  setActivePhoneNumber,
  onBulkSmsSent
}) => {
  const [bulkSmsStep, setBulkSmsStep] = useState(1); // 1: Upload, 2: Compose, 3: Test, 4: Send
  const [csvData, setCsvData] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [templateMessage, setTemplateMessage] = useState('');
  const [testPreview, setTestPreview] = useState({ message: '', recipient: '' });
  const [selectedTestRow, setSelectedTestRow] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [phoneColumnIndex, setPhoneColumnIndex] = useState<number>(-1);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [testRecipientNumber, setTestRecipientNumber] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [smsMetrics, setSmsMetrics] = useState({ charCount: 0, smsCount: 0, cost: '0.00' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update SMS metrics whenever the template message changes
  useEffect(() => {
    const metrics = calculateSmsMetrics(templateMessage);
    setSmsMetrics(metrics);
  }, [templateMessage]);

  // Calculate SMS metrics
  const calculateSmsMetrics = (text: string) => {
    const charCount = text.length;
    const smsCount = Math.ceil(charCount / 160) || 1;
    const cost = (smsCount * 0.5).toFixed(2);
    return { charCount, smsCount, cost };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseCsvData(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCsvData = (content: string) => {
    try {
      // Simple CSV parsing logic (in a real app, you'd use a CSV parsing library)
      const lines = content.split('\n');
      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(header => header.trim());
      
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} has a different number of columns than the header row`);
          continue;
        }

        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvData(content);
      setAvailableTags(headers.map(h => `[${h}]`));
      
      // Move to the next step if we have valid data
      if (rows.length > 0) {
        setBulkSmsStep(2);
      }
    } catch (error) {
      alert(`Error parsing CSV file: ${error}`);
    }
  };

  const renderTemplateForRow = (template: string, rowData: Record<string, string>) => {
    if (!rowData || !template) return '';
    
    let result = template;
    for (const [key, value] of Object.entries(rowData)) {
      result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    }
    return result;
  };

  const updateTestPreview = (rowIndex: number) => {
    if (rowIndex >= 0 && rowIndex < csvRows.length) {
      const row = csvRows[rowIndex];
      const message = renderTemplateForRow(templateMessage, row);
      
      // Use the test recipient number provided by the user, or a placeholder
      setTestPreview({
        message,
        recipient: testRecipientNumber || 'Enter test number'
      });
    }
  };

  const handleNextStep = () => {
    if (bulkSmsStep === 2 && !templateMessage.trim()) {
      alert('Please enter a message template');
      return;
    }
    
    if (bulkSmsStep === 2) {
      // Moving to test step, prepare the preview
      updateTestPreview(0);
    }
    
    if (bulkSmsStep < 4) {
      setBulkSmsStep(bulkSmsStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (bulkSmsStep > 1) {
      setBulkSmsStep(bulkSmsStep - 1);
    }
  };

  const handleSendTestSms = () => {
    if (!testRecipientNumber) {
      alert('Please enter a phone number to send the test SMS');
      return;
    }
    
    // In a real app, this would send a test SMS
    console.log('Sending test SMS to', testRecipientNumber, 'with message:', testPreview.message);
    
    // Mock success for demo purposes
    alert(`Test SMS sent to ${testRecipientNumber}`);
  };

  const handleChangeTestRow = (direction: 'prev' | 'next') => {
    let newIndex = selectedTestRow;
    
    if (direction === 'next' && selectedTestRow < csvRows.length - 1) {
      newIndex = selectedTestRow + 1;
    } else if (direction === 'prev' && selectedTestRow > 0) {
      newIndex = selectedTestRow - 1;
    }
    
    setSelectedTestRow(newIndex);
    updateTestPreview(newIndex);
  };

  const handleSendBulkSms = () => {
    if (!campaignName.trim()) {
      alert('Please enter a name for this campaign');
      return;
    }
    
    // In a real app, this would send SMS to all recipients
    console.log('Sending bulk SMS to', csvRows.length, 'recipients');
    
    // Create a record of this bulk SMS campaign
    const newCampaign = {
      id: Date.now(),
      name: campaignName.trim(),
      date: new Date().toISOString(),
      recipients: csvRows.length,
      template: templateMessage,
      status: 'Sent'
    };
    
    onBulkSmsSent(newCampaign);
    
    // Mock success for demo purposes
    alert(`Bulk SMS successfully sent to ${csvRows.length} recipients!`);
  };

  const handleInsertTag = (tag: string) => {
    setTemplateMessage(templateMessage + tag);
  };

  // Calculate total cost for bulk SMS
  const calculateBulkSmsCost = () => {
    if (!templateMessage || csvRows.length === 0) return { total: 0, perMessage: 0 };
    
    // Get an average message length by rendering a few examples
    let totalLength = 0;
    const samplesToCheck = Math.min(csvRows.length, 5);
    
    for (let i = 0; i < samplesToCheck; i++) {
      const renderedMessage = renderTemplateForRow(templateMessage, csvRows[i]);
      totalLength += renderedMessage.length;
    }
    
    const averageLength = totalLength / samplesToCheck;
    const smsPerMessage = Math.ceil(averageLength / 160) || 1;
    const costPerMessage = (smsPerMessage * 0.5).toFixed(2);
    const totalCost = (csvRows.length * parseFloat(costPerMessage)).toFixed(2);
    
    return { total: totalCost, perMessage: costPerMessage };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Step indicator */}
      <div className="px-6 pt-6 bg-white border-b">
        <div className="flex justify-between items-center w-full mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step} 
              className="flex flex-col items-center"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  bulkSmsStep === step ? 'bg-blue-500 text-white' : 
                  bulkSmsStep > step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step === 1 && <Upload className="w-5 h-5" />}
                {step === 2 && <FileText className="w-5 h-5" />}
                {step === 3 && <AlertCircle className="w-5 h-5" />}
                {step === 4 && <Send className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-1 ${bulkSmsStep === step ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
                {step === 1 && 'Upload CSV'}
                {step === 2 && 'Compose Message'}
                {step === 3 && 'Test SMS'}
                {step === 4 && 'Send Bulk SMS'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
          {/* Step 1: Upload CSV */}
          {bulkSmsStep === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Upload your contacts</h3>
                <p className="text-gray-600 mb-4">
                  Upload a CSV file with your contacts. You can include any columns you want for personalization.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">Drag and drop your CSV file here or</p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Browse Files
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Example CSV format:</h4>
                  <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono">
                    <p>phone,name,company,city</p>
                    <p>+1234567890,John Smith,Acme Inc,New York</p>
                    <p>+1987654321,Jane Doe,XYZ Ltd,Los Angeles</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Compose Message */}
          {bulkSmsStep === 2 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Compose your message template</h3>
                <p className="text-gray-600 mb-4">
                  Use tags like <code className="bg-gray-100 px-1 rounded">[column]</code> to include data from your CSV. For example, <code className="bg-gray-100 px-1 rounded">[company]</code> will be replaced with the company name for each recipient.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleInsertTag(tag)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  <textarea
                    placeholder="Type your message template. Example: Hi [name], we wanted to inform [company] about our new service in [city]."
                    value={templateMessage}
                    onChange={(e) => setTemplateMessage(e.target.value)}
                    rows={6}
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
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
                    className="flex items-center justify-between p-2 border rounded-md cursor-pointer"
                    onClick={() => setShowDeviceModal(true)}
                  >
                    <div className="flex items-center">
                      <Smartphone className="w-5 h-5 mr-2 text-gray-600" />
                      <span>{phoneNumbers[activePhoneNumber]?.device || 'Select device'}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
                
                {csvRows.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border mt-6">
                    <h4 className="font-medium text-sm mb-2">Preview with first contact:</h4>
                    <div className="bg-white p-3 rounded border text-gray-800">
                      {renderTemplateForRow(templateMessage, csvRows[0]) || 'Your message preview will appear here'}
                    </div>
                  </div>
                )}
                
                {templateMessage && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg">
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
          )}
          
          {/* Step 3: Test SMS */}
          {bulkSmsStep === 3 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Test your message</h3>
                <p className="text-gray-600 mb-4">
                  Send a test message to verify how it will look before sending to all recipients.
                </p>
                
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
                        onClick={() => handleChangeTestRow('prev')}
                        disabled={selectedTestRow <= 0}
                        className={`p-1 rounded-full ${
                          selectedTestRow <= 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'
                        }`}
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
                        onClick={() => handleChangeTestRow('next')}
                        disabled={selectedTestRow >= csvRows.length - 1}
                        className={`p-1 rounded-full ${
                          selectedTestRow >= csvRows.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:bg-blue-100'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border shadow-sm mb-4">
                      <div className="mb-2 text-sm text-gray-500">Message Preview:</div>
                      <div className="p-3 bg-blue-500 text-white rounded-lg rounded-br-none">
                        <p>{testPreview.message}</p>
                        <p className="text-xs mt-1 text-blue-100">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">Contact details:</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {Object.entries(csvRows[selectedTestRow] || {}).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSendTestSms}
                        className={`px-4 py-2 rounded-lg ${
                          testRecipientNumber ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!testRecipientNumber}
                      >
                        Send Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Send Bulk SMS */}
          {bulkSmsStep === 4 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Ready to send your bulk SMS</h3>
                <p className="text-gray-600 mb-4">
                  You are about to send SMS messages to {csvRows.length} recipients. Please name your campaign and review the details below before sending.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name <span className="text-sm font-normal text-gray-500">(For your internal reference only)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter a name for this campaign"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name is only used in your campaign history and won't be sent to recipients.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <h4 className="font-medium mb-2">Campaign Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Recipients:</span> {csvRows.length}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Template:</span>
                      </p>
                      <div className="bg-white p-2 rounded mt-1 text-sm">
                        {templateMessage}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Sending from:</span> {phoneNumbers[activePhoneNumber]?.device} ({phoneNumbers[activePhoneNumber]?.number})
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Estimated cost:</span> {calculateBulkSmsCost().total} SEK
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Date:</span> {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Important</h4>
                      <p className="text-sm text-amber-700">
                        This will send SMS messages to all {csvRows.length} recipients in your CSV file. Make sure you have their consent to receive SMS messages.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={handleSendBulkSms}
                    className={`px-6 py-3 rounded-lg text-lg font-medium ${
                      campaignName ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!campaignName}
                  >
                    Send to {csvRows.length} Recipients
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-white border-t p-4 flex justify-between items-center">
        <button
          onClick={bulkSmsStep === 1 ? onBack : handlePrevStep}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          {bulkSmsStep === 1 ? 'Cancel' : 'Back'}
        </button>
        
        {bulkSmsStep < 4 && (
          <button
            onClick={handleNextStep}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${
              (bulkSmsStep === 1 && !csvData) || (bulkSmsStep === 2 && !templateMessage.trim()) 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            }`}
            disabled={(bulkSmsStep === 1 && !csvData) || (bulkSmsStep === 2 && !templateMessage.trim())}
          >
            Continue
          </button>
        )}
      </div>
      
      {/* Phone Number Selection Modal */}
      {showDeviceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Phone Numbers</h2>
              <button onClick={() => setShowDeviceModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Select the phone number you want to use for sending</p>
                
                {phoneNumbers.map((phone) => (
                  <div 
                    key={phone.id} 
                    className={`flex items-center justify-between p-3 border-b cursor-pointer ${
                      activePhoneNumber === phone.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setActivePhoneNumber(phone.id);
                      setShowDeviceModal(false);
                    }}
                  >
                    <div className="flex items-center">
                      <Smartphone className="w-5 h-5 mr-3 text-gray-600" />
                      <div>
                        <p className="font-medium">{phone.device}</p>
                        <p className="text-sm text-gray-600">{phone.number}</p>
                        {phone.isDefault && <span className="text-xs text-blue-600">Default Sender</span>}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {activePhoneNumber === phone.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
            
            <div className="p-4 border-t">
              <button 
                className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg"
                onClick={() => setShowDeviceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSmsPage;