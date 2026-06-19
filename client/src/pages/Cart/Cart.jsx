import React, { useContext, useState } from 'react'
import "./Cart.css"
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import ScratchCard from '../../components/ScratchCard/ScratchCard'
const Cart = () => {

const{food_list,cartItems,removeFromCart,getTotalCartAmount,getDeliveryFee,getCartDiscount,getFinalCartTotal,applyCoupon,removeCoupon,appliedCoupon,couponMessage,url} = useContext(StoreContext)
const [couponInput,setCouponInput] = useState(appliedCoupon?.code || "")

const navigate = useNavigate();

const handleCouponSubmit = (event) => {
  event.preventDefault();
  applyCoupon(couponInput);
}

const handleRemoveCoupon = () => {
  removeCoupon();
  setCouponInput("");
}

const subtotal = getTotalCartAmount();
const discount = getCartDiscount();
const deliveryFee = getDeliveryFee();
const total = getFinalCartTotal();

  return (
    <div className='cart'>
      <div className="page-intro">
        <h1>Your cart</h1>
        <p>Review your dishes, apply a promo code, and move into checkout when the order feels right.</p>
      </div>
       <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item,index)=>{
if(cartItems[item._id] >0)
{
  return(
  <div key={index}>
    <div className='cart-items-title cart-items-item'>
    <img src={url+"/images/"+item.image} alt="" />
<p>{item.name}</p>
<p>${item.price}</p>
<p>{cartItems[item._id]}</p>
<p>${item.price*cartItems[item._id]}</p>
<p onClick={()=>removeFromCart(item._id)} className='cross'>x</p>
  </div>
  <hr />  
  </div>

)
}
        })}
      </div> 
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${subtotal}</p>
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
              <p>${deliveryFee}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${total.toFixed(2)}</b>
            </div>
            <hr />
          </div>
                      <button onClick={()=>navigate("/order")}>PROCEED TO CHECKOUT</button>

        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            <form className='cart-promocode-input' onSubmit={handleCouponSubmit}>
              <input type="text" placeholder='promo code ' value={couponInput} onChange={(event)=>setCouponInput(event.target.value)} />
              <button type="submit">Submit</button>
            </form>
            {couponMessage && <p className={`cart-promocode-message ${appliedCoupon ? "success" : "error"}`}>{couponMessage}</p>}
            {appliedCoupon && <button className='cart-promocode-remove' onClick={handleRemoveCoupon}>Remove promo code</button>}
            
            {!appliedCoupon && (
              <>
                <hr style={{ margin: "20px 0 16px", border: "0", borderTop: "1px dashed var(--border)" }} />
                <p style={{ fontSize: "14px", color: "var(--muted)", fontWeight: "600", marginBottom: "8px" }}>Don't have a code? Scratch to win a secret coupon! 🎁</p>
                <ScratchCard onReveal={(code) => {
                  setCouponInput(code);
                  applyCoupon(code);
                }} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
