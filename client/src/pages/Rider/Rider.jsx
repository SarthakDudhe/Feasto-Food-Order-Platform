import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./Rider.css";

const RIDERS_LIST = [
  "John Doe (Scooter)",
  "Jane Smith (E-Bike)",
  "Bob Johnson (Van)",
  "Alice Williams (Walk)",
];

// Fixed Bandra Kitchen starting point
const KITCHEN_COORDS = [72.8296, 19.0544];

export default function Rider() {
  const { url } = useContext(StoreContext);
  const [selectedRider, setSelectedRider] = useState(RIDERS_LIST[0]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSimulations, setActiveSimulations] = useState({}); // { [orderId]: intervalId }
  const simulationStepsRef = useRef({}); // { [orderId]: stepCount }

  // Fetch all orders and filter by selected rider
  const fetchAssignedOrders = async () => {
    try {
      const res = await axios.get(`${url}/api/order/list`);
      if (res.data && res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching orders for rider:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
    const pollInterval = setInterval(fetchAssignedOrders, 6000);
    return () => clearInterval(pollInterval);
  }, [url]);

  // Filter orders assigned to the selected rider
  const assignedOrders = orders.filter(
    (o) => o.riderName && o.riderName.trim().toLowerCase() === selectedRider.trim().toLowerCase()
  );

  // Status handler
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

  // Live GPS Simulation Toggle
  const toggleLiveSimulation = (order) => {
    const orderId = order._id;

    // Stop simulation if already running
    if (activeSimulations[orderId]) {
      clearInterval(activeSimulations[orderId]);
      setActiveSimulations((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      return;
    }

    // Start live simulation step by step towards customer coords
    // Default fallback coords if customer coords unavailable (~2.5km away)
    const targetLng = order.address?.lng || 72.8347;
    const targetLat = order.address?.lat || 19.1136;

    const startLng = order.riderLng || KITCHEN_COORDS[0];
    const startLat = order.riderLat || KITCHEN_COORDS[1];

    let currentStep = simulationStepsRef.current[orderId] || 0;
    const totalSteps = 25; // 25 steps to cover route over ~50 seconds

    // Automatically update status to "Out for delivery" when starting drive
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
          status: progress >= 1 ? "Delivered" : "Out for delivery",
        });
      } catch (err) {
        console.error("GPS simulation update failed:", err);
      }

      // If arrived at destination
      if (progress >= 1) {
        clearInterval(intervalId);
        setActiveSimulations((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        delete simulationStepsRef.current[orderId];
        fetchAssignedOrders();
      }
    }, 2000);

    setActiveSimulations((prev) => ({ ...prev, [orderId]: intervalId }));
  };

  // Clean up all simulation timers on unmount
  useEffect(() => {
    return () => {
      Object.values(activeSimulations).forEach((timer) => clearInterval(timer));
    };
  }, [activeSimulations]);

  return (
    <div className="rider-portal-container">
      {/* Header Banner */}
      <div className="rider-portal-header">
        <div className="rider-header-left">
          <span className="rider-badge">🛵 FEASTO FLEET DRIVER PORTAL</span>
          <h1>Driver Navigation & Dispatch</h1>
          <p>Real-time order management, kitchen pickup routing, and live GPS tracking.</p>
        </div>

        {/* Rider Selector Dropdown */}
        <div className="rider-selector-box">
          <label>Active Fleet Partner Profile:</label>
          <select
            value={selectedRider}
            onChange={(e) => setSelectedRider(e.target.value)}
            className="rider-select-dropdown"
          >
            {RIDERS_LIST.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Driver Dashboard Stats Bar */}
      <div className="driver-stats-bar">
        <div className="driver-stat-card">
          <span className="stat-icon">📦</span>
          <div>
            <h3>{assignedOrders.length}</h3>
            <p>Assigned Deliveries</p>
          </div>
        </div>
        <div className="driver-stat-card">
          <span className="stat-icon">💵</span>
          <div>
            <h3>${(assignedOrders.length * 4.5).toFixed(2)}</h3>
            <p>Shift Earnings</p>
          </div>
        </div>
        <div className="driver-stat-card">
          <span className="stat-icon">⭐</span>
          <div>
            <h3>4.9 / 5.0</h3>
            <p>Driver Rating</p>
          </div>
        </div>
        <div className="driver-stat-card">
          <span className="stat-icon">🔋</span>
          <div>
            <h3>88%</h3>
            <p>Vehicle Power</p>
          </div>
        </div>
      </div>

      {/* Main Active Deliveries Section */}
      <div className="rider-deliveries-section">
        <h2>Assigned Deliveries ({assignedOrders.length})</h2>

        {loading ? (
          <div className="rider-loading">
            <div className="rider-spinner"></div>
            <p>Loading assigned orders...</p>
          </div>
        ) : assignedOrders.length > 0 ? (
          <div className="rider-orders-grid">
            {assignedOrders.map((order) => {
              const isSimulating = !!activeSimulations[order._id];
              const isDelivered = order.status === "Delivered";

              return (
                <div
                  key={order._id}
                  className={`rider-order-card ${isSimulating ? "simulating" : ""} ${
                    isDelivered ? "delivered" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="card-header-row">
                    <span className="order-id-tag">
                      Order #{order._id.substring(order._id.length - 6).toUpperCase()}
                    </span>
                    <span className={`order-status-badge ${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Customer & Address Info */}
                  <div className="card-customer-info">
                    <h4>
                      👤 {order.address.firstName} {order.address.lastName}
                    </h4>
                    <p className="cust-phone">📞 {order.address.phone}</p>
                    <p className="cust-address">
                      📍 {order.address.street}, {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                  </div>

                  {/* Kitchen Instructions / Chef Notes */}
                  {order.notes && (
                    <div className="rider-notes-box">
                      <span className="notes-icon">🍳</span>
                      <div>
                        <strong>Kitchen & Delivery Note:</strong>
                        <p>"{order.notes}"</p>
                      </div>
                    </div>
                  )}

                  {/* Order Items Summary */}
                  <div className="rider-items-box">
                    <p className="items-title">Items to deliver:</p>
                    <ul>
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          <span className="qty">{item.quantity}x</span> {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Controls */}
                  <div className="rider-card-actions">
                    {/* Status Step 1: Mark Picked Up */}
                    <button
                      disabled={isDelivered}
                      onClick={() => handleUpdateStatus(order._id, "Out for delivery")}
                      className={`btn-rider-action pickup ${
                        order.status === "Out for delivery" ? "active" : ""
                      }`}
                    >
                      📦 Picked Up
                    </button>

                    {/* Live GPS Drive Simulation Toggle */}
                    <button
                      disabled={isDelivered}
                      onClick={() => toggleLiveSimulation(order)}
                      className={`btn-rider-action drive ${isSimulating ? "stop" : ""}`}
                    >
                      {isSimulating ? "🛑 Stop Drive Sim" : "🚀 Start Live Drive Sim"}
                    </button>

                    {/* Status Step 2: Mark Delivered */}
                    <button
                      disabled={isDelivered}
                      onClick={() => handleUpdateStatus(order._id, "Delivered")}
                      className="btn-rider-action deliver"
                    >
                      ✅ Delivered
                    </button>
                  </div>

                  {/* Simulation Status Live Bar */}
                  {isSimulating && (
                    <div className="live-sim-status-bar">
                      <span className="pulse-dot-red"></span>
                      <span>Broadcasting live GPS coordinates to customer map...</span>
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
            <p>
              Select a different rider profile above or assign new orders to <strong>{selectedRider}</strong> from the Admin Panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
