import React from 'react';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallback,
}) => {
  const [error, setError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const baseClasses = 'rounded-full overflow-hidden flex items-center justify-center bg-gray-200';

  const handleError = () => {
    setError(true);
  };

  const getFallbackInitials = () => {
    if (!fallback) return '';
    return fallback
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`${baseClasses} ${sizeClasses[size]} ${className}`}>
      {error || !src ? (
        <div className="text-gray-600 font-medium text-sm">{getFallbackInitials()}</div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      )}
    </div>
  );
};