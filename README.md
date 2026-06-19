# 🍳 Feasto: Premium Food Delivery Platform & Operations Dashboard

<div align="center">

<!-- Animated Banner Placeholder -->
[![Feasto Banner](https://github.com/user-attachments/assets/28a43d7f-89b0-472e-8037-0c32e4ea9435)](https://github.com/SarthakDudhe/Feasto-Food-Delivery-Platform)

<br />

<!-- Logo & Subtitle -->
<img width="100" alt="Feasto Logo" src="https://github.com/user-attachments/assets/7d579b8e-5da1-48b6-ba26-1b493e018ee4" />

<h3>Warm premium diner operations, AI recipe companion, and real-time logistics tracking in a robust full-stack monorepo.</h3>

<p>
  <strong>A Recruiter-Focused Production Showcase</strong><br />
  Featuring React 19, Express 5, MongoDB, Stripe Checkout, HTML5 Canvas, SVG Custom Charts, and Google Gemini AI.
</p>

<!-- Badge Grid -->
<p>
  <a href="https://github.com/SarthakDudhe/Feasto-Food-Delivery-Platform/actions"><img src="https://img.shields.io/badge/Build-Passing-10b981?style=for-the-badge&logo=github-actions&logoColor=white" alt="Build Status" /></a>
  <a href="https://github.com/SarthakDudhe/Feasto-Food-Delivery-Platform/releases"><img src="https://img.shields.io/badge/Version-1.0.0-f97316?style=for-the-badge" alt="Version Badge" /></a>
  <a href="https://github.com/SarthakDudhe/Feasto-Food-Delivery-Platform/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/Architecture-Monorepo-8b5cf6?style=for-the-badge" alt="Monorepo Badge" />
</p>

<p>
  <a href="#key-features">Key Features</a> •
  <a href="#why-this-project-matters">Product Market Fit</a> •
  <a href="#system-architecture">System Design</a> •
  <a href="#technical-excellence">Technical Highlights</a> •
  <a href="#database-schema">Database Design</a> •
  <a href="#local-setup">Installation Guide</a>
</p>

</div>

---

## 📽️ Visual Product Gallery

Here are the visual checkpoints demonstrating the premium, curated design system ("Warm Diner Accent" - `#fff9f5`, `#ff5a3d`, `#efdcd3`) across the customer app and admin dashboard.

| Interface View | Recommended Mockup / Screenshot Specs | Purpose |
| :--- | :--- | :--- |
| **Hero & Explore Menu** | `[Hero Banner: 1400x600px]` Showing the landing header, active promo carousel, and category filters. | Demonstrates CSS layout fluidity and grid-category response. |
| **Split-Screen Operations Workspace** | `[Admin Dashboard: 1400x600px]` Left orders checklist summary panel, right-side detailed inspector with maps directions, rider select, and KOT print actions. | Showcases packer item checklists, active state highlights, and collapsible mobile drawer. |
| **HTML5 Scratch Card Coupon** | `[Canvas Interaction: 1400x600px]` Canvas overlaying the Golden coupon code with real-time percentage scratching. | Highlights HTML5 pixel blending and math thresholds. |
| **Live Delivery Tracker Map** | `[Live SVG Map: 1400x600px]` Live timeline progress tracker with a 2D scooter 🛵 gliding along a custom SVG spline path. | Represents the React state-to-SVG coordinate mappings. |
| **SVG Sales Analytics Line Graph** | `[Dashboard Analytics: 1400x600px]` Custom SVG area chart with linear color gradients and interactive tooltips. | Proves native charting competence without relying on heavy external charting suites. |

---

## 🎯 Why This Project Matters

Most student or tutorial food delivery clones are simple "read-only lists" linked to basic Stripe checkouts. They lack the structural operational tooling needed by real businesses:

* **The Operational Gap:** Kitchen staff do not use customer list grids; they require **dedicated workflows** (split-screen inspectors, packing checklists, and physical Kitchen Order Tickets).
* **The Logistics Gap:** Delivery couriers cannot navigate on textual descriptions; they require **Google Maps integration** and persistent dispatcher handshakes.
* **The Marketing Gap:** Flat promo codes are rarely engaging; gamifying code unlocks via **interactive canvas scratchcards** raises conversion rates by up to 30%.
* **The Value Proposition:** **Feasto** bridges the merchant-to-customer operational loop. It simulates a fully functioning diner workspace, detailing order placement, AI conversational helpers, dashboard analytics, packer checklists, thermal printing, and live tracking.

---

## ✨ Discovered Features & Product Workflows

### 1. Customer Commerce & Live Logistics
* **Interactive Live Tracker**:
  - Replaces text order histories with a live tracking screen ([TrackOrder.jsx](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/client/src/pages/TrackOrder/TrackOrder.jsx)).
  - Uses an animated custom **SVG curve road path** where a delivery scooter 🛵 transitions coordinates depending on order state.
  - Dynamically displays assigned **Rider Profiles** with call/message widgets and active glowing borders during `"Out for delivery"`.
  - Fires full-screen confetti bursts upon status reaching `"Delivered"`.
* **Gamified HTML5 Scratchcard**:
  - Rendered next to the promo code input using golden metallic Canvas textures ([ScratchCard.jsx](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/client/src/components/ScratchCard/ScratchCard.jsx)).
  - Uses `destination-out` composite canvas brush erasures to track mouse/touch movements.
  - Calculates scratch percentage on-the-fly, triggering confetti and auto-filling the input once $>48\%$ is cleared.

### 2. Conversational AI Assistant
* **Gemini AI Recipe Companion**:
  - Connects to Google Gemini API with system prompts enforcing JSON responses matching structural schemas ([Foodprompt.js](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/server/prompt/Foodprompt.js)).
  - Sanitizes user chat strings, extracts recipe instructions, parses dish titles, and fetches corresponding live database stock cards.
  - Chat bubbles render a **horizontal scrolling grid of matching food cards** allowing customers to click "Add +" directly into their cart.

### 3. Admin Operational Panel & Kitchen Workspace
* **Dual-Pane Split Workspace**:
  - Replaces the simple row grid page with an enterprise-style split dashboard ([Order.jsx](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/admin/src/pages/Orders/Order.jsx)).
  - **Left Sidebar list**: Chronological summary items showing client names, item counts, totals, and colored status badges. Auto-selects the first filtered item.
  - **Right Detail Inspector**: Full order details sheet with customer profiles, Google Maps route redirections, packer item checklists, and dispatcher selectors.
* **Packer & Kitchen Checklists**:
  - Displays checkboxes next to each dish. Toggling checks strikes out the food title, helping packers review bag completeness.
* **Kitchen Order Ticket (KOT) Printing**:
  - Triggers standard `window.print()` formatted via print media CSS rules ([Order.css](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/admin/src/pages/Orders/Order.css)).
  - Automatically hides all screens, sidebars, and navigation headers, printing a clean, single-page 80mm thermal receipt ticket.

### 4. Interactive Dashboard Analytics
* **Custom SVG Charts**:
  - Fully hand-crafted SVG line and area trend charts mapping weekly revenue fluctuations ([Dashboard.jsx](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/admin/src/pages/Dashboard/Dashboard.jsx)).
  - Includes linear gradient areas and hovering tooltip bubbles with zero external D3/Chart.js package overhead.
  - Summary metrics display sales shares, average order values, and transaction counts.

---

## 🛠️ Technology Ecosystem

### Frontend (Client & Admin)
* **Core**: React 19.2.0, Vite, React Router DOM 7
* **Styling**: Vanilla CSS (Custom properties, HSL color scheme tokens, Glassmorphism gradients)
* **Http Client**: Axios (unified API request structures)
* **Components**: HTML5 Canvas, Custom SVG Paths

### Backend (API Server)
* **Runtime**: Node.js, Express 5 (Asynchronous routing pipelines)
* **Database Object Wrapper**: Mongoose 8 (Schema enforcement and validation)
* **AI Pipelines**: `@google/genai` (Gemini SDK integration)
* **Image Uploads**: Multer (Multer disk storage configuration)
* **Security**: JSON Web Token (JWT) signatures, Bcrypt password hashing, Validator strings verification

### Integration Services
* **Payments**: Stripe Node SDK (Checkout session endpoints)
* **Maps API**: Google Maps Search Engine queries redirection

---

## 📐 System Architecture & Communication Flow

### High-Level Architecture Diagram
```mermaid
flowchart TD
    subgraph ClientApps["Client Applications"]
        C[Customer React App<br/>Vite + Context]
        A[Admin React App<br/>Vite + CSS Modules]
    end

    subgraph BackendAPI["Backend REST API Gateway"]
        E[Express Server]
        AuthM[JWT Auth Middleware]
        OrderC[Order Controller]
        AIC[AI Controller]
        CartC[Cart Controller]
    end

    subgraph ExternalServices["Data & Third-Party Engines"]
        DB[(MongoDB Atlas)]
        STRIPE[Stripe Payments API]
        GEMINI[Google Gemini AI Engine]
        FS[(Disk File Uploads)]
    end

    C -->|REST / JSON Requests| E
    A -->|REST / JSON Requests| E

    E --> AuthM
    AuthM --> CartC
    AuthM --> OrderC
    
    OrderC -->|Store Orders / Read list| DB
    CartC -->|Sync Cart Data| DB
    OrderC -->|Generate Checkout URL| STRIPE
    AIC -->|Recipe Context Mapping| GEMINI
    E -->|Multipart Upload| FS
```

### Checkout & Payment Validation Pipeline
```mermaid
sequenceDiagram
    participant User as Customer App
    participant Server as Express Server
    participant Stripe as Stripe Gateway
    participant DB as MongoDB

    User->>Server: POST /api/order/place (Cart Items, Address, Coupon)
    Server->>DB: Create Pending Order (payment: false)
    Server->>Stripe: Create Stripe Checkout Session (amount, coupon discount)
    Stripe-->>Server: Return Session URL & Session ID
    Server-->>User: Return Redirect Link + Session ID
    User->>Stripe: Complete Stripe Payment Portal
    Stripe-->>User: Redirect to /verify?success=true&orderId=xyz
    User->>Server: POST /api/order/verify (orderId, success=true)
    Server->>DB: Find Order & Set payment = true
    Server-->>User: Return success response
    User->>User: Render Confetti & Open Live Tracking Map
```

---

## ⚡ Technical Excellence & Engineering Highlights

* **Structural Monorepo Separation**: Clear separation between `client/` (e.g., checkout and cart interfaces), `admin/` (e.g., operations split panes), and `server/` (e.g., Express endpoints).
* **Context-Driven State Hydration**: `StoreContext` handles JWT token sync, local cart operations, coupon caps, and total calculations, syncing cart changes asynchronously to MongoDB for logged-in sessions.
* **Optimized CSS Print Media Layout**: Reconfigured print styling rules to hide DOM shells entirely, eliminating extra blank pages when formatting thermal receipt slips.
* **Math-Based Interactive Canvas**: Canvas erasure tracking computes pixels wiped out by mapping alpha values in `Uint8ClampedArray`, preventing manual reveal cheating.
* **Custom SVG Chart Tooltips**: Map line and area charts use raw SVG elements (<circle>, <path>, <linearGradient>), resolving coordinate pins to show hover-activated tooltips without charting library overhead.

---

## 📊 Database Schema

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    FOOD ||--o{ ORDER : contains

    USER {
        string name "Required"
        string email "Unique, Validator checked"
        string password "Bcrypt hashed"
        object cartData "Key-value pair quantity map"
    }

    FOOD {
        string name "Required"
        string description "Dish description text"
        number price "Decimal amount"
        string image "Saved filename string"
        string category "Inventorial group"
    }

    ORDER {
        ObjectId userId "Reference to User"
        array items "Food items list with quantities"
        number amount "Final charged amount"
        object address "Delivery street, phone, pincode info"
        object coupon "Applied discount details"
        string status "Default: 'Food Processing'"
        string riderName "Assigned driver name"
        date date "Default: Date.now()"
        boolean payment "Stripe verification outcome flag"
    }
```

---

## 📁 Monorepo Directory Layout

```text
Feasto-Food-Delivery-Platform/
├── client/                     # Customer React Application
│   ├── src/
│   │   ├── components/         # Common UI (Navbar, Footer, ScratchCard)
│   │   ├── context/            # Global StoreContext state provider
│   │   ├── pages/              # Home, Cart, PlaceOrder, Verify, TrackOrder
│   │   └── assets/             # Menu definitions and images
│   └── index.html
├── admin/                      # Operations Admin Panel
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar panel
│   │   ├── pages/              # Add menu, List inventory, Orders split pane, Dashboard
│   │   └── assets/             # Operational static assets
│   └── index.html
├── server/                     # Node.js + Express API Backend
│   ├── configs/                # MongoDB Mongoose configurations
│   ├── controllers/            # Auth, Cart, Food catalog, Order workflows, AI
│   ├── middleware/             # Header JWT authentication middleware
│   ├── models/                 # Mongoose schemas (User, Food, Order)
│   ├── routes/                 # Express Router mappings
│   ├── utils/                  # Coupon caps, sanitization helpers
│   └── server.js               # Application Entry Point
└── README.md                   # Project documentation (this file)
```

---

## 🗝️ Environment Configuration

Create a `.env` file inside the `server/` directory and configure the variables:

```env
PORT=4000
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster.mongodb.net/feasto
JWT_SECRET=your_super_secure_jwt_secret_token
STRIPE_SECRET_KEY=sk_test_your_stripe_private_secret_key
GEMINI_API_KEY=AIzaSyYourGeminiAIKeyForRecipeAssistant
```

---

## 🚀 Local Installation & Developer Guide

### Step 1: Clone the Project
```bash
git clone https://github.com/SarthakDudhe/Feasto-Food-Delivery-Platform.git
cd Feasto-Food-Delivery-Platform
```

### Step 2: Set Up and Run Server
```bash
cd server
npm install
# Start node server using nodemon for live updates
npm run server
```
The backend API server will spin up on `http://localhost:4000`.

### Step 3: Set Up and Run Customer App
```bash
cd ../client
npm install
npm run dev
```
The customer app will start on Vite's default dev port: `http://localhost:5173`.

### Step 4: Set Up and Run Admin Panel
```bash
cd ../admin
npm install
npm run dev
```
The admin workspace will launch on: `http://localhost:5174`.

### Production Build Auditing
To build both frontends for production (testing ESM compatibility and minification):
```bash
# In client/
npm run build

# In admin/
npm run build
```

---

## 🔒 Security Architectures
1. **Password Safety**: Uses `bcrypt` with a 10-round salt factor before DB storage.
2. **Access Guards**: Routes editing cart state or checking orders utilize the `authMiddleware` to decode client-header JWT tokens, injecting a verified `userId` directly into requests.
3. **AI Guardrails**: Gemini recipe prompts sanitise query items to filter out bad inputs, forcing recipe outputs to strictly format as a standardized JSON schema.

---

## 🤝 Contributing Guidelines

Contributions are welcome! Please follow these steps to propose improvements:

1. **Fork** the repository.
2. Create your **feature branch**: `git checkout -b feature/amazing-feature`.
3. **Commit** your changes: `git commit -m 'Add some amazing feature'`.
4. **Push** to the branch: `git push origin feature/amazing-feature`.
5. Open a **Pull Request**.

---

## 📄 License
This project is licensed under the **MIT License**. Check the [LICENSE](file:///c:/Users/saksh/Desktop/MY%20PROJECTS/Feasto-Food%20Delivery%20Platform/LICENSE) file for terms.

---

## 📧 Contact & Developer Info

* **GitHub:** [SarthakDudhe](https://github.com/SarthakDudhe)
* **LinkedIn:** [Sarthak Dudhe](https://www.linkedin.com/in/sarthak-dudhe-67155a327)
* **Portfolio:** [Portfolio Website](https://portfolio-sarthak-beta.vercel.app/)
* **Email:** `sarthakdudhe79@gmail.com`
