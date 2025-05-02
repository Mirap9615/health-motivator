import React from 'react';
import './RecommendationModal.css';
import { FiX } from 'react-icons/fi';

const RecommendationModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose} aria-label="Close modal">
          <FiX size={24} />
        </button>
        <h3 className="modal-title">{title || 'Recommendation Details'}</h3>
        <div className="modal-body">
          {typeof children === 'string'
            ? children.split('\n').map((line, index) => (
                <p key={index} style={{ marginBottom: '0.5em' }}>{line}</p>
              ))
            : children}
        </div>
      </div>
    </div>
  );
};

export default RecommendationModal;