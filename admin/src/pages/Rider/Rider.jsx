import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./Rider.css";

// Fixed Bandra Kitchen starting point
const KITCHEN_COORDS = [72.8296, 19.0544];

export default function Rider({ url }) {
  const [token, setToken] = useState(localStorage.getItem("riderToken") || "");
  const [riderData, setRiderData] = useState(JSON.parse(localStorage.getItem("riderData")) || null);
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [authData, setAuthData] = useState({ name: "", email: "", password: "", phone: "", vehicleType: "Scooter" });
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [activeSimulations, setActiveSimulations] = useState({});
  const simulationStepsRef = useRef({});

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpOrderId, setOtpOrderId] = useState(null);

  // Authentication Handlers
  const handleAuthChange = (e) => {
    setAuthData({ ...authData, [e.target.name]: e.target.value });
  };

  const submitAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/api/rider/login" : "/api/rider/register";
    try {
      const res = await axios.post(url + endpoint, authData);
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem("riderToken", res.data.token);
        if (res.data.rider) {
            setRiderData(res.data.rider);
            localStorage.setItem("riderData", JSON.stringify(res.data.rider));
        } else if (!isLogin) {
            // After register, it might not return rider data, just token
            // Simplest is to force them to login after register or we fetch profile
            alert("Registration successful, please login.");
            setIsLogin(true);
            setToken("");
            localStorage.removeItem("riderToken");
        }
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Authentication failed");
    }
  };

  const logout = () => {
    setToken("");
    setRiderData(null);
    localStorage.removeItem("riderToken");
    localStorage.removeItem("riderData");
  };

  // Fetch assigned orders for this rider
  const fetchAssignedOrders = async () => {
    if (!riderData || !riderData._id) return;
    try {
      const res = await axios.get(`${url}/api/order/list`);
      if (res.data && res.data.success) {
        // Filter orders assigned to this rider
        const assigned = res.data.data.filter(o => o.riderId === riderData._id);
        setOrders(assigned);
      }
    } catch (err) {
      console.error("Error fetching orders for rider:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && riderData) {
      setLoading(true);
      fetchAssignedOrders();
      const pollInterval = setInterval(fetchAssignedOrders, 6000);
      return () => clearInterval(pollInterval);
    }
  }, [token, riderData, url]);


  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: newStatus,
      });
      if (res.data.success) {
        fetchAssignedOrders();
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  // OTP Verification
  const openOtpModal = (orderId) => {
    setOtpOrderId(orderId);
    setShowOtpModal(true);
    setOtpInput("");
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await axios.post(`${url}/api/order/verify-delivery`, {
        orderId: otpOrderId,
        otp: otpInput
      });
      if (res.data.success) {
        alert("Delivery Verified Successfully!");
        setShowOtpModal(false);
        fetchAssignedOrders();
        
        // Stop simulation if running
        if (activeSimulations[otpOrderId]) {
            clearInterval(activeSimulations[otpOrderId]);
            setActiveSimulations((prev) => {
              const next = { ...prev };
              delete next[otpOrderId];
              return next;
            });
            delete simulationStepsRef.current[otpOrderId];
        }
      } else {
        alert(res.data.message || "Invalid OTP!");
      }
    } catch (error) {
      console.error(error);
      alert("Error verifying OTP");
    }
  };


  const toggleLiveSimulation = (order) => {
    const orderId = order._id;

    if (activeSimulations[orderId]) {
      clearInterval(activeSimulations[orderId]);
      setActiveSimulations((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      return;
    }

    const targetLng = order.address?.lng || 72.8347;
    const targetLat = order.address?.lat || 19.1136;
    const startLng = order.riderLng || KITCHEN_COORDS[0];
    const startLat = order.riderLat || KITCHEN_COORDS[1];

    let currentStep = simulationStepsRef.current[orderId] || 0;
    const totalSteps = 25; 

    handleUpdateStatus(orderId, "Out for delivery");

    const intervalId = setInterval(async () => {
      currentStep++;
      simulationStepsRef.current[orderId] = currentStep;

      const progress = Math.min(currentStep / totalSteps, 1);
      const currLng = startLng + (targetLng - startLng) * progress;
      const currLat = startLat + (targetLat - startLat) * progress;

      try {
        await axios.post(`${url}/api/order/update-location`, {
          orderId,
          riderLat: currLat,
          riderLng: currLng,
          // DO NOT set to delivered automatically, require OTP!
          status: "Out for delivery",
        });
      } catch (err) {
        console.error("GPS simulation update failed:", err);
      }

      if (progress >= 1) {
        clearInterval(intervalId);
        setActiveSimulations((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        delete simulationStepsRef.current[orderId];
      }
    }, 2000);

    setActiveSimulations((prev) => ({ ...prev, [orderId]: intervalId }));
  };

  useEffect(() => {
    return () => {
      Object.values(activeSimulations).forEach((timer) => clearInterval(timer));
    };
  }, [activeSimulations]);

  if (!token || !riderData) {
    return (
      <div className="rider-auth-container">
        <form onSubmit={submitAuth} className="rider-auth-form">
          <h2>Rider Login</h2>
          
          <input type="email" name="email" placeholder="Email Address" onChange={handleAuthChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleAuthChange} required />
          
          <button type="submit" className="rider-auth-btn">Login</button>
          
          <p className="rider-auth-toggle">
            To join our fleet, please apply through the main Feasto website.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="rider-portal-container">
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Verify Delivery OTP</h3>
            <p>Please ask the customer for the 4-digit OTP shown on their tracking screen.</p>
            <input 
                type="text" 
                maxLength="4" 
                value={otpInput} 
                onChange={e => setOtpInput(e.target.value)} 
                placeholder="0 0 0 0" 
                className="otp-input"
            />
            <div className="otp-actions">
                <button onClick={() => setShowOtpModal(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleVerifyOtp} className="btn-verify">Verify & Deliver</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rider-portal-header">
        <div className="rider-header-left">
          <span className="rider-badge">🛵 FEASTO FLEET</span>
          <h1>Welcome back, {riderData.name}</h1>
          <p>Real-time order management and live GPS tracking.</p>
        </div>

        <div className="rider-header-right">
          <button onClick={logout} className="rider-logout-btn">Logout</button>
        </div>
      </div>

      <div className="driver-stats-bar">
        <div className="driver-stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <h3>{orders.length}</h3>
            <p>Assigned</p>
          </div>
        </div>
      </div>

      <div className="rider-deliveries-section">
        <h2>Your Deliveries</h2>

        {loading ? (
          <div className="rider-loading"><p>Loading...</p></div>
        ) : orders.length > 0 ? (
          <div className="rider-orders-grid">
            {orders.map((order) => {
              const isSimulating = !!activeSimulations[order._id];
              const isDelivered = order.status === "Delivered";

              return (
                <div
                  key={order._id}
                  className={`rider-order-card ${isSimulating ? "simulating" : ""} ${
                    isDelivered ? "delivered" : ""
                  }`}
                >
                  <div className="card-header-row">
                    <span className="order-id-tag">
                      #{order._id.substring(order._id.length - 6).toUpperCase()}
                    </span>
                    <span className={`order-status-badge ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="card-customer-info">
                    <h4>👤 {order.address.firstName} {order.address.lastName}</h4>
                    <p className="cust-phone">📞 {order.address.phone}</p>
                    <p className="cust-address">
                      📍 {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                  </div>

                  {order.notes && (
                    <div className="rider-notes-box">
                      <span className="notes-icon">🍳</span>
                      <div>
                        <strong>Kitchen & Delivery Note:</strong>
                        <p>"{order.notes}"</p>
                      </div>
                    </div>
                  )}

                  <div className="rider-card-actions">
                    <button
                      disabled={isDelivered}
                      onClick={() => handleUpdateStatus(order._id, "Out for delivery")}
                      className={`btn-rider-action pickup ${order.status === "Out for delivery" ? "active" : ""}`}
                    >
                      📦 Picked Up
                    </button>

                    <button
                      disabled={isDelivered}
                      onClick={() => toggleLiveSimulation(order)}
                      className={`btn-rider-action drive ${isSimulating ? "stop" : ""}`}
                    >
                      {isSimulating ? "🛑 Stop Drive Sim" : "🚀 Start Live Drive Sim"}
                    </button>

                    <button
                      disabled={isDelivered || order.status !== "Out for delivery"}
                      onClick={() => openOtpModal(order._id)}
                      className="btn-rider-action deliver"
                    >
                      ✅ Enter OTP to Deliver
                    </button>
                  </div>

                  {isSimulating && (
                    <div className="live-sim-status-bar">
                      <span className="pulse-dot-red"></span>
                      <span>Broadcasting live GPS...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-assigned-orders">
            <span className="empty-icon">🛵</span>
            <h3>No Active Deliveries Assigned</h3>
            <p>Wait for the Admin to assign you new orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}
