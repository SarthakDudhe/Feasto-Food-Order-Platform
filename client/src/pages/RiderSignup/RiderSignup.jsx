import React, { useState } from 'react';
import axios from 'axios';
import './RiderSignup.css';

const RiderSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicleType: 'Scooter'
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const url = "http://localhost:4000"; // Can use context if needed, but hardcoding for simplicity given client setup

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Submitting application...' });
    
    try {
      const res = await axios.post(`${url}/api/rider/register`, formData);
      if (res.data.success) {
        setStatus({ type: 'success', message: 'Application submitted! Awaiting admin verification.' });
        setFormData({ name: '', email: '', password: '', phone: '', vehicleType: 'Scooter' });
      } else {
        setStatus({ type: 'error', message: res.data.message });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'An error occurred while submitting your application.' });
    }
  };

  return (
    <div className="rider-signup-page">
      <div className="rider-signup-container">
        <h2>Become a Feasto Rider 🛵</h2>
        <p className="rider-signup-subtitle">Join our fleet, deliver smiles, and earn on your own schedule.</p>
        
        {status.message && (
          <div className={`status-banner ${status.type}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rider-signup-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 9876543210" />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 8 characters" minLength="8" />
          </div>
          
          <div className="form-group">
            <label>Vehicle Type</label>
            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
              <option value="Scooter">Scooter</option>
              <option value="E-Bike">E-Bike</option>
              <option value="Bicycle">Bicycle</option>
              <option value="Van">Van</option>
            </select>
          </div>
          
          <button type="submit" className="submit-btn" disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Applying...' : 'Apply Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RiderSignup;
