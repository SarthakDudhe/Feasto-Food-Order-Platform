import React from 'react'
import "./Header.css"
import { assets } from '../../assets/assets'
const Header = () => {
  return (
    <div className='header'>
            {/* Background Video */}
        <video className="bg-video" autoPlay loop muted playsInline>
          <source src={assets.dishes2} type="video/mp4" />
        </video>
        <div className="header-overlay"></div>
        <div className="header-contents">
            <span className="header-eyebrow">Warm premium diner</span>
            <h2>Order your favourite food here</h2>
            <p>Choose from a diverse menu featuring a delectable array of dishes crafted with the finest ingredients and culinary expertise. Our mission is to satisfy your cravings and elevate your dining experience, one delicious meal at a time.</p>
            <div className="header-actions">
              <button>View Menu</button>
              <div className="header-pills" aria-label="Highlights">
                <span>Freshly made</span>
                <span>Fast checkout</span>
                <span>Promo ready</span>
              </div>
            </div>
        </div>
    </div>
  )
}

export default Header
