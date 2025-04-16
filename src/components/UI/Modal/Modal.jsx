import React, { useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = true,
  size = 'medium'
}) => {
  const modalRef = useRef(null);
  
  // Close when escape key is pressed
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = ''; // Restore scrolling
    };
  }, [isOpen, onClose]);
  
  // Close when clicking outside modal
  const handleOverlayClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target) && closeOnOverlayClick) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div 
        className={`modal modal--${size} ${className}`} 
        ref={modalRef}
      >
        <div className="modal__header">
          {title && <h2 className="modal__title">{title}</h2>}
          
          {showCloseButton && (
            <button 
              className="modal__close-button" 
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          )}
        </div>
        
        <div className="modal__content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;