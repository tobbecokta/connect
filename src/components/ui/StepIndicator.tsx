import React from 'react';
import { Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface Step {
  id: number;
  label: string;
  icon?: React.ReactNode;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={twMerge('flex justify-between w-full', className)}>
      {steps.map((step) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={twMerge(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors duration-200',
                isActive && 'bg-blue-500 text-white',
                isCompleted ? 'bg-green-500 text-white' : !isActive && 'bg-gray-200 text-gray-500'
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                step.icon || <span>{step.id}</span>
              )}
            </div>
            <span
              className={twMerge(
                'text-xs mt-1 transition-colors duration-200',
                isActive ? 'text-blue-500 font-medium' : 'text-gray-500'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;