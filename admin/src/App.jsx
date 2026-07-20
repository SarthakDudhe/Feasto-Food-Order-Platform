import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Route, Routes } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Order from './pages/Orders/Order'
import Dashboard from './pages/Dashboard/Dashboard'
import Rider from './pages/Rider/Rider'
import ManageRiders from './pages/ManageRiders/ManageRiders'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
 
  const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"

  return (
    <>
    <ToastContainer position='top-right'/>
 <div className="admin-shell">
  <Navbar/>
  <hr />
  <div className="app-content">
    <Sidebar/>
   
      <Routes>
        <Route path='/' element={<Dashboard url={url}/>}  />
        <Route path='/dashboard' element={<Dashboard url={url}/>}  />
        <Route path='/add' element={<Add url={url}/>}  />
        <Route path='/list' element={<List url={url}/>}  />
        <Route path='/orders' element={<Order url={url}/>} />
        <Route path='/rider' element={<Rider url={url}/>} />
        <Route path='/manage-riders' element={<ManageRiders url={url}/>} />
      </Routes>

  </div>
 </div>

    </>
  )
}

export default App
