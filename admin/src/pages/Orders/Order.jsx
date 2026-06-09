import React, { useEffect, useState } from 'react'
import axios from "axios"
import "./Order.css"
import { toast } from "react-toastify"
import { assets } from "../../assets/assets"

const Order = ({url}) => {
  const [orders, setOrders] = useState([])

  const fetchAllOrders = async () => {
    const response = await axios.get(url + "/api/order/list")
    if (response.data.success) {
      setOrders(response.data.data)
    }
    else {
      toast.error("Error")
    }
  }

  const statusHandler = async (event, orderId) => {
    const response = await axios.post(url + "/api/order/status", {
      orderId,
      status: event.target.value
    })

    if (response.data.success) {
      await fetchAllOrders()
    }
  }

  useEffect(() => {
    fetchAllOrders()
  }, [])

  return (
    <div className="order add">
      <div className="page-intro">
        <span className="page-intro-eyebrow">Order management</span>
        <h1>Incoming orders</h1>
        <p>Track delivery details, customer information, item counts, and current order status in one place.</p>
      </div>

      <div className="order-list">
        {orders.map((order) => (
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
              </div>

              <p className="order-item-phone">
                📞 {order.address.phone}
              </p>
            </div>

            <p><b>Items:</b> {order.items.length}</p>
            <p><b>Amount:</b> ${order.amount}</p>

            <select onChange={(event) => statusHandler(event, order._id)} value={order.status}>
              <option value="Food Processing">Food Processing</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Order
