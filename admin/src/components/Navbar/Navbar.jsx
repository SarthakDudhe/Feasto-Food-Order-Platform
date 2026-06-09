import React from 'react'
import "./Navbar.css"
import {assets} from "../../assets/assets"
const Navbar = () => {
  return (
    <div className='navbar'>
        <div className="navbar-brand">
          <img className='logo' src={assets.logo} alt="" />
          <div>
            <p className="navbar-title">Feasto Admin</p>
            <span className="navbar-subtitle">Restaurant control center</span>
          </div>
        </div>
        <div className="navbar-right">
          <span className="navbar-status">Live sync</span>
          <img className='profile' src={assets.profile_image} alt="" />
        </div>
    </div>
  )
}

export default Navbar
