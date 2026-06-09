import React from 'react'
import { assets } from '../../assets/assets'
import "./AppDownload.css"
const AppDownload = () => {
  return (
    <div className='app-download' id='app-download'>
        <p>For a smoother experience, download <br /> the Feasto app</p>
        <div className="app-download-plaforms">
            <img src={assets.play_store} alt="" />
            <img src={assets.app_store} alt="" />
        </div>
    </div>
  )
}

export default AppDownload
