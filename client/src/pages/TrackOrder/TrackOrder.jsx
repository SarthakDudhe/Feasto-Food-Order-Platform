import React, { useContext, useEffect, useState, useRef } from "react";
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

  // In-app interactive rider chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "rider",
      text: "Hi! I'm carrying your Feasto order. Let me know if you have any delivery instructions!",
      time: "Just now"
    }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isRiderTyping, setIsRiderTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (showChatModal) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isRiderTyping, showChatModal]);

  const sendChatMessage = (textToSend) => {
    const msgText = textToSend || inputMsg;
    if (!msgText || !msgText.trim()) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: "user", text: msgText.trim(), time: now }]);
    setInputMsg("");

    // Simulate rider typing & response
    setIsRiderTyping(true);
    setTimeout(() => {
      setIsRiderTyping(false);
      let replyText = "Got it! I will follow your instructions 👍";
      const lower = msgText.toLowerCase();
      if (lower.includes("eta") || lower.includes("far") || lower.includes("when")) {
        replyText = "I'm on my way! Should arrive in about 5 to 10 minutes 🛵";
      } else if (lower.includes("door") || lower.includes("leave")) {
        replyText = "Sure thing, I'll place the food packet right at your doorstep!";
      } else if (lower.includes("ring") || lower.includes("bell")) {
        replyText = "Noted! I'll give a quick ring when I'm outside.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "rider",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
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
        <p>Fetching real-time order tracking...</p>
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
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      title: "Delivered",
      desc: "Enjoy your delicious Feasto meal!",
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="track-order-page">

      {/* Header Banner */}
      <div className="tracker-banner">
        <div className="banner-left">
          <span className="live-badge">
            <span className="pulse-dot"></span> LIVE TRACKING
          </span>
          <h1>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</h1>
          <p className="order-time-stamp">
            Placed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="banner-right">
          <button
            className={`btn-refresh ${isRefreshing ? "spin" : ""}`}
            onClick={() => fetchOrderDetails(true)}
            title="Refresh Order Status"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            <span>Refresh</span>
          </button>
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
              <p>Paid successfully</p>
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
                <button
                  onClick={() => setShowChatModal(true)}
                  className="rider-contact-btn inapp-chat"
                >
                  💬 Chat with Rider
                </button>
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

      {/* 💬 In-App Interactive Rider Chat Drawer / Modal */}
      {showChatModal && (
        <div className="inapp-chat-overlay" onClick={() => setShowChatModal(false)}>
          <div className="inapp-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inapp-chat-header">
              <div className="rider-chat-header-info">
                <div className="rider-avatar-small">🛵</div>
                <div>
                  <h4>{order.riderName || "Delivery Partner"}</h4>
                  <span className="rider-status-online">🟢 Active in transit</span>
                </div>
              </div>
              <button className="chat-close-btn" onClick={() => setShowChatModal(false)}>✕</button>
            </div>

            <div className="inapp-chat-body">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble-row ${msg.sender}`}>
                  <div className="chat-bubble">
                    <p>{msg.text}</p>
                    <span className="chat-time">{msg.time}</span>
                  </div>
                </div>
              ))}
              {isRiderTyping && (
                <div className="chat-bubble-row rider">
                  <div className="chat-bubble typing-bubble">
                    <span className="typing-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                    <span className="typing-text">Rider is typing</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick action preset chips */}
            <div className="chat-preset-chips">
              <button onClick={() => sendChatMessage("Please leave the food packet at door 🚪")}>
                🚪 Leave at door
              </button>
              <button onClick={() => sendChatMessage("What is your current ETA? ⏱️")}>
                ⏱️ Check ETA
              </button>
              <button onClick={() => sendChatMessage("Ring bell upon arrival 🔔")}>
                🔔 Ring bell
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="inapp-chat-footer">
              <input
                type="text"
                placeholder="Type delivery note or message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button type="submit" disabled={!inputMsg.trim()}>Send</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
