import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import Button from '../ui/Button';

interface BulkSmsUploadProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BulkSmsUpload: React.FC<BulkSmsUploadProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
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
            onChange={onFileUpload}
            ref={fileInputRef}
            className="hidden"
          />
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">Drag and drop your CSV file here or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Example CSV format:</h4>
          <div className="bg-white p-3 rounded-lg text-sm font-mono border border-gray-200">
            <p>phone,name,company,city</p>
            <p>+1234567890,John Smith,Acme Inc,New York</p>
            <p>+1987654321,Jane Doe,XYZ Ltd,Los Angeles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSmsUpload;