import React, { useContext, useEffect, useState } from 'react'
import "./MyOrder.css"
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const MyOrder = () => {

    const {url,token}=useContext(StoreContext)
const[data,setData]=useState([]);
const navigate = useNavigate();

const fetchOrders = async () => {
    const response = await axios.post(url+"/api/order/userOrders",{},{headers:{token}})
    setData(response.data.data)
}

useEffect(()=>{
if (token) {
    fetchOrders();
}
},[token])

return (
  <div className="my-orders">
    <div className="page-intro">
      <span className="page-intro-eyebrow">Warm premium diner</span>
      <h1>My orders</h1>
      <p>Keep track of recent deliveries, order status, and what is already on the way.</p>
    </div>
    <div className="container">
      {data.map((order) => {
        const itemsText = order.items
          .map((item) => `${item.name} x ${item.quantity}`)
          .join(", ");

        return (
          <div key={order.id || order._id || order.amount} className="my-orders-order">
            <img src={assets.parcel_icon} alt="Parcel icon" />

            <p>{itemsText}</p>
            <p>${order.amount.toFixed(2)}</p>
            <p>Items: {order.items.length}</p>

            {/* bullet point using Unicode */}
            <p>
             <span className='dot'>&#x25CF;</span>  <b>{order.status}</b>
            </p>

            <button onClick={() => navigate(`/track-order/${order._id}`)}>Track Order</button>
          </div>
        );
      })}
    </div>
  </div>
);
}

export default MyOrder
