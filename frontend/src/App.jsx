import { useState, useEffect } from 'react';
import { fetchPatients, createPatient, updatePatient, deletePatient } from './api';
import PatientForm from './components/PatientForm';
import './App.css';

function App() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name"); // "name" or "nic"
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (query = "", type = searchType) => {
    setLoading(true);
    setGlobalError("");
    try {
      let data;
      if (query) {
        if (type === "nic") {
           data = await fetchPatients("", query);
        } else {
           data = await fetchPatients(query, "");
        }
      } else {
         data = await fetchPatients();
      }
      setPatients(data);
    } catch (err) {
      setGlobalError(err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPatients(searchQuery, searchType);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadPatients("", searchType);
  };

  const handleSavePatient = async (patientData) => {
    setIsSaving(true);
    setGlobalError("");
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, patientData);
      } else {
        await createPatient(patientData);
      }
      setIsFormOpen(false);
      setEditingPatient(null);
      loadPatients(searchQuery, searchType); // Reload current view
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return; // Prevent multiple requests
    if (!window.confirm("Are you sure you want to delete this patient?")) return;
    setGlobalError("");
    setDeletingId(id);
    try {
      await deletePatient(id);
      loadPatients(searchQuery, searchType);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <h1>Suwa Sewa LK</h1>
          <span className="badge">Hackathon Edition</span>
        </div>
        <h2>Patient Management</h2>
      </header>

      <main className="dashboard">
        {globalError && (
          <div className="alert-error">
             <strong>Error:</strong> {globalError}
          </div>
        )}

        <div className="toolbar">
          <form className="search-bar" onSubmit={handleSearch}>
             <select 
               value={searchType} 
               onChange={(e) => setSearchType(e.target.value)}
               className="search-select"
             >
                <option value="name">Name / District</option>
                <option value="nic">NIC</option>
             </select>
             <input 
               type="text" 
               placeholder="Search..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <button type="submit" className="btn-secondary">Search</button>
             {searchQuery && (
               <button type="button" onClick={handleClearSearch} className="btn-text">Clear</button>
             )}
          </form>

          <button 
            className="btn-primary" 
            onClick={() => { setEditingPatient(null); setIsFormOpen(true); }}
          >
            + Add Patient
          </button>
        </div>

        <div className="table-container">
          {loading ? (
             <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading patients...</p>
             </div>
          ) : patients.length === 0 ? (
             <div className="empty-state">
                <p>No patients found.</p>
                <p className="subtitle">Try adjusting your search or add a new patient.</p>
             </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>NIC</th>
                  <th>Phone Number</th>
                  <th>District</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td className="id-col">#{p.id}</td>
                    <td>{p.fullName}</td>
                    <td><span className="badge-nic">{p.nic}</span></td>
                    <td>{p.phoneNumber}</td>
                    <td>{p.district}</td>
                    <td className="actions-col">
                      <button 
                        className="btn-action edit"
                        onClick={() => { setEditingPatient(p); setIsFormOpen(true); }}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-action delete"
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {isFormOpen && (
         <PatientForm 
           patient={editingPatient}
           isLoading={isSaving}
           onSubmit={handleSavePatient}
           onCancel={() => { setIsFormOpen(false); setEditingPatient(null); setGlobalError(""); }}
         />
      )}
    </div>
  );
}

export default App;
