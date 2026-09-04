import React, { useState, useEffect } from 'react';
import { CloseIcon, CalendarIcon, ClockIcon, StethoscopeIcon, HospitalIcon } from './Icons';

export const AppointmentModal = ({ isOpen, onClose, onBook, hospitals = [], doctors = [] }) => {
  const [formData, setFormData] = useState({
    hospitalId: '',
    doctorId: '',
    patientName: '',
    patientPhone: '',
    appointmentDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        hospitalId: hospitals[0]?.id || '',
        doctorId: '',
        patientName: '',
        patientPhone: '',
        appointmentDate: new Date().toISOString().split('T')[0]
      });
      setErrors({});
    }
  }, [isOpen, hospitals]);

  // Filter doctors by selected hospital
  const availableDoctors = doctors.filter(d => 
    !formData.hospitalId || String(d.hospitalId) === String(formData.hospitalId)
  );

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.hospitalId) errs.hospitalId = 'Please select a hospital.';
    if (!formData.doctorId) errs.doctorId = 'Please select a doctor.';
    if (!formData.patientName.trim()) errs.patientName = 'Patient full name is required.';
    if (!formData.patientPhone.trim()) errs.patientPhone = 'Patient phone number is required.';
    if (!formData.appointmentDate) errs.appointmentDate = 'Appointment date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedDoc = doctors.find(d => String(d.id) === String(formData.doctorId));
      const selectedHosp = hospitals.find(h => String(h.id) === String(formData.hospitalId));

      await onBook({
        patientId: 1,
        patientName: formData.patientName.trim(),
        patientPhone: formData.patientPhone.trim(),
        doctorId: parseInt(formData.doctorId, 10),
        doctorName: selectedDoc ? selectedDoc.fullName : 'Doctor',
        hospitalId: parseInt(formData.hospitalId, 10),
        hospitalName: selectedHosp ? selectedHosp.name : 'Hospital',
        appointmentDate: new Date(formData.appointmentDate).toISOString()
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to book appointment.' });
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#dcfce7', color: '#166534', padding: '8px', borderRadius: '8px' }}>
              <CalendarIcon size={22} />
            </div>
            <div>
              <h2 className="modal-title">Book Doctor Appointment</h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Select facility, doctor, and date to generate queue number</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.form && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {errors.form}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">1. Select Hospital Facility *</label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={formData.hospitalId}
                onChange={(e) => {
                  handleChange('hospitalId', e.target.value);
                  handleChange('doctorId', '');
                }}
              >
                <option value="">Select Hospital</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.district})</option>
                ))}
              </select>
              {errors.hospitalId && <span className="error-text">{errors.hospitalId}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">2. Select Consulting Doctor *</label>
              <select
                className="form-select"
                style={{ width: '100%' }}
                value={formData.doctorId}
                onChange={(e) => handleChange('doctorId', e.target.value)}
              >
                <option value="">Select Doctor</option>
                {availableDoctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} — {d.specialization} ({d.availableDay} {d.availableStartTime})
                  </option>
                ))}
              </select>
              {errors.doctorId && <span className="error-text">{errors.doctorId}</span>}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Patient Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sahan Perera"
                  value={formData.patientName}
                  onChange={(e) => handleChange('patientName', e.target.value)}
                />
                {errors.patientName && <span className="error-text">{errors.patientName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 0771234567"
                  value={formData.patientPhone}
                  onChange={(e) => handleChange('patientPhone', e.target.value)}
                />
                {errors.patientPhone && <span className="error-text">{errors.patientPhone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Appointment Date *</label>
              <input
                type="date"
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
                value={formData.appointmentDate}
                onChange={(e) => handleChange('appointmentDate', e.target.value)}
              />
              {errors.appointmentDate && <span className="error-text">{errors.appointmentDate}</span>}
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', color: '#166534' }}>
              ⚡ <strong>Instant Queue Allocation:</strong> Upon confirmation, your appointment queue number will be automatically generated and assigned for this doctor.
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
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Booking...' : 'Confirm Appointment & Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
