import React from 'react'
import "./Sidebar.css"
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'
const Sidebar = () => {
  return (
    <div className='sidebar'>
<div className="sidebar-options">
    <NavLink to="/" className="sidebar-option">
        <span style={{ fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", width: "24px" }}>📊</span>
        <p>Dashboard</p>
    </NavLink>
    <NavLink to={"/add"} className="sidebar-option">
        <img src={assets.add_icon} alt="" />
        <p>Add Item</p>
    </NavLink>
      <NavLink to="/list" className="sidebar-option">
        <img src={assets.order_icon} alt="" />
        <p>Menu List</p>
    </NavLink>
      <NavLink to="/order" className="sidebar-option">
        <img src={assets.parcel_icon} alt="" />
        <p>Orders</p>
    </NavLink>
        <NavLink to="/rider" className="sidebar-option">
          <img src={assets.bag_icon} alt="" />
          <p>Rider Portal</p>
        </NavLink>
        <NavLink to="/manage-riders" className="sidebar-option">
          <img src={assets.order_icon} alt="" />
          <p>Manage Riders</p>
        </NavLink>
</div>
    </div>
  )
}

export default Sidebar
