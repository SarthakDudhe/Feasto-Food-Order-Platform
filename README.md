# 🍽️ Feasto – Modern Full-Stack Food Delivery & Management Platform

[![MERN Stack](https://img.shields.io/badge/MERN-Stack-blue.svg)](https://www.mongodb.com/mern-stack)
[![Stripe Integration](https://img.shields.io/badge/Payments-Stripe-6772e5.svg)](https://stripe.com/)
[![AI Powered](https://img.shields.io/badge/AI-Gemini-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Vite](https://img.shields.io/badge/Frontend-Vite-646CFF.svg)](https://vitejs.dev/)

**Feasto** is a high-performance, full-stack food delivery ecosystem designed to bridge the gap between customers and administrative management. Built with the **MERN stack**, it features a secure checkout flow via **Stripe**, real-time order tracking, and an **AI-driven food recommendation engine** powered by Google Gemini.

🚀 **Live Project:** [feasto-delta.vercel.app](https://feasto-delta.vercel.app/)

---

## 🌟 Key Features

### 🛒 Customer Experience
- **Intuitive Menu Browsing:** Seamless navigation through categorized food items with dynamic filtering.
- **Persistent Cart Logic:** Real-time cart updates with automatic subtotal and delivery fee calculations.
- **Secure Stripe Checkout:** Integrated payment gateway for encrypted, PCI-compliant transactions.
- **AI Recipe Generator:** Leverage Google Gemini to discover recipes and food insights directly within the app.
- **Order Tracking:** Monitor the status of orders from "Food Processing" to "Delivered".

### 🛡️ Administrative Control
- **Inventory Management:** Full CRUD capabilities for food items, including multi-part form data handling (image uploads via Multer).
- **Order Orchestration:** A centralized dashboard to manage customer orders and update delivery statuses.
- **Secure Admin Access:** Protected routes ensuring only authorized personnel can access the management panel.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Vanilla CSS, Axios, React Router 7 |
| **Backend** | Node.js, Express.js (MVC Architecture) |
| **Database** | MongoDB, Mongoose ODM |
| **AI / ML** | Google Gemini (Generative AI) |
| **Payments** | Stripe API |
| **Authentication** | JWT (JSON Web Tokens), Bcrypt.js |
| **DevOps/Tools** | Multer (File Storage), Validator.js, Nodemon, Git |

---

## 🏗️ System Overview & Architecture

Feasto follows a modern **decoupled architecture**, separating the user-facing storefront, the administrative dashboard, and the centralized API server.

### 🔄 Data Flow
1. **Frontend (Client/Admin):** Built with **React 19** for a fast, reactive UI. Uses **Axios** for asynchronous communication with the backend.
2. **Backend (Server):** An **Express.js** REST API implementing the **MVC (Model-View-Controller)** pattern for clean separation of concerns.
3. **Database (MongoDB):** Stores user data, food inventory, and order history using **Mongoose** for schema validation.
4. **Security Layer:** Implements **JWT-based stateless authentication** and **CORS** policies for secure cross-origin resource sharing.

---

## 🔑 Key Functionalities

### 1. **AI-Driven Personalization**
The platform integrates the `@google/genai` SDK to provide intelligent food insights. By analyzing user input, the system generates recipes and recommendations, adding a modern AI layer to the traditional food delivery model.

### 2. **Transactional Integrity**
Using **Stripe's Payment Intent API**, the application ensures that payments are authorized and captured securely. The backend validates the order details before finalizing the transaction to prevent data tampering.

### 3. **Scalable Image Storage**
Utilizing **Multer middleware**, the server handles multipart/form-data for food image uploads, storing them locally and serving them via static Express routes for high availability.

---

## 🖼️ Project Screenshots

<p align="center">
  <img width="1898" height="867" alt="Home Page" src="https://github.com/user-attachments/assets/6f9fe488-83c1-4eee-a5e2-f82aec5ac569" />
  <br/><br/>
  <img width="1895" height="868" alt="Menu Section" src="https://github.com/user-attachments/assets/40ba4b9b-e991-4e7a-84dc-8ed0e7d2b763" />
  <br/><br/>
  <img width="1899" height="870" alt="Cart View" src="https://github.com/user-attachments/assets/1bc763f5-2e4e-4aee-b4c4-992e5f9dfd0a" />
  <br/><br/>
  <img width="1901" height="873" alt="Admin Dashboard" src="https://github.com/user-attachments/assets/d83dd4b3-4984-4dca-92d2-19269318d1db" />
</p>

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB
- Stripe API Keys
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/SarthakDudhe/Feasto-Food-Delivery-Platform.git
cd Feasto-Food-Delivery-Platform
```

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_string
STRIPE_SECRET_KEY=your_stripe_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Install Dependencies & Start
**Server:**
```bash
cd server
npm install
npm run server
```

**Client (Frontend):**
```bash
cd client
npm install
npm run dev
```

**Admin Panel:**
```bash
cd admin
npm install
npm run dev
```

---

## 🚀 Future Enhancements
- [ ] **Real-Time Map Integration:** Live delivery tracking using Google Maps API.
- [ ] **Social Authentication:** One-click login with Google/GitHub.
- [ ] **Advanced Analytics:** Sales charts and user behavior tracking for admins.
- [ ] **Push Notifications:** Alerting users on order status changes.

---

## 👨‍💻 Author
**Sarthak Dudhe**  
*Full Stack Developer | AI Enthusiast*  
[GitHub](https://github.com/SarthakDudhe) | [LinkedIn](https://www.linkedin.com/in/sarthak-dudhe/)

---
⭐ **Star this repository if you found it helpful!**
