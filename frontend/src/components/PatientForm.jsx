import React from 'react';
import './PatientForm.css';

export default function PatientForm({ patient, onSubmit, onCancel, isLoading }) {
    const [formData, setFormData] = React.useState(patient || {
        fullName: "",
        nic: "",
        phoneNumber: "",
        district: ""
    });

    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isLoading) {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, onCancel]);

    const validate = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
        else if (formData.fullName.length > 200) newErrors.fullName = "Cannot exceed 200 characters.";

        if (!formData.nic.trim()) newErrors.nic = "NIC is required.";
        else if (formData.nic.length > 20) newErrors.nic = "Cannot exceed 20 characters.";

        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required.";
        else if (!/^\d{10}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "Must be exactly 10 digits.";

        if (!formData.district.trim()) newErrors.district = "District is required.";
        else if (formData.district.length > 100) newErrors.district = "Cannot exceed 100 characters.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error on type
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{patient ? "Edit Patient" : "Add Patient"}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            autoFocus
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            maxLength="200"
                            disabled={isLoading}
                        />
                        {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="nic">NIC</label>
                        <input
                            type="text"
                            id="nic"
                            name="nic"
                            value={formData.nic}
                            onChange={handleChange}
                            placeholder="123456789V"
                            maxLength="20"
                            disabled={isLoading}
                        />
                        {errors.nic && <span className="error-text">{errors.nic}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="0712345678"
                            maxLength="10"
                            disabled={isLoading}
                        />
                        {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="district">District</label>
                        <input
                            type="text"
                            id="district"
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            placeholder="Colombo"
                            maxLength="100"
                            disabled={isLoading}
                        />
                        {errors.district && <span className="error-text">{errors.district}</span>}
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
