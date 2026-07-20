import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageRiders.css';

const ManageRiders = ({ url }) => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleVerify = async (riderId) => {
    try {
      const response = await axios.post(`${url}/api/rider/verify`, { riderId });
      if (response.data.success) {
        alert("Rider verified successfully!");
        fetchRiders(); // Refresh list
      } else {
        alert(response.data.message || "Failed to verify rider");
      }
    } catch (error) {
      console.error(error);
      alert("Error verifying rider");
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  if (loading) {
    return <div className="manage-riders-loading">Loading riders...</div>;
  }

  return (
    <div className="manage-riders-page add">
      <div className="page-intro">
        <span className="page-intro-eyebrow">Fleet Management</span>
        <h1>Manage Riders</h1>
        <p>Review and verify delivery partners before they can accept orders.</p>
      </div>

      <div className="riders-list-container">
        {riders.length === 0 ? (
          <p className="no-riders-msg">No riders found.</p>
        ) : (
          <div className="riders-grid">
            {riders.map((rider) => (
              <div key={rider._id} className={`rider-profile-card ${rider.isVerified ? 'verified' : 'pending'}`}>
                <div className="rider-card-header">
                  <h3>{rider.name}</h3>
                  <span className={`status-badge ${rider.isVerified ? 'badge-verified' : 'badge-pending'}`}>
                    {rider.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
                
                <div className="rider-details">
                  <p><strong>Email:</strong> {rider.email}</p>
                  <p><strong>Phone:</strong> {rider.phone}</p>
                  <p><strong>Vehicle:</strong> {rider.vehicleType}</p>
                </div>
                
                {!rider.isVerified && (
                  <div className="rider-actions">
                    <button onClick={() => handleVerify(rider._id)} className="btn-verify-rider">
                      Approve & Verify
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRiders;
