import React, { useState, useEffect, useMemo } from 'react';
import { doctorApi, hospitalApi, getAuthToken } from './services/api';
import { DoctorCard } from './components/DoctorCard';
import { DoctorModal } from './components/DoctorModal';
import { AuthModal } from './components/AuthModal';
import {
  StethoscopeIcon,
  HospitalIcon,
  PlusIcon,
  SearchIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from './components/Icons';

export function App() {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  // Modals state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [deleteDoctorCandidate, setDeleteDoctorCandidate] = useState(null);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const [hasToken, setHasToken] = useState(!!getAuthToken());

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load Hospitals & Doctors
  const loadData = async () => {
    setLoading(true);
    try {
      const [hospList, docList] = await Promise.all([
        hospitalApi.getAll().catch(() => []),
        doctorApi.getAll({
          hospitalId: selectedHospitalId || undefined,
          specialization: selectedSpecialization || undefined,
          search: searchTerm || undefined
        }).catch(() => [])
      ]);
      setHospitals(hospList);
      setDoctors(docList);
    } catch (err) {
      showToast(err.message || 'Failed to fetch data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHospitalId, selectedSpecialization]);

  // Handle Search submit / debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      doctorApi.getAll({
        hospitalId: selectedHospitalId || undefined,
        specialization: selectedSpecialization || undefined,
        search: searchTerm || undefined
      }).then(docs => setDoctors(docs))
        .catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Unique specializations for filter dropdown
  const specializations = useMemo(() => {
    const set = new Set();
    doctors.forEach(d => {
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set);
  }, [doctors]);

  // Handle Add or Edit Doctor
  const handleSaveDoctor = async (formData, id) => {
    if (id) {
      const updated = await doctorApi.update(id, formData);
      setDoctors(prev => prev.map(d => (d.id === id ? updated : d)));
      showToast(`Updated doctor: ${updated.fullName}`, 'success');
    } else {
      const created = await doctorApi.create(formData);
      setDoctors(prev => [created, ...prev]);
      showToast(`Successfully added Dr. ${created.fullName}!`, 'success');
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!deleteDoctorCandidate) return;
    try {
      await doctorApi.delete(deleteDoctorCandidate.id);
      setDoctors(prev => prev.filter(d => d.id !== deleteDoctorCandidate.id));
      showToast(`Dr. ${deleteDoctorCandidate.fullName} was removed.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete doctor.', 'error');
    } finally {
      setDeleteDoctorCandidate(null);
    }
  };

  return (
    <>
      {/* Navigation Header */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <StethoscopeIcon size={24} />
            </div>
            <div>
              <div className="brand-title">Suwa Sewa LK</div>
              <div className="brand-subtitle">Doctor Management System</div>
            </div>
          </div>

          <div className="navbar-actions">
            <button
              className="btn btn-secondary"
              title="Auth Configuration"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <KeyIcon size={16} />
              <span>{hasToken ? 'Auth: Active' : 'Set Auth Token'}</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedDoctor(null);
                setIsDoctorModalOpen(true);
              }}
            >
              <PlusIcon size={18} />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-container">
        {/* Hero Section */}
        <section className="hero-banner">
          <h1 className="hero-title">Medical Staff & Doctor Schedules</h1>
          <p className="hero-description">
            Manage certified physicians, availability timeslots, and hospital affiliations across Sri Lanka's healthcare network.
          </p>

          {/* Quick Metrics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <StethoscopeIcon size={24} />
              </div>
              <div>
                <div className="stat-number">{doctors.length}</div>
                <div className="stat-label">Active Doctors</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                <HospitalIcon size={24} />
              </div>
              <div>
                <div className="stat-number">{hospitals.length}</div>
                <div className="stat-label">Partner Hospitals</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                <CheckCircleIcon size={24} />
              </div>
              <div>
                <div className="stat-number">{specializations.length || '0'}</div>
                <div className="stat-label">Specializations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="filter-bar">
          <div className="filter-group">
            <div className="search-input-wrapper">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by doctor name, specialty, or hospital..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
            >
              <option value="">All Hospitals</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>

            {(searchTerm || selectedHospitalId || selectedSpecialization) && (
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 14px' }}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedHospitalId('');
                  setSelectedSpecialization('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </section>

        {/* Doctors Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="empty-title">Loading doctors...</div>
            <div className="empty-desc">Connecting to Suwa Sewa LK backend service.</div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <StethoscopeIcon size={32} />
            </div>
            <div className="empty-title">No doctors found</div>
            <div className="empty-desc">
              {searchTerm || selectedHospitalId || selectedSpecialization
                ? "Try adjusting your search terms or filters to find doctors."
                : "Get started by registering your first physician to an affiliated hospital."}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedDoctor(null);
                setIsDoctorModalOpen(true);
              }}
            >
              <PlusIcon size={18} />
              <span>Add First Doctor</span>
            </button>
          </div>
        ) : (
          <section className="doctor-grid">
            {doctors.map(doctor => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onEdit={(doc) => {
                  setSelectedDoctor(doc);
                  setIsDoctorModalOpen(true);
                }}
                onDelete={(doc) => setDeleteDoctorCandidate(doc)}
              />
            ))}
          </section>
        )}
      </main>

      {/* Add / Edit Doctor Modal */}
      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => {
          setIsDoctorModalOpen(false);
          setSelectedDoctor(null);
        }}
        onSave={handleSaveDoctor}
        doctor={selectedDoctor}
        hospitals={hospitals}
      />

      {/* Auth Settings Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={() => setHasToken(!!getAuthToken())}
      />

      {/* Delete Confirmation Modal */}
      {deleteDoctorCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteDoctorCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#ef4444' }}>Delete Doctor</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.925rem', color: '#334155' }}>
                Are you sure you want to remove <strong>{deleteDoctorCandidate.fullName}</strong> ({deleteDoctorCandidate.specialization}) from <strong>{deleteDoctorCandidate.hospitalName || 'the hospital'}</strong>?
              </p>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteDoctorCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircleIcon size={18} /> : <AlertCircleIcon size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
