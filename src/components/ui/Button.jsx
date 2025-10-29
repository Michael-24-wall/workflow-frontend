import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
  blue: 'bg-blue-600 text-white hover:bg-blue-700',
  gray: 'bg-gray-500 text-white hover:bg-gray-600',
  'blue-outline': 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  'gray-outline': 'border-2 border-gray-400 text-gray-700 hover:bg-gray-50'
};
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;