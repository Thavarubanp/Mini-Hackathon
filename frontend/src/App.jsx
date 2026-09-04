import React, { useState, useEffect, useMemo } from 'react';
import { doctorApi, hospitalApi, appointmentApi, getAuthToken, getUserRole, getUsername, authApi } from './services/api';
import { DoctorCard } from './components/DoctorCard';
import { DoctorModal } from './components/DoctorModal';
import { HospitalCard } from './components/HospitalCard';
import { HospitalModal } from './components/HospitalModal';
import { AppointmentModal } from './components/AppointmentModal';
import { LoginModal } from './components/LoginModal';
import {
  StethoscopeIcon,
  HospitalIcon,
  PlusIcon,
  SearchIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  BuildingIcon
} from './components/Icons';

export function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'app' | 'login'
  const [activeTab, setActiveTab] = useState('hospitals'); // 'hospitals' | 'doctors' | 'appointments'

  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Auth State
  const [userRole, setUserRole] = useState(getUserRole());
  const [username, setUsernameState] = useState(getUsername());
  const [hasToken, setHasToken] = useState(!!getAuthToken());

  // Doctor Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  // Hospital Filters
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [deleteDoctorCandidate, setDeleteDoctorCandidate] = useState(null);

  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [deleteHospitalCandidate, setDeleteHospitalCandidate] = useState(null);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load Hospitals, Doctors & Appointments
  const loadData = async () => {
    setLoading(true);
    try {
      const [hospList, docList, apptList] = await Promise.all([
        hospitalApi.getAll().catch(() => []),
        doctorApi.getAll({
          hospitalId: selectedHospitalId || undefined,
          specialization: selectedSpecialization || undefined,
          search: searchTerm || undefined
        }).catch(() => []),
        appointmentApi.getAll().catch(() => [])
      ]);
      setHospitals(hospList);
      setDoctors(docList);
      setAppointments(apptList);
    } catch (err) {
      showToast(err.message || 'Failed to fetch data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedHospitalId, selectedSpecialization]);

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

  // Handle Login Success
  const handleLoginSuccess = (loginData) => {
    setUserRole(loginData.role);
    setUsernameState(loginData.username);
    setHasToken(true);
    showToast(`Logged in as ${loginData.role} (${loginData.username})`, 'success');
    setCurrentView('app');
    loadData();
  };

  // Handle Logout
  const handleLogout = () => {
    authApi.logout();
    setUserRole('Admin');
    setUsernameState('Guest User');
    setHasToken(false);
    showToast('Logged out.', 'success');
    setCurrentView('landing');
  };

  // Handle Save Doctor
  const handleSaveDoctor = async (formData, id) => {
    if (userRole !== 'Admin') {
      showToast('Admin permission required to add or edit doctors.', 'error');
      return;
    }
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
    if (userRole !== 'Admin') {
      showToast('Admin permission required to delete doctors.', 'error');
      setDeleteDoctorCandidate(null);
      return;
    }
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
    if (userRole !== 'Admin') {
      showToast('Admin permission required to add or edit hospitals.', 'error');
      return;
    }
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
    if (userRole !== 'Admin') {
      showToast('Admin permission required to delete hospitals.', 'error');
      setDeleteHospitalCandidate(null);
      return;
    }
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

  // Handle Book Appointment
  const handleBookAppointment = async (appointmentData) => {
    try {
      const created = await appointmentApi.create(appointmentData);
      setAppointments(prev => [created, ...prev]);
      showToast(`Appointment booked! Queue Number: #${created.queueNumber}`, 'success');
      setActiveTab('appointments');
    } catch (err) {
      showToast(err.message || 'Failed to book appointment.', 'error');
    }
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = async (id) => {
    try {
      await appointmentApi.delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
      showToast('Appointment cancelled.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to cancel appointment.', 'error');
    }
  };

  const isAdmin = userRole === 'Admin';

  return (
    <>
      {/* Navigation Header */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand-wrapper" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('landing')}>
            <div className="brand-icon">
              <StethoscopeIcon size={24} />
            </div>
            <div>
              <div className="brand-title">Suwa Sewa LK</div>
              <div className="brand-subtitle">Hospital & Queue Management</div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="nav-tabs">
            <button
              className={`nav-tab ${currentView === 'landing' ? 'active' : ''}`}
              onClick={() => setCurrentView('landing')}
            >
              <span>Home</span>
            </button>

            <button
              className={`nav-tab ${currentView === 'app' && activeTab === 'hospitals' ? 'active' : ''}`}
              onClick={() => { setCurrentView('app'); setActiveTab('hospitals'); }}
            >
              <HospitalIcon size={16} />
              <span>Hospitals</span>
            </button>

            <button
              className={`nav-tab ${currentView === 'app' && activeTab === 'doctors' ? 'active' : ''}`}
              onClick={() => { setCurrentView('app'); setActiveTab('doctors'); }}
            >
              <StethoscopeIcon size={16} />
              <span>Doctors</span>
            </button>

            <button
              className={`nav-tab ${currentView === 'app' && activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => { setCurrentView('app'); setActiveTab('appointments'); }}
            >
              <CalendarIcon size={16} />
              <span>Appointments</span>
            </button>
          </div>

          <div className="navbar-actions">
            {/* User & Role Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <UserIcon size={16} style={{ color: '#0284c7' }} />
              <span style={{ fontWeight: 600, color: '#334155' }}>{username}</span>
              <span style={{
                background: userRole === 'Admin' ? '#dcfce7' : userRole === 'Doctor' ? '#e0f2fe' : '#f3e8ff',
                color: userRole === 'Admin' ? '#15803d' : userRole === 'Doctor' ? '#0369a1' : '#7e22ce',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                {userRole}
              </span>
            </div>

            <button
              className="btn btn-secondary"
              title="User Login / Switch Role"
              onClick={() => setIsLoginModalOpen(true)}
            >
              <KeyIcon size={16} />
              <span>{hasToken ? 'Switch Role' : 'Login'}</span>
            </button>

            <button
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
              onClick={() => setIsAppointmentModalOpen(true)}
            >
              <CalendarIcon size={16} />
              <span>Book Queue</span>
            </button>
          </div>
        </div>
      </header>

      {/* SEPARATE LANDING PAGE VIEW */}
      {currentView === 'landing' && (
        <main className="app-container">
          <section className="hero-banner" style={{ textAlign: 'center', padding: '60px 0 40px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e0f2fe', color: '#0284c7', padding: '6px 16px', borderRadius: '99px', fontSize: '0.875rem', fontWeight: '700', marginBottom: '16px' }}>
              🏥 Sri Lanka's National Healthcare & Queue System
            </div>
            <h1 className="hero-title" style={{ fontSize: '3rem', maxWidth: '800px', margin: '0 auto 16px', lineHeight: '1.2' }}>
              Streamlined Hospital Management & Instant Token Queues
            </h1>
            <p className="hero-description" style={{ maxWidth: '680px', margin: '0 auto 28px', fontSize: '1.125rem' }}>
              Connecting base hospitals, certified specialists, and patient appointment queues across Sri Lanka with real-time token tracking.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '14px 28px', fontSize: '1rem', background: 'linear-gradient(135deg, #059669, #047857)' }}
                onClick={() => setIsAppointmentModalOpen(true)}
              >
                <CalendarIcon size={20} />
                <span>Book Appointment & Get Queue Token</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1rem' }}
                onClick={() => { setCurrentView('app'); setActiveTab('hospitals'); }}
              >
                <HospitalIcon size={20} />
                <span>Explore Hospitals & Facilities</span>
              </button>
            </div>
          </section>

          {/* Features Grid */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', margin: '40px 0 60px' }}>
            <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '28px' }}>
              <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0284c7', width: '56px', height: '56px', marginBottom: '12px' }}>
                <HospitalIcon size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Hospital Management</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Register and manage base hospitals, contact details, and district coverage with EF Core & Neon PostgreSQL backend.
              </p>
            </div>

            <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '28px' }}>
              <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea', width: '56px', height: '56px', marginBottom: '12px' }}>
                <StethoscopeIcon size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Doctor Schedules</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Search doctors by specialization, hospital affiliation, and consultation availability timeslots.
              </p>
            </div>

            <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '28px' }}>
              <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#166534', width: '56px', height: '56px', marginBottom: '12px' }}>
                <CalendarIcon size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Token & Queue System</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Patients receive an instant auto-calculated Queue Token (#1, #2, #3...) for their appointment date.
              </p>
            </div>
          </section>
        </main>
      )}

      {/* DASHBOARD APPLICATION VIEWS */}
      {currentView === 'app' && (
        <main className="app-container">
          {/* Role Banner if not Admin */}
          {!isAdmin && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '12px 18px', margin: '20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e40af', fontSize: '0.875rem' }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <span>Logged in as <strong>{userRole}</strong>. Switch to <strong>Admin</strong> role for full create, edit, and delete permissions.</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                onClick={() => setIsLoginModalOpen(true)}
              >
                Switch Role to Admin
              </button>
            </div>
          )}

          {/* HOSPITAL MANAGEMENT TAB */}
          {activeTab === 'hospitals' && (
            <>
              <section className="hero-banner">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h1 className="hero-title">Hospital Network & Facilities</h1>
                    <p className="hero-description">
                      Manage registered base hospitals, district general hospitals, and medical centers across Sri Lanka.
                    </p>
                  </div>
                  {isAdmin && (
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
                  )}
                </div>

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

              {loading ? (
                <div className="empty-state">
                  <div className="empty-title">Loading hospitals...</div>
                </div>
              ) : filteredHospitals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><HospitalIcon size={32} /></div>
                  <div className="empty-title">No hospitals found</div>
                </div>
              ) : (
                <section className="doctor-grid">
                  {filteredHospitals.map(hosp => (
                    <HospitalCard
                      key={hosp.id}
                      hospital={hosp}
                      doctorCount={doctorCountPerHospital[hosp.id] || 0}
                      userRole={userRole}
                      onEdit={(h) => { setSelectedHospital(h); setIsHospitalModalOpen(true); }}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h1 className="hero-title">Medical Staff & Doctor Schedules</h1>
                    <p className="hero-description">
                      Manage certified physicians, availability timeslots, and hospital affiliations across Sri Lanka.
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      className="btn btn-primary"
                      onClick={() => { setSelectedDoctor(null); setIsDoctorModalOpen(true); }}
                    >
                      <PlusIcon size={18} />
                      <span>Add Doctor</span>
                    </button>
                  )}
                </div>

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
                </div>
              </section>

              <section className="doctor-grid">
                {doctors.map(doctor => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    userRole={userRole}
                    onEdit={(doc) => { setSelectedDoctor(doc); setIsDoctorModalOpen(true); }}
                    onDelete={(doc) => setDeleteDoctorCandidate(doc)}
                  />
                ))}
              </section>
            </>
          )}

          {/* APPOINTMENTS & QUEUE MANAGEMENT TAB */}
          {activeTab === 'appointments' && (
            <>
              <section className="hero-banner">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h1 className="hero-title">Patient Appointments & Live Queue Tokens</h1>
                    <p className="hero-description">
                      Real-time appointment queues, token status, and consultation scheduling.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                    onClick={() => setIsAppointmentModalOpen(true)}
                  >
                    <CalendarIcon size={18} />
                    <span>Book New Appointment</span>
                  </button>
                </div>
              </section>

              {appointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><CalendarIcon size={32} /></div>
                  <div className="empty-title">No appointments booked yet</div>
                  <div className="empty-desc">Book your first doctor appointment to receive an instant queue token.</div>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                    onClick={() => setIsAppointmentModalOpen(true)}
                  >
                    Book First Appointment
                  </button>
                </div>
              ) : (
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                  {appointments.map(appt => (
                    <div key={appt.id} className="doctor-card" style={{ borderTop: '4px solid #059669' }}>
                      <div className="doctor-card-header">
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase' }}>
                            Appointment #{appt.id}
                          </div>
                          <h3 className="doctor-name">{appt.patientName}</h3>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📞 {appt.patientPhone}</div>
                        </div>

                        {/* Queue Token Badge */}
                        <div style={{ background: '#dcfce7', border: '2px solid #86efac', borderRadius: '12px', padding: '6px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Queue Token</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#15803d', lineHeight: '1.1' }}>#{appt.queueNumber}</div>
                        </div>
                      </div>

                      <div className="doctor-info-list" style={{ marginTop: '12px' }}>
                        <div className="doctor-info-item">
                          <StethoscopeIcon size={16} className="doctor-info-icon" style={{ color: '#059669' }} />
                          <span style={{ fontWeight: 600 }}>Dr. {appt.doctorName}</span>
                        </div>

                        <div className="doctor-info-item">
                          <HospitalIcon size={16} className="doctor-info-icon" style={{ color: '#0284c7' }} />
                          <span>{appt.hospitalName}</span>
                        </div>

                        <div className="doctor-schedule-pill">
                          <CalendarIcon size={14} style={{ color: '#059669' }} />
                          <span>{new Date(appt.appointmentDate).toLocaleDateString()}</span>
                          <span className="day-badge" style={{ background: appt.status === 'Confirmed' ? '#dcfce7' : '#fee2e2', color: appt.status === 'Confirmed' ? '#15803d' : '#991b1b' }}>
                            {appt.status}
                          </span>
                        </div>
                      </div>

                      <div className="doctor-card-footer">
                        <button
                          className="btn-icon danger"
                          title="Cancel Appointment"
                          onClick={() => handleCancelAppointment(appt.id)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </main>
      )}

      {/* MODALS */}
      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => { setIsDoctorModalOpen(false); setSelectedDoctor(null); }}
        onSave={handleSaveDoctor}
        doctor={selectedDoctor}
        hospitals={hospitals}
      />

      <HospitalModal
        isOpen={isHospitalModalOpen}
        onClose={() => { setIsHospitalModalOpen(false); setSelectedHospital(null); }}
        onSave={handleSaveHospital}
        hospital={selectedHospital}
      />

      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onBook={handleBookAppointment}
        hospitals={hospitals}
        doctors={doctors}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Containers */}
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
