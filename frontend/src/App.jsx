import React, { useState, useEffect, useMemo } from 'react';
import { doctorApi, hospitalApi, getAuthToken } from './services/api';
import { DoctorCard } from './components/DoctorCard';
import { DoctorModal } from './components/DoctorModal';
import { HospitalCard } from './components/HospitalCard';
import { HospitalModal } from './components/HospitalModal';
import { AuthModal } from './components/AuthModal';
import {
  StethoscopeIcon,
  HospitalIcon,
  PlusIcon,
  SearchIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  BuildingIcon,
  MapPinIcon
} from './components/Icons';

export function App() {
  const [activeTab, setActiveTab] = useState('hospitals'); // 'hospitals' | 'doctors'

  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Doctor Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  // Hospital Filters
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Doctor Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [deleteDoctorCandidate, setDeleteDoctorCandidate] = useState(null);

  // Hospital Modals
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [deleteHospitalCandidate, setDeleteHospitalCandidate] = useState(null);

  // Auth & Toast
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  // Handle Search debounce for doctors
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

  // Doctor specializations for dropdown
  const specializations = useMemo(() => {
    const set = new Set();
    doctors.forEach(d => {
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set);
  }, [doctors]);

  // Unique Districts for Hospital filter dropdown
  const districts = useMemo(() => {
    const set = new Set();
    hospitals.forEach(h => {
      if (h.district) set.add(h.district);
    });
    return Array.from(set);
  }, [hospitals]);

  // Filtered Hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const matchesSearch = !hospitalSearch ||
        h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
        h.district.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
        h.address.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
        h.contactNumber.includes(hospitalSearch);
      
      const matchesDistrict = !selectedDistrict || h.district === selectedDistrict;

      return matchesSearch && matchesDistrict;
    });
  }, [hospitals, hospitalSearch, selectedDistrict]);

  // Doctor count per hospital lookup
  const doctorCountPerHospital = useMemo(() => {
    const map = {};
    doctors.forEach(d => {
      if (d.hospitalId) {
        map[d.hospitalId] = (map[d.hospitalId] || 0) + 1;
      }
    });
    return map;
  }, [doctors]);

  // Handle Save Doctor
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

  // Handle Delete Doctor
  const confirmDeleteDoctor = async () => {
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

  // Handle Save Hospital
  const handleSaveHospital = async (formData, id) => {
    if (id) {
      const updated = await hospitalApi.update(id, formData);
      setHospitals(prev => prev.map(h => (h.id === id ? updated : h)));
      showToast(`Updated hospital: ${updated.name}`, 'success');
    } else {
      const created = await hospitalApi.create(formData);
      setHospitals(prev => [created, ...prev]);
      showToast(`Successfully registered ${created.name}!`, 'success');
    }
  };

  // Handle Delete Hospital
  const confirmDeleteHospital = async () => {
    if (!deleteHospitalCandidate) return;
    try {
      await hospitalApi.delete(deleteHospitalCandidate.id);
      setHospitals(prev => prev.filter(h => h.id !== deleteHospitalCandidate.id));
      showToast(`${deleteHospitalCandidate.name} was removed.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete hospital.', 'error');
    } finally {
      setDeleteHospitalCandidate(null);
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
              <div className="brand-subtitle">Hospital & Healthcare System</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'hospitals' ? 'active' : ''}`}
              onClick={() => setActiveTab('hospitals')}
            >
              <HospitalIcon size={18} />
              <span>Hospitals</span>
            </button>

            <button
              className={`nav-tab ${activeTab === 'doctors' ? 'active' : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <StethoscopeIcon size={18} />
              <span>Doctors</span>
            </button>
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

            {activeTab === 'hospitals' ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSelectedHospital(null);
                  setIsHospitalModalOpen(true);
                }}
              >
                <PlusIcon size={18} />
                <span>Add Hospital</span>
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </header>

      <main className="app-container">
        {/* HOSPITAL MANAGEMENT TAB */}
        {activeTab === 'hospitals' && (
          <>
            <section className="hero-banner">
              <h1 className="hero-title">Hospital Network & Facilities</h1>
              <p className="hero-description">
                Manage registered base hospitals, district general hospitals, and medical centers across Sri Lanka.
              </p>

              {/* Hospital Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <HospitalIcon size={24} />
                  </div>
                  <div>
                    <div className="stat-number">{hospitals.length}</div>
                    <div className="stat-label">Registered Hospitals</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ background: '#ccfbf1', color: '#0d9488' }}>
                    <MapPinIcon size={24} />
                  </div>
                  <div>
                    <div className="stat-number">{districts.length}</div>
                    <div className="stat-label">Districts Covered</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                    <StethoscopeIcon size={24} />
                  </div>
                  <div>
                    <div className="stat-number">{doctors.length}</div>
                    <div className="stat-label">Affiliated Doctors</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter & Search Bar for Hospitals */}
            <section className="filter-bar">
              <div className="filter-group">
                <div className="search-input-wrapper">
                  <SearchIcon size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search hospital name, district, address, or phone..."
                    className="form-input"
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                  />
                </div>

                <select
                  className="form-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="">All Districts</option>
                  {districts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>

                {(hospitalSearch || selectedDistrict) && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '8px 14px' }}
                    onClick={() => {
                      setHospitalSearch('');
                      setSelectedDistrict('');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </section>

            {/* Hospital Grid */}
            {loading ? (
              <div className="empty-state">
                <div className="empty-title">Loading hospitals...</div>
                <div className="empty-desc">Fetching registered medical centers from Neon PostgreSQL database.</div>
              </div>
            ) : filteredHospitals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <HospitalIcon size={32} />
                </div>
                <div className="empty-title">No hospitals found</div>
                <div className="empty-desc">
                  {hospitalSearch || selectedDistrict
                    ? "Try adjusting your search query or district filter."
                    : "Register your first hospital facility to get started."}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedHospital(null);
                    setIsHospitalModalOpen(true);
                  }}
                >
                  <PlusIcon size={18} />
                  <span>Register First Hospital</span>
                </button>
              </div>
            ) : (
              <section className="doctor-grid">
                {filteredHospitals.map(hosp => (
                  <HospitalCard
                    key={hosp.id}
                    hospital={hosp}
                    doctorCount={doctorCountPerHospital[hosp.id] || 0}
                    onEdit={(h) => {
                      setSelectedHospital(h);
                      setIsHospitalModalOpen(true);
                    }}
                    onDelete={(h) => setDeleteHospitalCandidate(h)}
                  />
                ))}
              </section>
            )}
          </>
        )}

        {/* DOCTOR MANAGEMENT TAB */}
        {activeTab === 'doctors' && (
          <>
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
          </>
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

      {/* Add / Edit Hospital Modal */}
      <HospitalModal
        isOpen={isHospitalModalOpen}
        onClose={() => {
          setIsHospitalModalOpen(false);
          setSelectedHospital(null);
        }}
        onSave={handleSaveHospital}
        hospital={selectedHospital}
      />

      {/* Auth Settings Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={() => setHasToken(!!getAuthToken())}
      />

      {/* Delete Doctor Confirmation Modal */}
      {deleteDoctorCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteDoctorCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#ef4444' }}>Delete Doctor</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.925rem', color: '#334155' }}>
                Are you sure you want to remove <strong>{deleteDoctorCandidate.fullName}</strong> ({deleteDoctorCandidate.specialization})?
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
                onClick={confirmDeleteDoctor}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Hospital Confirmation Modal */}
      {deleteHospitalCandidate && (
        <div className="modal-overlay" onClick={() => setDeleteHospitalCandidate(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: '#ef4444' }}>Delete Hospital</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.925rem', color: '#334155' }}>
                Are you sure you want to remove <strong>{deleteHospitalCandidate.name}</strong> ({deleteHospitalCandidate.district} District)?
              </p>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteHospitalCandidate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteHospital}
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
