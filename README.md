# WatchStore POS System

A modern, keyboard-optimized POS system for watch stores.

## Features
- **POS Screen**: Quick checkout with barcode scanner support.
- **Inventory Management**: Full CRUD operations for wrist watches and wall clocks.
- **Reporting**: Daily sales and profit analytics.
- **Styling**: Premium dark-mode UI with Tailwind CSS.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons + Axios
- **Backend**: Node.js + Express + PostgreSQL
- **Database**: PostgreSQL (schema provided)

## Setup Instructions

### 1. Database Setup
Ensure you have PostgreSQL installed and running. Create a database named `pos_db` and execute the schema:
```bash
cd backend
psql -U postgres -d pos_db -f schema.sql
```

### 2. Backend Configuration
Configure your database credentials in `backend/.env`.

### 3. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.
The backend will run at `http://localhost:5000`.

## Keyboard Shortcuts (POS Screen)
- **Scanner Area**: Automatically focused on load.
- **Enter**: Add item to cart after scanning/typing barcode.
- **Checkout**: Click Checkout button (Shortcut F8 functionality implementation pending - simple frontend binding).
