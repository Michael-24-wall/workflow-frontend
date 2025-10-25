import React from 'react';

const Card = ({ children, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-white border border-gray-200',
    primary: 'bg-primary-900 text-white'
  };
  
  return (
    <div className={`rounded-lg shadow-sm ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;