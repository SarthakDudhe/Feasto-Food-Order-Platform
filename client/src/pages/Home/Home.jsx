import React, { useState } from 'react'
import "./Home.css"
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import Foodbot from '../Foodbot/Foodbot'
import { Link } from 'react-router-dom'
const Home = () => {
      const [category,setCategory] = useState("All")
      const promoCodes = [
        { code: "WELCOME20", detail: "20% off up to $8" },
        { code: "FEASTO10", detail: "10% off up to $6" },
        { code: "SAVE5", detail: "$5 off orders $25+" },
        { code: "TASTE15", detail: "15% off lunch favorites" },
      ]
  return (
  
    <div>
        <section className="promo-banner">
          <div className="promo-banner-copy">
            <span className="promo-banner-eyebrow">Limited-time offers</span>
            <h3>Save with promo codes at checkout</h3>
            <p>Use these codes on your next order for instant savings. The discount appears automatically in your cart and checkout totals.</p>
          </div>
          <div className="promo-banner-carousel" aria-label="Available promo codes">
            <div className="promo-banner-viewport">
              <div className="promo-banner-track">
                {[0, 1].map((setIndex) => (
                  <div className="promo-banner-set" key={setIndex} aria-hidden={setIndex === 1}>
                    {promoCodes.map((promo) => (
                      <div className="promo-code-chip" key={`${setIndex}-${promo.code}`}>
                        <span className="promo-code-label">{promo.code}</span>
                        <small>{promo.detail}</small>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <Link to="/cart" className="promo-banner-cta">Try it in cart</Link>
          </div>
        </section>
        <Header/>
        <ExploreMenu category={category} setCategory={setCategory}/>
        <FoodDisplay category={category}/>
        <AppDownload/>

        <Foodbot/>
    </div>
  )
}

export default Home
