import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageRiders.css';

const ManageRiders = ({ url }) => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedRider, setSelectedRider] = useState(null);

  // Modal forms state
  const [misconductForm, setMisconductForm] = useState({ reason: '', severity: 'Low' });
  const [verificationForm, setVerificationForm] = useState({
    idVerified: false,
    vehicleDocsVerified: false,
    backgroundCheckPassed: false
  });

  const fetchRiders = async () => {
    try {
      const response = await axios.get(`${url}/api/rider/list`);
      if (response.data.success) {
        setRiders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching riders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const openRiderDetails = (rider) => {
    setSelectedRider(rider);
    setVerificationForm({
      idVerified: rider.verificationDetails?.idVerified || false,
      vehicleDocsVerified: rider.verificationDetails?.vehicleDocsVerified || false,
      backgroundCheckPassed: rider.verificationDetails?.backgroundCheckPassed || false
    });
  };

  const closeRiderDetails = () => {
    setSelectedRider(null);
    setMisconductForm({ reason: '', severity: 'Low' });
  };

  // Status mapping for legacy data where accountStatus might be missing
  const getRiderStatus = (rider) => {
    if (rider.accountStatus) return rider.accountStatus;
    // Fallback for old data
    return rider.isVerified ? 'Active' : 'Pending';
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await axios.post(`${url}/api/rider/update-status`, { riderId: selectedRider._id, status });
      if (res.data.success) {
        alert(`Rider marked as ${status}`);
        fetchRiders();
        setSelectedRider({ ...selectedRider, accountStatus: status });
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleVerificationUpdate = async () => {
    try {
      const res = await axios.post(`${url}/api/rider/update-verification`, {
        riderId: selectedRider._id,
        ...verificationForm
      });
      if (res.data.success) {
        alert("Verification details saved!");
        fetchRiders();
        // If they auto-activated, close modal or update local state
        if (res.data.rider) setSelectedRider(res.data.rider);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update verification details");
    }
  };

  const handleAddMisconduct = async (e) => {
    e.preventDefault();
    if (!misconductForm.reason.trim()) return;

    try {
      const res = await axios.post(`${url}/api/rider/add-misconduct`, {
        riderId: selectedRider._id,
        reason: misconductForm.reason,
        severity: misconductForm.severity
      });
      if (res.data.success) {
        alert("Misconduct report added!");
        setMisconductForm({ reason: '', severity: 'Low' });
        fetchRiders();
        // Force refresh modal data by refetching all and re-finding this rider (or just close modal)
        closeRiderDetails(); 
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add misconduct report");
    }
  };

  const filteredRiders = riders.filter(r => {
    const status = getRiderStatus(r);
    if (activeTab === 'Pending') return status === 'Pending';
    if (activeTab === 'Active') return status === 'Active';
    if (activeTab === 'Suspended/Blocked') return status === 'Suspended' || status === 'Blocked';
    return false;
  });

  if (loading) {
    return <div className="manage-riders-loading">Loading riders...</div>;
  }

  return (
    <div className="manage-riders-page add">
      <div className="page-intro">
        <span className="page-intro-eyebrow">Fleet Management</span>
        <h1>Manage Riders</h1>
        <p>Review verifications, track misconduct, and manage delivery partner access.</p>
      </div>

      <div className="rider-tabs">
        <button className={activeTab === 'Pending' ? 'active' : ''} onClick={() => setActiveTab('Pending')}>Pending Verification</button>
        <button className={activeTab === 'Active' ? 'active' : ''} onClick={() => setActiveTab('Active')}>Active Fleet</button>
        <button className={activeTab === 'Suspended/Blocked' ? 'active' : ''} onClick={() => setActiveTab('Suspended/Blocked')}>Suspended / Blocked</button>
      </div>

      <div className="riders-list-container">
        {filteredRiders.length === 0 ? (
          <p className="no-riders-msg">No riders found in this category.</p>
        ) : (
          <div className="riders-grid">
            {filteredRiders.map((rider) => {
              const status = getRiderStatus(rider);
              return (
                <div key={rider._id} className={`rider-profile-card ${status.toLowerCase()}`}>
                  <div className="rider-card-header">
                    <h3>{rider.name}</h3>
                    <span className={`status-badge badge-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="rider-details">
                    <p><strong>Email:</strong> {rider.email}</p>
                    <p><strong>Phone:</strong> {rider.phone}</p>
                    <p><strong>Vehicle:</strong> {rider.vehicleType}</p>
                    {rider.misconductReports && rider.misconductReports.length > 0 && (
                      <p className="strikes-warning">⚠️ {rider.misconductReports.length} Misconduct Report(s)</p>
                    )}
                  </div>
                  
                  <div className="rider-actions">
                    <button onClick={() => openRiderDetails(rider)} className="btn-manage-rider">
                      Manage Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIDER MANAGEMENT MODAL */}
      {selectedRider && (
        <div className="rider-modal-overlay" onClick={closeRiderDetails}>
          <div className="rider-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRider.name} - Profile Management</h2>
              <button className="close-btn" onClick={closeRiderDetails}>✕</button>
            </div>

            <div className="modal-body">
              {/* Verification Section */}
              <div className="management-section">
                <h3>Verification Documents</h3>
                <div className="checkbox-group">
                  <label>
                    <input type="checkbox" checked={verificationForm.idVerified} onChange={e => setVerificationForm({...verificationForm, idVerified: e.target.checked})} />
                    Government ID Verified
                  </label>
                  <label>
                    <input type="checkbox" checked={verificationForm.vehicleDocsVerified} onChange={e => setVerificationForm({...verificationForm, vehicleDocsVerified: e.target.checked})} />
                    Vehicle Registration & Insurance Verified
                  </label>
                  <label>
                    <input type="checkbox" checked={verificationForm.backgroundCheckPassed} onChange={e => setVerificationForm({...verificationForm, backgroundCheckPassed: e.target.checked})} />
                    Background Check Passed
                  </label>
                </div>
                <button className="btn-save-verification" onClick={handleVerificationUpdate}>Save Verification Progress</button>
              </div>

              <hr />

              {/* Status Controls */}
              <div className="management-section">
                <h3>Account Access Controls</h3>
                <p>Current Status: <strong>{getRiderStatus(selectedRider)}</strong></p>
                <div className="status-buttons">
                  <button className="btn-activate" onClick={() => handleStatusChange('Active')} disabled={getRiderStatus(selectedRider) === 'Active'}>Set Active</button>
                  <button className="btn-suspend" onClick={() => handleStatusChange('Suspended')} disabled={getRiderStatus(selectedRider) === 'Suspended'}>Suspend Account</button>
                  <button className="btn-block" onClick={() => handleStatusChange('Blocked')} disabled={getRiderStatus(selectedRider) === 'Blocked'}>Block Account</button>
                </div>
              </div>

              <hr />

              {/* Misconduct Section */}
              <div className="management-section">
                <h3>Misconduct Tracking</h3>
                <form onSubmit={handleAddMisconduct} className="misconduct-form">
                  <input type="text" placeholder="Reason for report (e.g. late delivery, rude behavior)" value={misconductForm.reason} onChange={e => setMisconductForm({...misconductForm, reason: e.target.value})} required />
                  <select value={misconductForm.severity} onChange={e => setMisconductForm({...misconductForm, severity: e.target.value})}>
                    <option value="Low">Low Severity</option>
                    <option value="Medium">Medium Severity</option>
                    <option value="High">High Severity (Auto-Suspends)</option>
                  </select>
                  <button type="submit" className="btn-add-strike">Log Misconduct</button>
                </form>

                <div className="misconduct-history">
                  <h4>History</h4>
                  {(!selectedRider.misconductReports || selectedRider.misconductReports.length === 0) ? (
                    <p className="no-history">No reports on file. Clean record!</p>
                  ) : (
                    <ul>
                      {selectedRider.misconductReports.map((report, idx) => (
                        <li key={idx} className={`severity-${report.severity.toLowerCase()}`}>
                          <strong>{new Date(report.date).toLocaleDateString()}</strong> - {report.reason} <em>({report.severity})</em>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRiders;
