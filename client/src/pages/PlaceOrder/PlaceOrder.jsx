import React, { useContext, useEffect, useState } from 'react'
import "./PlaceOrder.css"
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    getDeliveryFee,
    getCartDiscount,
    getFinalCartTotal,
    appliedCoupon,
    token,
    food_list,
    cartItems,
    url
  } = useContext(StoreContext)

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
    phone: "",
    notes: ""
  })

  const onchangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const placeOrder = async (event) => {
    event.preventDefault()
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item };
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo)
      }
    })

    let orderData = {
      address: data,
      items: orderItems,
      amount: getFinalCartTotal(),
      couponCode: appliedCoupon?.code || "",
      notes: data.notes || ""
    }

    try {
      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } })
      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url)
      } else {
        alert(response.data.message || "Error placing order")
      }
    } catch (err) {
      console.error("Order placement error:", err)
      alert("Error processing your order. Please try again.")
    }
  }

  const navigate = useNavigate()
  const subtotal = getTotalCartAmount();
  const discount = getCartDiscount();
  const deliveryFee = getDeliveryFee();
  const total = getFinalCartTotal();

  useEffect(() => {
    if (!token) {
      navigate("/cart")
    } else if (subtotal === 0) {
      navigate("/cart")
    }
  }, [token, subtotal, navigate])

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="page-intro place-order-intro">
        <span className="page-intro-eyebrow">Warm premium diner</span>
        <h1>Checkout details</h1>
        <p>Fill in the delivery information, add kitchen instructions, and confirm your total.</p>
      </div>

      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input name='firstName' onChange={onchangeHandler} value={data.firstName} type="text" placeholder='First Name' required />
          <input name='lastName' onChange={onchangeHandler} value={data.lastName} type="text" placeholder='Last Name' required />
        </div>
        <input name='email' onChange={onchangeHandler} value={data.email} type="text" placeholder='Email address' required />
        <input name='street' onChange={onchangeHandler} value={data.street} type="text" placeholder='Street' required />
        <div className="multi-fields">
          <input onChange={onchangeHandler} name='city' value={data.city} type="text" placeholder='City' required />
          <input onChange={onchangeHandler} name='state' value={data.state} type="text" placeholder='State' required />
        </div>
        <div className="multi-fields">
          <input onChange={onchangeHandler} name='pincode' value={data.pincode} type="text" placeholder='PIN CODE' required />
          <input onChange={onchangeHandler} name='country' value={data.country} type="text" placeholder='Country' required />
        </div>
        <input type="text" name='phone' onChange={onchangeHandler} value={data.phone} placeholder='Phone' required />

        {/* 🍳 Cooking Instructions / Kitchen Notes */}
        <div className="kitchen-instructions-wrapper">
          <label className="kitchen-instructions-title">
            🍳 Cooking Instructions & Add-ons <span className="optional-tag">(Optional)</span>
          </label>
          <p className="kitchen-instructions-sub">
            Add notes for the chef (e.g., "Less spicy", "No onions/mushrooms", "Extra ketchup", "Allergies")
          </p>
          <textarea
            name="notes"
            onChange={onchangeHandler}
            value={data.notes}
            placeholder="Write your custom requests here..."
            rows="3"
            className="kitchen-notes-input"
          />
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${subtotal.toFixed(2)}</p>
            </div>
            <hr />
            {discount > 0 && (
              <>
                <div className="cart-total-details cart-total-discount">
                  <p>Discount ({appliedCoupon.code})</p>
                  <p>-${discount.toFixed(2)}</p>
                </div>
                <hr />
              </>
            )}
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${deliveryFee.toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${total.toFixed(2)}</b>
            </div>
            <hr />
          </div>
          <button type='submit'>PROCEED TO PAYMENT</button>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
