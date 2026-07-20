import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import DeliveryMap from "../../components/DeliveryMap/DeliveryMap";
import "./TrackOrder.css";

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { url, token } = useContext(StoreContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [riderMessageSent, setRiderMessageSent] = useState(false);

  const handleSendMessage = () => {
    setRiderMessageSent(true);
    setTimeout(() => setRiderMessageSent(false), 3000);
  };

  // Status mapping to indices
  const getStatusIndex = (status) => {
    switch (status) {
      case "Delivered":
        return 3;
      case "Out for delivery":
        return 2;
      case "Food Processing":
        return 1;
      default:
        return 0; // Placed / Verified
    }
  };

  const fetchOrderDetails = async (showRefreshAnimation = false) => {
    if (showRefreshAnimation) {
      setIsRefreshing(true);
    }
    try {
      const response = await axios.post(
        `${url}/api/order/detail`,
        { orderId },
        { headers: { token } }
      );
      if (response.data.success) {
        setOrder(response.data.data);
        setError("");
      } else {
        setError(response.data.message || "Failed to fetch order details.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching tracking details.");
    } finally {
      setLoading(false);
      if (showRefreshAnimation) {
        setTimeout(() => setIsRefreshing(false), 800);
      }
    }
  };

  // Poll every 10 seconds for real-time simulation
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Please login to track your order.");
      return;
    }

    fetchOrderDetails();

    const interval = setInterval(() => {
      // Only poll if order is not delivered yet
      setOrder((prevOrder) => {
        if (prevOrder && prevOrder.status !== "Delivered") {
          fetchOrderDetails();
          setPollCount((c) => c + 1);
        }
        return prevOrder;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="track-loading-container">
        <div className="track-spinner"></div>
        <p>Connecting to kitchen trackers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="track-error-container">
        <div className="error-card">
          <h2>Tracking Unavailable</h2>
          <p>{error}</p>
          <Link to="/myorders" className="btn-back">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStatusIndex = getStatusIndex(order.status);

  const steps = [
    {
      title: "Order Placed",
      desc: "Kitchen has accepted your order",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Preparing",
      desc: "Chef is crafting your gourmet meal",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.32 11.32l.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: "On The Way",
      desc: "Courier is speeding to your door",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      title: "Delivered",
      desc: "Enjoy your fresh warm meal!",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="track-order-page">
      {order.status === "Delivered" && (
        <div className="confetti-container">
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
          <div className="confetti-piece"></div>
        </div>
      )}

      {/* Top Breadcrumb & Status Info */}
      <div className="page-intro">
        <span className="page-intro-eyebrow">Warm premium diner</span>
        <div className="intro-header-flex">
          <div>
            <h1>Order Tracker</h1>
            <p>Order ID: <span className="highlight-text">#{order._id}</span></p>
          </div>
          <div className="live-badge-wrapper">
            <span className={`live-badge ${order.status === "Delivered" ? "completed" : "pulsing"}`}>
              <span className="dot"></span>
              {order.status === "Delivered" ? "Delivered" : "Live Tracking Active"}
            </span>
            <button
              onClick={() => fetchOrderDetails(true)}
              className={`btn-refresh ${isRefreshing ? "spinning" : ""}`}
              disabled={isRefreshing}
              title="Refresh status"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      <div className="tracker-grid">
        {/* Left Side: Real Map and Timeline */}
        <div className="tracker-main-card">

          {/* 🗺️ Real MapLibre Delivery Map */}
          <DeliveryMap order={order} statusIndex={currentStatusIndex} />

          {/* Stepper Timeline */}
          <div className="stepper-timeline">
            {steps.map((step, idx) => {
              const isCompleted = currentStatusIndex >= idx;
              const isActive = currentStatusIndex === idx;

              return (
                <div key={idx} className={`step-item ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                  <div className="step-icon-container">
                    <div className="step-icon-circle">{step.icon}</div>
                    {idx < steps.length - 1 && <div className="step-connector-line"></div>}
                  </div>
                  <div className="step-text">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Side: Order Summary Card */}
        <div className="tracker-sidebar">
          <div className="receipt-paper">
            <div className="receipt-header">
              <h3>Order Receipt</h3>
              <p>Paid successfully via Stripe</p>
            </div>
            
            <div className="receipt-items">
              {order.items.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <div className="item-name-qty">
                    <span className="qty">{item.quantity}x</span>
                    <span className="name">{item.name}</span>
                  </div>
                  <span className="price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            <div className="receipt-totals">
              {order.coupon && (
                <div className="totals-row discount">
                  <span>Coupon ({order.coupon.code})</span>
                  <span>-${order.coupon.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="totals-row delivery">
                <span>Delivery Charge</span>
                <span>$2.00</span>
              </div>
              <div className="totals-row grand-total">
                <span>Grand Total</span>
                <span>${order.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-footer-pattern"></div>
          </div>

          {/* Delivery Address Details */}
          <div className="address-details-card">
            <h3>Delivery Address</h3>
            <div className="address-info-row">
              <span className="label">Customer</span>
              <span className="val">{order.address.firstName} {order.address.lastName}</span>
            </div>
            <div className="address-info-row">
              <span className="label">Street</span>
              <span className="val">{order.address.street}</span>
            </div>
            <div className="address-info-row">
              <span className="label">Location</span>
              <span className="val">{order.address.city}, {order.address.state} - {order.address.pincode}</span>
            </div>
            <div className="address-info-row">
              <span className="label">Contact</span>
              <span className="val">📞 {order.address.phone}</span>
            </div>
            {order.notes && (
              <div className="address-info-row kitchen-note-highlight">
                <span className="label">🍳 Kitchen Note</span>
                <span className="val note-text">"{order.notes}"</span>
              </div>
            )}
          </div>

          {/* Delivery Rider Details */}
          {order.riderName && (
            <div className={`rider-profile-card ${order.status === "Out for delivery" ? "glowing" : ""}`}>
              <h3>Delivery Partner</h3>
              <div className="rider-info">
                <div className="rider-avatar">
                  🚴
                </div>
                <div className="rider-details">
                  <h4>{order.riderName}</h4>
                  <p>Accredited Feasto Fleet Partner</p>
                </div>
              </div>
              <div className="rider-actions">
                <a
                  href={`https://wa.me/${order.riderPhone ? order.riderPhone.replace(/[^\d]/g, '') : '919876543210'}?text=${encodeURIComponent(
                    `Hi ${order.riderName}, I'm tracking my Feasto order #${order._id.slice(-6).toUpperCase()}. Could you please share an update on your ETA? 🛵`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rider-contact-btn whatsapp"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`sms:${order.riderPhone || '+919876543210'}?body=${encodeURIComponent(
                    `Hi ${order.riderName}, tracking Feasto order #${order._id.slice(-6).toUpperCase()} - any update?`
                  )}`}
                  className="rider-contact-btn sms"
                >
                  📱 SMS Text
                </a>
              </div>
            </div>
          )}

          <div className="sidebar-actions">
            <Link to="/myorders" className="btn-back-link">
              ← Return to My Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Custom self-contained toast notification */}
      {riderMessageSent && (
        <div className="rider-toast-notification">
          💬 Message sent to {order.riderName}!
        </div>
      )}
    </div>
  );
}
