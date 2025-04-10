import React from 'react';

interface LogoProps {
  onClick: () => void;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ onClick, className = '' }) => {
  return (
    <div 
      className={`cursor-pointer font-bold text-white text-2xl ${className}`}
      onClick={onClick}
    >
      SMS
    </div>
  );
};

export default Logo; 