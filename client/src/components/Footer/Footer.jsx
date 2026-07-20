import React from 'react'
import "./Footer.css" 
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.Feasto} alt="" />
          <p>Your trusted platform for fast, fresh, and reliable food delivery. Powered by passion, served with warmth and speed.</p>
          <div className="footer-social-icons">
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h2>Feasto</h2>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/rider">Rider Portal 🛵</Link></li>
            <li>About Us</li>
            <li>Privacy Policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>Get In Touch</h2>
          <ul>
            <li>+91-7045622572</li>
            <li>contact@feasto.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">© 2025 Feasto. All rights reserved.</p>
    </div>
  )
}

export default Footer
