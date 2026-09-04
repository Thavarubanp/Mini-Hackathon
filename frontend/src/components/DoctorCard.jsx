import React from 'react';
import { HospitalIcon, CalendarIcon, ClockIcon, EditIcon, TrashIcon } from './Icons';

export const DoctorCard = ({ doctor, onEdit, onDelete }) => {
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'DR';
    return name
      .replace(/^(Dr\.|Dr|Doctor)\s+/i, '')
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DR';
  };

  return (
    <div className="doctor-card">
      <div>
        <div className="doctor-card-header">
          <div className="doctor-avatar-wrapper">
            <div className="doctor-avatar">
              {getInitials(doctor.fullName)}
            </div>
            <div>
              <h3 className="doctor-name">{doctor.fullName}</h3>
              <span className="badge-specialization">{doctor.specialization}</span>
            </div>
          </div>
        </div>

        <div className="doctor-info-list">
          <div className="doctor-info-item">
            <HospitalIcon size={16} className="doctor-info-icon" />
            <span style={{ fontWeight: 600 }}>{doctor.hospitalName || `Hospital ID: ${doctor.hospitalId}`}</span>
          </div>

          <div className="doctor-schedule-pill">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarIcon size={14} style={{ color: '#059669' }} />
              <span className="day-badge">{doctor.availableDay}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClockIcon size={14} style={{ color: '#0284c7' }} />
              <span className="time-range">{doctor.availableStartTime} - {doctor.availableEndTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="doctor-card-footer">
        <button
          className="btn-icon"
          title="Edit Doctor"
          onClick={() => onEdit(doctor)}
        >
          <EditIcon size={16} />
        </button>
        <button
          className="btn-icon danger"
          title="Delete Doctor"
          onClick={() => onDelete(doctor)}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
};
