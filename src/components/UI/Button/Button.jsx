import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  className = '', 
  disabled = false, 
  type = 'button',
  size = 'medium',
  variant = 'primary',
  to,
  ...props 
}) => {
  // Combine classNames
  const buttonClasses = `
    button 
    button--${size} 
    button--${variant}
    ${disabled ? 'button--disabled' : ''}
    ${className}
  `.trim();
  
  // If "to" prop is provided, render a Link, otherwise a button
  if (to) {
    return (
      <Link 
        to={to} 
        className={buttonClasses} 
        {...props}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;