import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className,
  status,
}) => {
  const [imageError, setImageError] = useState(!src || src.trim() === '');
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };
  
  // Generate initials from the alt text
  const getInitials = () => {
    if (!alt) return '?';
    
    const words = alt.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '?';
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Generate a consistent color based on the name
  const getBackgroundColor = () => {
    if (!alt) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-teal-500'
    ];
    
    // Use a simple hash of the name to pick a color
    let hash = 0;
    for (let i = 0; i < alt.length; i++) {
      hash = alt.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="relative">
      {imageError ? (
        <div 
          className={twMerge(
            'rounded-full flex items-center justify-center text-white font-medium',
            sizeClasses[size],
            getBackgroundColor(),
            className
          )}
        >
          {getInitials()}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={twMerge(
            'rounded-full object-cover',
            sizeClasses[size],
            className
          )}
          onError={() => setImageError(true)}
        />
      )}
      
      {status && (
        <div className={twMerge(
          'absolute bottom-0 right-0 rounded-full border-2 border-white',
          size === 'xs' ? 'w-2 h-2' : 'w-3 h-3',
          statusColors[status]
        )} />
      )}
    </div>
  );
};

export default Avatar;