import React, { useState, useEffect } from 'react';
import { CloseIcon, HospitalIcon } from './Icons';

export const HospitalModal = ({ isOpen, onClose, onSave, hospital }) => {
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    address: '',
    contactNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        district: hospital.district || '',
        address: hospital.address || '',
        contactNumber: hospital.contactNumber || ''
      });
    } else {
      setFormData({
        name: '',
        district: '',
        address: '',
        contactNumber: ''
      });
    }
    setErrors({});
  }, [hospital, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Hospital name is required.';
    if (!formData.district.trim()) errs.district = 'District is required.';
    if (!formData.address.trim()) errs.address = 'Address is required.';

    const phoneRegex = /^\d{10}$/;
    if (!formData.contactNumber.trim()) {
      errs.contactNumber = 'Contact number is required.';
    } else if (!phoneRegex.test(formData.contactNumber.trim())) {
      errs.contactNumber = 'Contact number must contain exactly 10 digits.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData, hospital?.id);
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Operation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const districtList = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
    'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
    'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
    'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
    'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '8px', borderRadius: '8px' }}>
              <HospitalIcon size={22} />
            </div>
            <h2 className="modal-title">
              {hospital ? 'Edit Hospital' : 'Register New Hospital'}
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.form && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errors.form}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Hospital Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Kalmunai Base Hospital"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              {errors.name && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">District *</label>
              <select
                className="form-select"
                value={formData.district}
                onChange={(e) => handleChange('district', e.target.value)}
              >
                <option value="">Select District</option>
                {districtList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {errors.district && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.district}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Full Address *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Main Street, Kalmunai"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              {errors.address && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.address}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number (10 digits) *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 0672222266"
                maxLength={10}
                value={formData.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value.replace(/\D/g, ''))}
              />
              {errors.contactNumber && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{errors.contactNumber}</span>}
            </div>
          </div>

          <div className="modal-footer">
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
              {isSubmitting ? 'Saving...' : hospital ? 'Save Changes' : 'Create Hospital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
