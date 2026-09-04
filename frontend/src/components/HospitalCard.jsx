import React from 'react';
import { HospitalIcon, MapPinIcon, PhoneIcon, EditIcon, TrashIcon } from './Icons';

export const HospitalCard = ({ hospital, doctorCount = 0, onEdit, onDelete }) => {
  return (
    <div className="doctor-card" style={{ borderTop: '4px solid #0284c7' }}>
      <div>
        <div className="doctor-card-header">
          <div className="doctor-avatar-wrapper">
            <div className="doctor-avatar" style={{ background: '#e0f2fe', color: '#0284c7' }}>
              <HospitalIcon size={24} />
            </div>
            <div>
              <h3 className="doctor-name">{hospital.name}</h3>
              <span className="badge-specialization" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                {hospital.district} District
              </span>
            </div>
          </div>
        </div>

        <div className="doctor-info-list" style={{ marginTop: '16px' }}>
          <div className="doctor-info-item">
            <MapPinIcon size={16} className="doctor-info-icon" style={{ color: '#64748b' }} />
            <span style={{ color: '#334155' }}>{hospital.address}</span>
          </div>

          <div className="doctor-info-item" style={{ marginTop: '6px' }}>
            <PhoneIcon size={16} className="doctor-info-icon" style={{ color: '#0284c7' }} />
            <span style={{ fontWeight: 600, color: '#0284c7', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              {hospital.contactNumber}
            </span>
          </div>

          <div className="doctor-schedule-pill" style={{ marginTop: '12px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned Doctors:</span>
              <span className="day-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                {doctorCount} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="doctor-card-footer">
        <button
          className="btn-icon"
          title="Edit Hospital"
          onClick={() => onEdit(hospital)}
        >
          <EditIcon size={16} />
        </button>
        <button
          className="btn-icon danger"
          title="Delete Hospital"
          onClick={() => onDelete(hospital)}
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
};
