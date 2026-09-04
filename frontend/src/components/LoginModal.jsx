import React, { useState } from 'react';
import { CloseIcon, KeyIcon, CheckCircleIcon, UserIcon } from './Icons';
import { authApi } from '../services/api';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [role, setRole] = useState('Admin');
  const [username, setUsername] = useState('SystemAdmin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (selectedRole, customUsername) => {
    setIsSubmitting(true);
    setError('');

    const targetRole = selectedRole || role;
    const targetUser = customUsername || username || `${targetRole}User`;

    try {
      const result = await authApi.login({
        username: targetUser,
        password: password || 'password',
        role: targetRole
      });
      onLoginSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '8px', borderRadius: '8px' }}>
              <KeyIcon size={22} />
            </div>
            <div>
              <h2 className="modal-title">User Login</h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Select your role to authenticate with JWT</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Quick 1-Click Role Login:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className={`btn ${role === 'Admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '10px 6px', fontSize: '0.8rem', flexDirection: 'column' }}
                onClick={() => {
                  setRole('Admin');
                  setUsername('SystemAdmin');
                  handleLogin('Admin', 'SystemAdmin');
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>👑</span>
                <span>Admin</span>
              </button>

              <button
                type="button"
                className={`btn ${role === 'Doctor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '10px 6px', fontSize: '0.8rem', flexDirection: 'column' }}
                onClick={() => {
                  setRole('Doctor');
                  setUsername('Dr.Perera');
                  handleLogin('Doctor', 'Dr.Perera');
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🩺</span>
                <span>Doctor</span>
              </button>

              <button
                type="button"
                className={`btn ${role === 'Patient' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '10px 6px', fontSize: '0.8rem', flexDirection: 'column' }}
                onClick={() => {
                  setRole('Patient');
                  setUsername('PatientUser');
                  handleLogin('Patient', 'PatientUser');
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>👤</span>
                <span>Patient</span>
              </button>
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center', margin: '16px 0 12px' }}>
            <span style={{ background: 'white', padding: '0 10px', color: '#94a3b8', fontSize: '0.75rem', position: 'relative', zIndex: 1 }}>
              OR CUSTOM CREDENTIALS
            </span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Select Role</label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Admin">Admin (Full Access - Create/Edit/Delete)</option>
                <option value="Doctor">Doctor (Read-Only Access)</option>
                <option value="Patient">Patient (Read-Only Access)</option>
              </select>
            </div>

            <div className="modal-footer" style={{ padding: '12px 0 0', background: 'transparent', borderTop: 'none' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : `Login as ${role}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
