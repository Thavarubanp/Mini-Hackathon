import React, { useState } from 'react';
import { CloseIcon, KeyIcon } from './Icons';
import { getAuthToken, setAuthToken } from '../services/api';

export const AuthModal = ({ isOpen, onClose, onAuthChange }) => {
  const [token, setToken] = useState(getAuthToken());

  if (!isOpen) return null;

  const handleSave = () => {
    setAuthToken(token.trim());
    onAuthChange();
    onClose();
  };

  const handleClear = () => {
    setToken('');
    setAuthToken('');
    onAuthChange();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyIcon size={20} style={{ color: '#0284c7' }} />
            <h2 className="modal-title">Authentication Settings</h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Enter your JWT Bearer token here to authenticate admin operations (Create, Update, Delete). The token will be stored in your browser's local session.
          </p>

          <div className="form-control-block">
            <label className="form-label">JWT Bearer Token</label>
            <textarea
              className="form-input-standard"
              rows={4}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          {token && (
            <button type="button" className="btn btn-danger" onClick={handleClear} style={{ marginRight: 'auto' }}>
              Clear Token
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Token
          </button>
        </div>
      </div>
    </div>
  );
};
