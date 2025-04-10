import React from 'react';
import Button from '../ui/Button';

interface BulkSmsFooterProps {
  currentStep: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProgress: boolean;
}

const BulkSmsFooter: React.FC<BulkSmsFooterProps> = ({
  currentStep,
  onPrevStep,
  onNextStep,
  isFirstStep,
  isLastStep,
  canProgress,
}) => {
  return (
    <div className="bg-white border-t p-4 flex justify-between items-center">
      <Button
        onClick={onPrevStep}
        variant="secondary"
      >
        {isFirstStep ? 'Cancel' : 'Back'}
      </Button>
      
      {!isLastStep && (
        <Button
          onClick={onNextStep}
          disabled={!canProgress}
        >
          Continue
        </Button>
      )}
    </div>
  );
};

export default BulkSmsFooter;