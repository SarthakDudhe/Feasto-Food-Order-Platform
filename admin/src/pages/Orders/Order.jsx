import React, { useEffect, useState } from 'react'
import axios from "axios"
import "./Order.css"
import { toast } from "react-toastify"
import { assets } from "../../assets/assets"

const Order = ({url}) => {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sortOption, setSortOption] = useState("newest")
  const [activePrintOrder, setActivePrintOrder] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [viewMode, setViewMode] = useState("list")
  const [checkedItems, setCheckedItems] = useState({})

  // Rider registry — name → { phone, lat, lng (home/depot location) }
  // Update these with your real fleet details
  const riderRegistry = {
    "John Doe (Scooter)":    { phone: "+919876543210", lat: 19.0760, lng: 72.8777 },
    "Jane Smith (E-Bike)":   { phone: "+919876543211", lat: 19.0820, lng: 72.8820 },
    "Bob Johnson (Van)":     { phone: "+919876543212", lat: 19.0700, lng: 72.8750 },
    "Alice Williams (Walk)": { phone: "+919876543213", lat: 19.0790, lng: 72.8800 },
  };

  const riderNames = Object.keys(riderRegistry);

  const fetchAllOrders = async () => {
    const response = await axios.get(url + "/api/order/list")
    if (response.data.success) {
      setOrders(response.data.data)
    }
    else {
      toast.error("Error fetching orders")
    }
  }

  const statusHandler = async (event, orderId) => {
    const response = await axios.post(url + "/api/order/status", {
      orderId,
      status: event.target.value
    })

    if (response.data.success) {
      toast.success("Order status updated")
      await fetchAllOrders()
    } else {
      toast.error("Failed to update status")
    }
  }

  const assignRiderHandler = async (orderId, riderName) => {
    const riderInfo = riderRegistry[riderName] || {};
    const response = await axios.post(url + "/api/order/assign", {
      orderId,
      riderName,
      riderPhone: riderInfo.phone || "",
      riderLat:   riderInfo.lat   ?? undefined,
      riderLng:   riderInfo.lng   ?? undefined,
    })
    if (response.data.success) {
      toast.success("Rider assigned successfully")
      await fetchAllOrders()
    } else {
      toast.error("Failed to assign rider")
    }
  }

  const handlePrintKOT = (order) => {
    setActivePrintOrder(order)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const toggleItemCheck = (orderId, idx) => {
    const key = `${orderId}_${idx}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  useEffect(() => {
    fetchAllOrders()

    const handleAfterPrint = () => {
      setActivePrintOrder(null)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  // Filter and Sort in memory
  const filteredOrders = orders
    .filter((order) => {
      // 1. Status Filter
      if (statusFilter !== "All" && order.status !== statusFilter) {
        return false;
      }
      // 2. Search term Filter (Matches customer name, order id, phone)
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const name = `${order.address.firstName} ${order.address.lastName}`.toLowerCase();
        const orderId = order._id.toLowerCase();
        const phone = order.address.phone ? order.address.phone.toLowerCase() : "";
        return name.includes(query) || orderId.includes(query) || phone.includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.date || 0) - new Date(a.date || 0);
      }
      if (sortOption === "oldest") {
        return new Date(a.date || 0) - new Date(b.date || 0);
      }
      if (sortOption === "highest") {
        return b.amount - a.amount;
      }
      return 0;
    });

  // Sync selection when filters or items change
  useEffect(() => {
    if (filteredOrders.length > 0) {
      const exists = filteredOrders.some(o => o._id === selectedOrderId);
      if (!exists) {
        setSelectedOrderId(filteredOrders[0]._id);
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [orders, statusFilter, searchTerm, sortOption]);

  const selectedOrder = orders.find(o => o._id === selectedOrderId);

  const getStatusCount = (status) => {
    if (status === "All") return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const statuses = ["All", "Food Processing", "Out for delivery", "Delivered"];

  return (
    <div className="order add">
      <div className="page-intro">
        <span className="page-intro-eyebrow">Order management</span>
        <h1>Incoming orders</h1>
        <p>Track delivery details, customer information, item counts, and current order status in one place.</p>
      </div>

      {/* Control Toolbar */}
      <div className="order-control-bar">
        {/* Search */}
        <div className="search-box-wrapper">
          <span className="search-icon-decor">🔍</span>
          <input
            type="text"
            placeholder="Search name, phone, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="order-search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="clear-search-btn">×</button>
          )}
        </div>

        {/* Sort */}
        <div className="sort-box-wrapper">
          <label>Sort By:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="order-sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs-container">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`status-tab ${statusFilter === s ? "active" : ""}`}
          >
            {s} <span className="tab-count">{getStatusCount(s)}</span>
          </button>
        ))}
      </div>

      {/* Split Pane Workspace Layout */}
      <div className="orders-split-container">
        {/* Left Side: Orders Scrollable List */}
        <div className={`orders-sidebar-list ${viewMode === "inspector" ? "mobile-hidden" : ""}`}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const isSelected = order._id === selectedOrderId;
              return (
                <div
                  key={order._id}
                  onClick={() => {
                    setSelectedOrderId(order._id);
                    setViewMode("inspector");
                  }}
                  className={`orders-sidebar-card ${isSelected ? "selected" : ""}`}
                >
                  <div className="card-top-row">
                    <span className="card-order-id">#{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                    <span className={`status-badge-inline ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="card-middle-row">
                    <h4 className="card-cust-name">{order.address.firstName} {order.address.lastName}</h4>
                    <p className="card-item-count">{order.items.length} {order.items.length === 1 ? 'item' : 'items'}</p>
                  </div>
                  <div className="card-bottom-row">
                    <span className="card-amount">${order.amount}</span>
                    <span className="card-date">
                      {order.date ? new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-orders-fallback-sidebar">
              <span className="fallback-emoji">📭</span>
              <p>No matching orders</p>
            </div>
          )}
        </div>

        {/* Right Side: Order Detail Inspector */}
        <div className={`orders-main-inspector ${viewMode === "list" ? "mobile-hidden" : ""}`}>
          {selectedOrder ? (
            <div className="inspector-content">
              {/* Mobile Back Button */}
              <button className="back-to-list-btn" onClick={() => setViewMode("list")}>
                ← Back to Order List
              </button>

              {/* Inspector Header */}
              <div className="inspector-header">
                <div className="inspector-title-row">
                  <div>
                    <h2>Order Details</h2>
                    <p className="inspector-id">ID: <span className="highlight-text">#{selectedOrder._id}</span></p>
                  </div>
                  <div className="inspector-date-amount">
                    <div className="inspector-amount">${selectedOrder.amount}</div>
                    <div className="inspector-date">
                      {selectedOrder.date ? new Date(selectedOrder.date).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              {/* Grid split for customer details and checklist */}
              <div className="inspector-body-grid">
                
                {/* Customer Details Block */}
                <div className="inspector-block customer-card-block">
                  <h3>Customer & Delivery Profile</h3>
                  <div className="detail-field">
                    <span className="field-label">Name:</span>
                    <span className="field-value">{selectedOrder.address.firstName} {selectedOrder.address.lastName}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Phone:</span>
                    <span className="field-value">📞 {selectedOrder.address.phone}</span>
                  </div>
                  <div className="detail-field">
                    <span className="field-label">Address:</span>
                    <span className="field-value">
                      {selectedOrder.address.street}, {selectedOrder.address.city}, {selectedOrder.address.state}, {selectedOrder.address.country} - {selectedOrder.address.pincode}
                    </span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="detail-field kitchen-notes-highlight">
                      <span className="field-label">🍳 Chef Notes:</span>
                      <span className="field-value kitchen-notes-text">"{selectedOrder.notes}"</span>
                    </div>
                  )}
                  <div className="detail-field-action">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${selectedOrder.address.street}, ${selectedOrder.address.city}, ${selectedOrder.address.state}, ${selectedOrder.address.country} - ${selectedOrder.address.pincode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-map-link"
                    >
                      📍 Open Navigation Route
                    </a>
                  </div>
                </div>

                {/* Operations Control Actions block */}
                <div className="inspector-block operations-block">
                  <h3>Operational Status Controls</h3>
                  <div className="control-selectors">
                    <div className="selector-group">
                      <label>Preparation Status</label>
                      <select onChange={(event) => statusHandler(event, selectedOrder._id)} value={selectedOrder.status}>
                        <option value="Food Processing">Food Processing</option>
                        <option value="Out for delivery">Out for delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div className="selector-group">
                      <label>Courier Rider</label>
                      <select
                        onChange={(event) => assignRiderHandler(selectedOrder._id, event.target.value)}
                        value={selectedOrder.riderName || ""}
                        className="rider-select"
                      >
                        <option value="">Assign Rider</option>
                        {riderNames.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button onClick={() => handlePrintKOT(selectedOrder)} className="print-kot-btn">
                    Print KOT (Kitchen Receipt) 🖨️
                  </button>
                </div>
              </div>

              <hr />

              {/* Chef Packing Checklist */}
              <div className="inspector-checklist-section">
                <div className="checklist-header">
                  <h3>Packer & Kitchen Checklist</h3>
                  <p>Check off dishes as they are prepared and placed in the delivery packet.</p>
                </div>

                <div className="checklist-items-grid">
                  {selectedOrder.items.map((item, idx) => {
                    const isChecked = !!checkedItems[`${selectedOrder._id}_${idx}`];
                    return (
                      <label key={idx} className={`checklist-item-wrapper ${isChecked ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItemCheck(selectedOrder._id, idx)}
                          className="checklist-checkbox-input"
                        />
                        <div className="custom-checkbox-face">
                          {isChecked && <span className="checkmark-icon">✓</span>}
                        </div>
                        <div className="checklist-item-text">
                          <span className="item-qty-badge">{item.quantity}x</span>
                          <span className="item-dish-name">{item.name}</span>
                          <span className="item-dish-category">({item.category || 'Menu Item'})</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="no-order-selected-fallback">
              <span className="fallback-emoji">📋</span>
              <h3>No Order Selected</h3>
              <p>Select an incoming order from the left list to review delivery addresses, assign riders, check off items, or print receipt tickets.</p>
            </div>
          )}
        </div>
      </div>

      {/* KOT Print Receipt Template (hidden on screen, visible only during printing) */}
      {activePrintOrder && (
        <div className="kot-print-receipt">
          <div className="kot-header">
            <h2>KITCHEN ORDER TICKET (KOT)</h2>
            <p className="kot-order-id">Order ID: {activePrintOrder._id}</p>
            <p className="kot-date">Date: {activePrintOrder.date ? new Date(activePrintOrder.date).toLocaleString() : new Date().toLocaleString()}</p>
          </div>
          <hr />
          <div className="kot-customer">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> {activePrintOrder.address.firstName} {activePrintOrder.address.lastName}</p>
            <p><strong>Phone:</strong> {activePrintOrder.address.phone}</p>
            <p><strong>Address:</strong> {activePrintOrder.address.street}, {activePrintOrder.address.city}, {activePrintOrder.address.state}, {activePrintOrder.address.country} - {activePrintOrder.address.pincode}</p>
          </div>
          <hr />
          <div className="kot-items">
            <h3>Items Ordered</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {activePrintOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activePrintOrder.notes && (
            <>
              <hr />
              <div className="kot-notes">
                <p><strong>⚠️ KITCHEN INSTRUCTIONS / CHEF NOTES:</strong></p>
                <p className="kot-notes-text">"{activePrintOrder.notes}"</p>
              </div>
            </>
          )}
          {activePrintOrder.riderName && (
            <>
              <hr />
              <div className="kot-rider">
                <p><strong>Assigned Rider:</strong> {activePrintOrder.riderName}</p>
              </div>
            </>
          )}
          <hr />
          <div className="kot-footer">
            <p>Feasto Kitchen Management System</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order
