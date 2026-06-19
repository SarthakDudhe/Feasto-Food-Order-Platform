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

  const riders = [
    "John Doe (Scooter)",
    "Jane Smith (E-Bike)",
    "Bob Johnson (Van)",
    "Alice Williams (Walk)"
  ]

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
    const response = await axios.post(url + "/api/order/assign", {
      orderId,
      riderName
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

      {/* Orders List */}
      <div className="order-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order._id} className="order-item">
              <img src={assets.parcel_icon} alt="parcel" />

              <div>
                <p className="order-item-food">
                  {order.items
                    .map(item => `${item.name} x ${item.quantity}`)
                    .join(", ")}
                </p>

                <p className="order-item-name">
                  {order.address.firstName} {order.address.lastName}
                </p>

                <div className="order-item-address">
                  <p>{order.address.street},</p>
                  <p>
                    {order.address.city}, {order.address.state}, {order.address.country} - {order.address.pincode}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.country} - ${order.address.pincode}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-map-link"
                  >
                    📍 View Map
                  </a>
                </div>

                <p className="order-item-phone">
                  📞 {order.address.phone}
                </p>
              </div>

              <p><b>Items:</b> {order.items.length}</p>
              <p><b>Amount:</b> ${order.amount}</p>

              <div className="order-item-actions">
                <select onChange={(event) => statusHandler(event, order._id)} value={order.status}>
                  <option value="Food Processing">Food Processing</option>
                  <option value="Out for delivery">Out for delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>

                <select
                  onChange={(event) => assignRiderHandler(order._id, event.target.value)}
                  value={order.riderName || ""}
                  className="rider-select"
                >
                  <option value="">Assign Rider</option>
                  {riders.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <button onClick={() => handlePrintKOT(order)} className="print-kot-btn">
                  Print KOT 🖨️
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-orders-fallback">
            <span className="fallback-emoji">📭</span>
            <h3>No orders found</h3>
            <p>We couldn't find any orders matching your search or filters.</p>
          </div>
        )}
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
