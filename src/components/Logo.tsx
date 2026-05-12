import React from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      {/* Bell Shape */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]"
      >
        <path 
          d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8V11.5L4 14V17H20V14L18 11.5V8Z" 
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M10 20C10 21.1046 10.8954 22 12 22C13.1046 22 14 21.1046 14 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Brain Element (Simplified Icon) */}
        <path 
          d="M9 7.5C9 6.67157 9.67157 6 10.5 6C11.3284 6 12 6.67157 12 7.5C12 8.32843 11.3284 9 10.5 9C9.67157 9 9 8.32843 9 7.5Z" 
          fill="#22d3ee" 
          className="animate-pulse"
        />
        <path 
          d="M12 7.5C12 6.67157 12.6716 6 13.5 6C14.3284 6 15 6.67157 15 7.5C15 8.32843 14.3284 9 13.5 9C12.6716 9 12 8.32843 12 7.5Z" 
          fill="#22d3ee" 
          className="animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
        
        {/* Sonic Waves at bottom */}
        <path 
          d="M9 18C9 18 10 19 12 19C14 19 15 18 15 18" 
          stroke="#22d3ee" 
          strokeWidth="1" 
          strokeLinecap="round"
        />
        <path 
          d="M8 19C8 19 10.5 20.5 12 20.5C13.5 20.5 16 19 16 19" 
          stroke="#22d3ee" 
          strokeWidth="1" 
          strokeLinecap="round" 
          style={{ opacity: 0.6 }}
        />
      </svg>
    </div>
  );
};
