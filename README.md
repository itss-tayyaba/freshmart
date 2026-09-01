# 🛒 FreshMart - Full-Stack Express Grocery & Superstore Platform

> **A production-grade, 10-minute ultra-fast grocery delivery web platform & 11-module admin management suite built with React 18, Tailwind CSS, Node.js, Express.js, and MongoDB Atlas (Mongoose).**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)

---

## 🌟 Key Highlights & Features

### 🛍️ 1. Ultra-Fast Grocery Storefront
- **Instant Category Navigation**: 12 high-resolution grocery departments (Fruits & Vegetables, Dairy & Eggs, Meat, Bakery, Beverages, Snacks, Staples, etc.).
- **Live Search & Multi-Filter Engine**: Filter by price slider, brand, customer ratings, in-stock status, and search keywords.
- **Recipe Bundles (1-Click Add All)**: Interactive recipe cards (*Chicken Biryani, Mango Smoothie, Salad Bowl*) that add all ingredients into your shopping basket in 1 tap.
- **Cart & Express Checkout Drawer**: Real-time total calculation, free delivery threshold (Rs. 1,000+), coupon validator (`FRESH50`, `FREESHIP`), and delivery slot picker (*Today 2 PM - 4 PM*).
- **Multi-Currency Support**: Switch between Pakistani Rupees (`Rs. `), US Dollars (`$`), and Euros (`€`).

### 👤 2. Customer Portal Suite
- **👑 VIP Gold Membership Banner**: Real-time order metrics, total savings counter, and loyalty points.
- **📦 Order History & Live GPS Tracking**: Step-by-step delivery progress (*Confirmed ➔ Packed ➔ Courier Dispatched ➔ Delivered*) with interactive road map coordinates and courier contact.
- **🔄 1-Click Reorder**: Instant cart replenishment from previous orders.
- **🧾 Tax Invoice Generator**: Itemized, printable, and downloadable customer receipts.
- **📍 Saved Delivery Addresses**: Manage multiple home, office, and family addresses with default switching.
- **💳 FreshMart Wallet & Rewards**: Top-up wallet, convert loyalty points to cash, and manage active coupon vouchers.
- **⚙️ Profile & Security**: Edit customer contact info, password manager, and SMS/WhatsApp delivery alert preferences.

### 📊 3. 11-Module Enterprise Admin Suite
- **📈 Executive Dashboard**: 4 KPI summary cards, SVG sales revenue analytics graph, category distribution donuts, and low-stock alerts.
- **📦 Products Management**: Search, filter by active/low-stock/out-of-stock, inline inventory counters, and **Interactive Add/Edit Product Modal** with **`[ Choose File ]`** image uploader and live preview.
- **🗂️ Categories Management**: Visual grid with live item counts, **Interactive Add/Edit Category Modal** with image uploader, and delete safeguards.
- **🛒 Order Fulfillment**: Filter by timeline stages (*Pending, Confirmed, Preparing, Out for Delivery, Delivered*) with status changer.
- **👥 Customer Directory**: Customer spend analytics, order counters, and contact directory.
- **📋 Inventory & Stock Alerts**: 1-Click stock replenishment (`+50 Units Restock`) and minimum threshold warnings.
- **🚚 Live Delivery Dispatch**: Real-time rider dispatch queue with live GPS route map (*Rider Ali, ETA 12 mins*).
- **🚚 Supplier Directory**: Vendor management with contract tracking and direct supplier creation.
- **🎟️ Marketing & Promotions**: Launch and manage discount campaigns and coupon validator engine.
- **📑 Financial Reports**: Daily, weekly, monthly revenue graphs and customer purchase funnel metrics.
- **⚙️ Store Settings**: Store status toggle (Open/Maintenance), currency settings, logo manager, and shipping fees configuration.

---

## 🏗️ Architecture & Tech Stack

```
FreshMart/
├── src/                          # Frontend React Application
│   ├── components/
│   │   ├── Admin/                # 11-Module Admin Dashboard & Edit Modals
│   │   ├── CustomerPortal/       # Customer Portal (Orders, Addresses, Wallet, Settings)
│   │   ├── Header/               # Navigation, Search, Location Picker, View Switchers
│   │   ├── Home/                 # Hero Banners, Flash Deals, Top Categories, Features
│   │   ├── Shop/                 # Product Catalog, Filters, Pagination
│   │   ├── ProductDetail/        # Single Product View, Nutrition Facts, Reviews
│   │   ├── Checkout/             # Multi-Step Express Checkout
│   │   ├── Recipes/              # Recipe Bundles
│   │   └── Modals/               # Cart Drawer, Wishlist Drawer, GPS Tracker, Toasts
│   ├── context/
│   │   └── StoreContext.jsx      # Global State synchronized with Backend REST APIs
│   ├── services/
│   │   └── api.js                # Frontend API Service (Fetch Client)
│   └── data/                     # Seed data & Catalog fixtures
├── server/                       # Backend Node.js / Express API
│   ├── config/
│   │   └── db.js                 # MongoDB Atlas Connection Manager (with fallback)
│   ├── models/                   # Mongoose Schemas (User, Product, Category, Order, ExtraModels)
│   ├── controllers/              # REST API Controllers (Auth, Products, Orders, Inventory, etc.)
│   ├── middleware/               # JWT Auth & Error Handling Middleware
│   ├── routes/
│   │   └── apiRoutes.js          # REST Endpoints Route Table
│   ├── seeder.js                 # Database Initializer & Cloud Seeder
│   └── server.js                 # Express App Entry Point (Port 5000)
├── .env                          # Server & Database Environment Config
├── .env.example                  # Example Environment Config
├── vercel.json                   # Vercel Deployment Configuration
└── package.json                  # Dependencies & Scripts
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status & database connection status | Public |
| `POST` | `/api/auth/register` | Customer registration | Public |
| `POST` | `/api/auth/login` | JWT login authentication | Public |
| `GET` | `/api/products` | Filterable product catalog (search, price, category) | Public |
| `POST` | `/api/products` | Create new product | Admin |
| `PUT` | `/api/products/:id` | Update product details, price, image & stock | Admin |
| `DELETE` | `/api/products/:id`| Remove product from catalog | Admin |
| `GET` | `/api/categories` | List all grocery categories | Public |
| `POST` | `/api/categories` | Create new category | Admin |
| `PUT` | `/api/categories/:id`| Update category name, count & image | Admin |
| `POST` | `/api/orders` | Place new order (calculates totals, creates timeline) | Public |
| `GET` | `/api/orders` | List customer / admin orders | Public / Admin |
| `GET` | `/api/orders/track/:id` | Live order timeline & courier ETA tracking | Public |
| `PUT` | `/api/orders/:id/status` | Update fulfillment status | Admin |
| `POST` | `/api/promotions/validate` | Validate coupon code (`FRESH50`, `FREESHIP`) | Public |
| `GET` | `/api/inventory` | Inventory stock status & replenishment alerts | Admin |
| `POST` | `/api/inventory/:id/restock` | 1-Click stock replenishment (+50 units) | Admin |
| `GET` | `/api/delivery` | Active rider dispatch queue & GPS coordinates | Admin |
| `GET` | `/api/analytics/dashboard` | Sales KPIs, top products, customer behavior funnels | Admin |

---

## 🚀 Quick Start / Local Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/freshmart-grocery.git
cd freshmart-grocery
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the project root (or copy `.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=freshmart_secret_jwt_key_2026
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/freshmart?retryWrites=true&w=majority
```

### 4. Seed Database (Optional)
Populate your live MongoDB Atlas cluster with default grocery products, categories, orders, and coupons:
```bash
npm run seed
```

### 5. Start the Application
- **Start Backend Server**:
  ```bash
  npm run server
  ```
  *(API runs at `http://localhost:5000`)*

- **Start Frontend Dev Server**:
  ```bash
  npm run dev
  ```
  *(Storefront & Admin runs at `http://localhost:5173`)*

---

## ☁️ Deployment Guide

### Option A: Deploy Frontend on Vercel
1. Install Vercel CLI or import repository on [vercel.com](https://vercel.com).
2. Connect your GitHub repository.
3. Set Framework Preset to **Vite**.
4. Deploy! The included `vercel.json` ensures full client-side routing.

### Option B: Deploy Backend on Render / Railway / Heroku
1. Create a new **Web Service** on [render.com](https://render.com) or [railway.app](https://railway.app).
2. Set Build Command: `npm install`
3. Set Start Command: `node server/server.js`
4. Add Environment Variables (`PORT=5000`, `MONGO_URI=...`, `JWT_SECRET=...`).

---

## 📄 License
This project is open-source and available under the **MIT License**.
