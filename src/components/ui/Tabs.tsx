import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'buttons' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  className,
}) => {
  const variantClasses = {
    underline: {
      container: 'border-b border-gray-200',
      tab: 'px-4 py-2 text-gray-500 hover:text-gray-800',
      active: 'text-blue-600 border-b-2 border-blue-600 font-medium',
    },
    pills: {
      container: 'space-x-2',
      tab: 'px-3 py-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100',
      active: 'bg-blue-100 text-blue-800 font-medium',
    },
    buttons: {
      container: 'space-x-2',
      tab: 'px-4 py-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100',
      active: 'bg-blue-600 text-white font-medium hover:bg-blue-700 hover:text-white',
    },
    segmented: {
      container: 'bg-gray-100 p-1 rounded-lg',
      tab: 'px-4 py-2 rounded-md text-gray-500',
      active: 'bg-white text-gray-800 shadow-sm font-medium',
    },
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={twMerge('flex', variantClasses[variant].container, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={twMerge(
            'flex items-center transition-colors duration-200',
            sizeClasses[size],
            variantClasses[variant].tab,
            activeTab === tab.id && variantClasses[variant].active
          )}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;