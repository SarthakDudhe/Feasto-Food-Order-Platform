import { useEffect, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home/Home'
import Cart from './pages/Cart/Cart'
import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
import Footer from './components/Footer/Footer'
import LoginPopup from './components/LoginPopup/LoginPopup'
import Verify from './pages/Verify/Verify'
import MyOrder from './pages/MyOrder/MyOrder'



function App() {

const [showLogin,setShowLogin] = useState(false)

useEffect(() => {
  document.body.classList.toggle('login-modal-open', showLogin)

  return () => {
    document.body.classList.remove('login-modal-open')
  }
}, [showLogin])

  return (
<>
    {showLogin ? <LoginPopup setShowLogin={setShowLogin}/> : <></>}
<div className='app'>
  <Navbar setShowLogin={setShowLogin}/>
  <Routes>
    <Route path='/' element={<Home/>}/>
    <Route path='/cart' element={<Cart/>}/>
    <Route path='/order' element={<PlaceOrder/>}/>
    <Route path='/verify' element={<Verify/>}/>
    <Route path='/myorders' element={<MyOrder/>}/>
    {/* <Route path='/foodmate' element={<Foodbot/>}/> */}

  </Routes>
</div> 
<Footer/>
    
</>

  )
}

export default App
