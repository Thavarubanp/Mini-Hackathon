import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

const COMMON_SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Dermatology',
  'Orthopedics',
  'Gynecology & Obstetrics',
  'ENT (Ear, Nose, Throat)',
  'Psychiatry',
  'Ophthalmology',
  'Oncology',
  'Gastroenterology'
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const DoctorModal = ({ isOpen, onClose, onSave, doctor, hospitals = [] }) => {
  const isEditing = !!doctor?.id;

  const [formData, setFormData] = useState({
    fullName: '',
    specialization: 'General Medicine',
    customSpecialization: '',
    availableDay: 'Monday',
    availableStartTime: '09:00',
    availableEndTime: '17:00',
    hospitalId: hospitals[0]?.id || ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (doctor) {
      const isPreset = COMMON_SPECIALIZATIONS.includes(doctor.specialization);
      setFormData({
        fullName: doctor.fullName || '',
        specialization: isPreset ? doctor.specialization : 'Other',
        customSpecialization: isPreset ? '' : doctor.specialization,
        availableDay: doctor.availableDay || 'Monday',
        availableStartTime: doctor.availableStartTime || '09:00',
        availableEndTime: doctor.availableEndTime || '17:00',
        hospitalId: doctor.hospitalId || (hospitals[0]?.id || '')
      });
    } else {
      setFormData({
        fullName: '',
        specialization: 'General Medicine',
        customSpecialization: '',
        availableDay: 'Monday',
        availableStartTime: '09:00',
        availableEndTime: '17:00',
        hospitalId: hospitals[0]?.id || ''
      });
    }
    setErrors({});
  }, [doctor, hospitals, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    }

    const finalSpec = formData.specialization === 'Other'
      ? formData.customSpecialization.trim()
      : formData.specialization;

    if (!finalSpec) {
      errs.specialization = 'Specialization is required.';
    }

    if (!formData.hospitalId) {
      errs.hospitalId = 'Please select a hospital.';
    }

    if (!formData.availableStartTime) {
      errs.availableStartTime = 'Start time is required.';
    }

    if (!formData.availableEndTime) {
      errs.availableEndTime = 'End time is required.';
    } else if (formData.availableStartTime && formData.availableEndTime <= formData.availableStartTime) {
      errs.availableEndTime = 'End time must be after start time.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalSpec = formData.specialization === 'Other'
      ? formData.customSpecialization.trim()
      : formData.specialization;

    const payload = {
      fullName: formData.fullName.trim(),
      specialization: finalSpec,
      availableDay: formData.availableDay,
      availableStartTime: formData.availableStartTime,
      availableEndTime: formData.availableEndTime,
      hospitalId: parseInt(formData.hospitalId, 10)
    };

    setSubmitting(true);
    try {
      await onSave(payload, doctor?.id);
      onClose();
    } catch (err) {
      setErrors(prev => ({ ...prev, form: err.message || 'Submission failed.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? 'Edit Doctor Profile' : 'Add New Doctor'}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.form && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
                {errors.form}
              </div>
            )}

            {/* Doctor Name */}
            <div className="form-control-block">
              <label className="form-label">Doctor Full Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Kasun Perera"
                className="form-input-standard"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            {/* Specialization */}
            <div className="form-control-block">
              <label className="form-label">Specialization</label>
              <select
                className="form-input-standard"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              >
                {COMMON_SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>

              {formData.specialization === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter specialization"
                  className="form-input-standard"
                  style={{ marginTop: '8px' }}
                  value={formData.customSpecialization}
                  onChange={(e) => setFormData({ ...formData, customSpecialization: e.target.value })}
                />
              )}
              {errors.specialization && <span className="error-text">{errors.specialization}</span>}
            </div>

            {/* Hospital Affiliation */}
            <div className="form-control-block">
              <label className="form-label">Affiliated Hospital</label>
              <select
                className="form-input-standard"
                value={formData.hospitalId}
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              >
                <option value="">-- Select a Hospital --</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.district ? `(${h.district})` : ''}
                  </option>
                ))}
              </select>
              {errors.hospitalId && <span className="error-text">{errors.hospitalId}</span>}
            </div>

            {/* Available Day */}
            <div className="form-control-block">
              <label className="form-label">Available Day</label>
              <select
                className="form-input-standard"
                value={formData.availableDay}
                onChange={(e) => setFormData({ ...formData, availableDay: e.target.value })}
              >
                {DAYS_OF_WEEK.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Available Time Window */}
            <div className="form-grid-2">
              <div className="form-control-block">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input-standard"
                  value={formData.availableStartTime}
                  onChange={(e) => setFormData({ ...formData, availableStartTime: e.target.value })}
                />
                {errors.availableStartTime && <span className="error-text">{errors.availableStartTime}</span>}
              </div>

              <div className="form-control-block">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input-standard"
                  value={formData.availableEndTime}
                  onChange={(e) => setFormData({ ...formData, availableEndTime: e.target.value })}
                />
                {errors.availableEndTime && <span className="error-text">{errors.availableEndTime}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Doctor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
