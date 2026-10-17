# 🎱 CueClub — Smart Snooker & Pool Club Booking and Management System

CueClub is a full-stack smart booking and management system for cue sports lounges. It handles customer reservations, real-time table availability, digital session timing, POS billing, walk-in management, no-show penalties, and customer play history.

***Made during a vibe coding hackathon***

---

## 🔐 Staff Operations Login & Demo Credentials

The Staff Operations Console is accessible at [`/staff/login`](http://localhost:3000/staff/login).

You can log in using any of the following pre-configured demo staff/manager accounts:

### Option 1: Manager Account (Recommended)
- **Email or Phone**: `staff@cueclub.com` (or `9988776655`)
- **Password**: `CueClub@Staff2026`
- **Name**: Vikram Mehta (Manager)
- **Role**: Owner / Club Manager

### Option 2: Quick Admin Account
- **Email or Phone**: `admin` (or `admin@cueclub.com`)
- **Password**: `admin123`
- **Name**: Club Administrator
- **Role**: Owner / Admin

> **Security Note**: All passwords are encrypted locally using salted PBKDF2-HMAC-SHA512. Authentication generates a secure HMAC-signed HTTP-only session cookie (`cueclub_staff_session`).

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js `v18+` or `v20+`
- npm `v9+` or `v10+`

### Running the App
```bash
npm run dev
# Or for optimized production:
npm run build
npm run start
```
Open [http://localhost:3000](http://localhost:3000).

---

## 📂 Core Portals

- **Customer Website**: `http://localhost:3000/`
  - Real-time table viewing and slot selection.
  - Zero double-booking server validation with 25% deposit.
  - Customer booking history lookup at `/my-bookings`.
- **Staff Operations Console**: `http://localhost:3000/staff` (requires login)
  - Real-time table management, check-in, pause/resume, and extension.
  - Walk-in assignment with automated grace period handling.
  - POS checkout with add-ons, discounts, and payment receipts.
  - Customer directory and historical playing ledger.
