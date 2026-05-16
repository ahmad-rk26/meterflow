# MeterFlow — API Billing Platform

> A full-stack, production-ready API gateway and usage-based billing platform built for developers and SaaS teams. MeterFlow lets you register APIs, issue API keys, proxy and meter every request, auto-generate monthly invoices, and collect payments via Razorpay.

---

## Table of Contents

- [What is MeterFlow?](#what-is-meterflow)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Plans & Pricing](#plans--pricing)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
  - [Backend — Render](#backend--render)
  - [Frontend — Vercel](#frontend--vercel)
  - [Alternative: Railway](#alternative-railway)
- [Architecture](#architecture)
- [Security](#security)

---

## What is MeterFlow?

MeterFlow is an **API Gateway + Billing Platform**. It sits between your customers and your APIs:

```
Your Customer's App
        ↓
  X-API-Key header
        ↓
  MeterFlow Proxy  ←── logs request, checks limits, calculates cost
        ↓
  Your Upstream API
        ↓
  Response returned to customer
```

Every request is authenticated, logged, and billed. At the end of each month, invoices are auto-generated and customers pay via Razorpay.

---

## How It Works

### For API Providers (You)
1. Register on MeterFlow
2. Add your API endpoint (e.g. `https://api.yourservice.com/data`)
3. Generate an API key for your customer
4. Share the MeterFlow proxy URL + key with your customer
5. Every call they make is tracked and billed

### For End Users (Your Customers)
```bash
# Instead of calling your API directly:
curl https://api.yourservice.com/data

# They call through MeterFlow:
curl https://yourdomain.com/api/v1/your-api-slug \
  -H "X-API-Key: their_api_key"
```

### Billing Cycle
- Requests are logged in real time
- On the **1st of every month**, invoices are auto-generated for all users
- Invoice = Plan subscription fee + overage charges
- Users pay via Razorpay (UPI, Cards, Netbanking)
- Payment receipt sent via email automatically

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v18+ | Runtime |
| Express.js | 4.18 | HTTP server & routing |
| MongoDB Atlas | Cloud | Primary database |
| Mongoose | 7.5 | ODM for MongoDB |
| Redis Cloud | Cloud | Queue backend (BullMQ) |
| BullMQ | 4.15 | Background job queues |
| Socket.io | 4.7 | Real-time usage updates |
| Razorpay | 2.9 | Payment gateway (INR) |
| Nodemailer | 8.0 | Transactional emails |
| PDFKit | 0.18 | Invoice PDF generation |
| bcryptjs | 2.4 | Password hashing |
| jsonwebtoken | 9.0 | JWT authentication |
| Helmet | 7.0 | HTTP security headers |
| express-rate-limit | 6.10 | API rate limiting |
| axios | 1.4 | HTTP proxy forwarding |
| ioredis | 5.10 | Redis client |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| React Router DOM | 6.14 | Client-side routing |
| TanStack Query | 4.35 | Server state management |
| Tailwind CSS | 3.3 | Utility-first styling |
| Axios | 1.4 | HTTP client |
| Socket.io Client | 4.7 | Real-time updates |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database (free tier available) |
| Redis Cloud | Queue and rate limiting (free tier available) |
| Gmail SMTP | OTP and invoice emails |
| Razorpay | Payment processing (test + live) |
| Render / Railway | Backend hosting |
| Vercel | Frontend hosting |

---

## Project Structure

```
api_billing_platform/
├── backend/
│   ├── config/
│   │   ├── config.js          # Environment config loader
│   │   └── plans.js           # Plan definitions (Free/Basic/Premium)
│   ├── controllers/
│   │   ├── auth.js            # OTP register, login, password reset
│   │   ├── apis.js            # CRUD for API endpoints
│   │   ├── keys.js            # API key generation & revocation
│   │   ├── usage.js           # Usage queries & daily stats
│   │   ├── billing.js         # Invoice generation, PDF, Razorpay
│   │   └── plan.js            # Plan upgrade via Razorpay
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── apiKeyAuth.js      # API key auth + usage logging + limit enforcement
│   │   └── rateLimit.js       # Express rate limiter
│   ├── models/
│   │   ├── User.js            # User account + plan
│   │   ├── Api.js             # API endpoint definition
│   │   ├── ApiKey.js          # API key + active status
│   │   ├── Usage.js           # Per-request log
│   │   ├── Billing.js         # Monthly invoice (auto invoice numbers)
│   │   └── Otp.js             # OTP with TTL auto-expiry
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── apis.js            # /api/apis/*
│   │   ├── keys.js            # /api/keys/*
│   │   ├── usage.js           # /api/usage/*
│   │   ├── billing.js         # /api/billing/*
│   │   ├── plan.js            # /api/plans/*
│   │   └── proxy.js           # /api/v1/:slug (public proxy)
│   ├── services/
│   │   ├── schedulerService.js  # Monthly billing + overdue reminders
│   │   ├── queueService.js      # BullMQ queue setup
│   │   └── pdfService.js        # PDF invoice generation
│   ├── utils/
│   │   ├── auth.js            # JWT + bcrypt helpers
│   │   ├── apiKey.js          # 64-char hex key generator
│   │   └── email.js           # OTP, invoice, receipt, overdue emails
│   ├── server.js              # Express app entry point
│   ├── package.json
│   └── .env                   # Environment variables (never commit)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js      # Responsive nav with auth state
│   │   │   ├── Footer.js      # Site footer
│   │   │   └── PrivateRoute.js # Route guard
│   │   ├── hooks/
│   │   │   └── useSocket.js   # Socket.io singleton hook
│   │   ├── pages/
│   │   │   ├── Landing.js     # Marketing page with carousel
│   │   │   ├── Login.js       # Email + password login
│   │   │   ├── Register.js    # 2-step OTP registration
│   │   │   ├── ForgotPassword.js # 3-step password reset
│   │   │   ├── Dashboard.js   # Overview + stats
│   │   │   ├── Apis.js        # Create/manage APIs
│   │   │   ├── ApiKeys.js     # Keys + integration guide + test console
│   │   │   ├── Usage.js       # Request log + analytics
│   │   │   ├── Billing.js     # Invoices + Razorpay payment
│   │   │   └── Pricing.js     # Plan comparison + upgrade
│   │   ├── services/
│   │   │   └── api.js         # Axios instance + JWT interceptor + auto-logout
│   │   ├── store/
│   │   │   └── atoms.js       # Reserved for global state
│   │   ├── App.js             # Route definitions
│   │   ├── index.js           # React Query + Router setup
│   │   └── index.css          # Tailwind imports
│   ├── package.json
│   └── .env                   # Frontend env variables
│
└── README.md
```

---

## Features

### Authentication
- OTP-based registration (email verification required)
- JWT tokens with 7-day expiry
- Forgot password via OTP (3-step flow)
- Auto-logout on token expiry or 401 response
- Cross-tab session sync

### API Management
- Create APIs with name, endpoint URL, HTTP method, rate limit, cost per request
- Auto-generated URL slug (e.g. `my-weather-api`)
- Plan-based API count limits enforced
- Delete APIs

### API Key Management
- Generate unique 64-character hex API keys
- Per-API key assignment with ownership validation
- Copy-to-clipboard
- One-click integration guide (cURL, JavaScript, Python)
- Live test console — make real proxied requests from the dashboard
- Revoke keys

### Proxy Gateway
- Public endpoint: `GET/POST/PUT/DELETE /api/v1/:slug`
- Authenticates via `X-API-Key` header
- Forwards request to upstream API
- Logs every request (timestamp, response time, status code, cost)
- Enforces monthly request limits per plan
- Returns 429 with upgrade prompt when limit reached
- Legacy endpoint: `/api/proxy/:apiId`

### Usage Analytics
- Real-time request counter via Socket.io
- Monthly usage meter with progress bar (green/amber/red)
- Warning at 80% usage, block at 100%
- Per-API breakdown with error rates
- Daily stats for last 30 days
- Paginated request log (20 per page)

### Billing & Invoicing
- **Auto-generated invoices** on the 1st of every month
- Sequential invoice numbers: `INV-2026-0001`
- Invoice breakdown: Plan fee + overage charges
- 15-day payment due date
- Overdue status tracking
- **PDF invoice download** (professional A4 layout)
- **Invoice email** with PDF attachment on generation
- **Payment receipt email** after successful payment
- **Overdue reminder emails** at 3, 7, and 14 days past due
- Cannot generate invoice for current/future months

### Payments (Razorpay)
- Create Razorpay payment orders
- HMAC-SHA256 signature verification
- Supports Cards, Netbanking, Wallets
- UPI available in production (live keys)
- Plan upgrades via Razorpay

### Plans
| | Free | Basic | Premium |
|---|---|---|---|
| Price | ₹0/month | ₹499/month | ₹1,999/month |
| Requests/month | 1,000 | 50,000 | 5,00,000 |
| APIs | 2 | 10 | 100 |
| API Keys | 3 | 25 | 500 |
| Overage | — | ₹0.01/req | ₹0.005/req |
| Support | Community | Email | Priority + SLA |

---

## Plans & Pricing

Plans are defined in `backend/config/plans.js` — single source of truth for both backend enforcement and frontend display.

**Cost calculation:**
```
Invoice Total = Plan Fee + Overage Cost
Overage Cost  = max(0, totalRequests - planLimit) × costPerRequest
```

**Example (Basic plan, 60,000 requests):**
```
Plan Fee     = ₹499
Overage      = (60,000 - 50,000) × ₹0.01 = ₹100
Total        = ₹599
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-register-otp` | Send OTP to email |
| POST | `/api/auth/register` | Verify OTP + create account |
| POST | `/api/auth/login` | Login with email + password |
| GET | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/send-forgot-otp` | Send password reset OTP |
| POST | `/api/auth/verify-forgot-otp` | Verify reset OTP |
| POST | `/api/auth/reset-password` | Set new password |

### APIs (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/apis` | List user's APIs |
| POST | `/api/apis` | Create API |
| PUT | `/api/apis/:id` | Update API |
| DELETE | `/api/apis/:id` | Delete API |

### API Keys (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/keys` | List user's keys |
| POST | `/api/keys` | Generate key |
| DELETE | `/api/keys/:id` | Revoke key |

### Usage (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/usage` | All usage records |
| GET | `/api/usage/stats` | Daily stats (last 30 days) |

### Billing (requires JWT)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/billing` | Invoice history |
| GET | `/api/billing/current` | Current month live usage |
| GET | `/api/billing/:id/download` | Download PDF invoice |
| POST | `/api/billing/generate` | Manually generate invoice |
| POST | `/api/billing/create-order` | Create Razorpay order |
| POST | `/api/billing/verify-payment` | Verify payment signature |

### Plans
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/plans` | Get all plans (public) |
| POST | `/api/plans/upgrade-order` | Create upgrade order |
| POST | `/api/plans/verify-upgrade` | Verify upgrade payment |

### Proxy (requires X-API-Key header)
| Method | Endpoint | Description |
|---|---|---|
| ALL | `/api/v1/:slug` | Proxy request to upstream API |

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
REDIS_URL=redis://default:<password>@<host>:<port>
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=https://your-backend-domain.onrender.com
REACT_APP_SOCKET_URL=https://your-backend-domain.onrender.com
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> **Never commit `.env` files to Git.** Add them to `.gitignore`.

---

## Local Development

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB Atlas account (free tier)
- Redis Cloud account (free tier)
- Razorpay account (test mode)
- Gmail account with App Password enabled

### Setup

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/meterflow.git
cd meterflow
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Configure environment variables**

Copy and fill in the backend env:
```bash
cd ../backend
cp ../.env.example .env
# Edit .env with your credentials
```

Copy and fill in the frontend env:
```bash
cd ../frontend
# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000" > .env
echo "REACT_APP_SOCKET_URL=http://localhost:5000" >> .env
echo "REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key" >> .env
```

**5. Start the backend**
```bash
cd backend
npm run dev
# Server starts on http://localhost:5000
```

**6. Start the frontend**
```bash
cd frontend
npm start
# App opens on http://localhost:3000
```

### Gmail App Password Setup
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification (must be enabled)
3. Security → App passwords
4. Create password for "Mail"
5. Copy the 16-character password into `EMAIL_PASS`

---

## Deployment

### Backend — Render (Recommended, Free Tier Available)

**Step 1 — Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/meterflow.git
git push -u origin main
```

**Step 2 — Create Render Web Service**
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name:** `meterflow-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or Starter for production)

**Step 3 — Add Environment Variables on Render**

In Render dashboard → Environment → Add the following:
```
PORT                  = 5000
MONGODB_URI           = your_mongodb_atlas_uri
REDIS_URL             = your_redis_cloud_url
JWT_SECRET            = your_jwt_secret
EMAIL_USER            = your_gmail@gmail.com
EMAIL_PASS            = your_gmail_app_password
RAZORPAY_KEY_ID       = rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET   = your_razorpay_secret
FRONTEND_URL          = https://your-app.vercel.app
```

**Step 4 — Deploy**
- Click "Create Web Service"
- Render auto-deploys on every push to main
- Your backend URL: `https://meterflow-backend.onrender.com`

> **Note:** Free tier on Render spins down after 15 minutes of inactivity. Use Starter ($7/month) for always-on.

---

### Frontend — Vercel (Recommended, Free)

**Step 1 — Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2 — Deploy**
```bash
cd frontend
vercel
```

Follow the prompts:
- Set up and deploy: `Y`
- Which scope: your account
- Link to existing project: `N`
- Project name: `meterflow-frontend`
- Directory: `./` (already in frontend/)
- Override settings: `N`

**Step 3 — Add Environment Variables on Vercel**

Go to [vercel.com](https://vercel.com) → Your Project → Settings → Environment Variables:
```
REACT_APP_API_URL           = https://meterflow-backend.onrender.com
REACT_APP_SOCKET_URL        = https://meterflow-backend.onrender.com
REACT_APP_RAZORPAY_KEY_ID   = rzp_live_xxxxxxxxxxxx
```

**Step 4 — Redeploy with env vars**
```bash
vercel --prod
```

Your frontend URL: `https://meterflow-frontend.vercel.app`

**Step 5 — Update FRONTEND_URL on Render**

Go back to Render → Environment → Update:
```
FRONTEND_URL = https://meterflow-frontend.vercel.app
```

---

### Alternative: Railway (Backend + Frontend together)

Railway supports both Node.js and static sites in one project.

**Step 1 — Install Railway CLI**
```bash
npm install -g @railway/cli
railway login
```

**Step 2 — Deploy backend**
```bash
cd backend
railway init
railway up
```

**Step 3 — Set environment variables**
```bash
railway variables set MONGODB_URI="your_uri"
railway variables set REDIS_URL="your_redis_url"
railway variables set JWT_SECRET="your_secret"
# ... add all other variables
```

**Step 4 — Deploy frontend**
```bash
cd ../frontend
npm run build
# Deploy the build/ folder to Vercel or Netlify
```

---

### MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Database Access → Add user with read/write permissions
4. Network Access → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
5. Connect → Drivers → Copy connection string
6. Replace `<password>` with your DB user password

---

### Redis Cloud Setup

1. Go to [redis.com/try-free](https://redis.com/try-free)
2. Create a free database (30MB)
3. Copy the Redis URL from the database dashboard
4. Format: `redis://default:<password>@<host>:<port>`

---

### Razorpay Setup

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Sign up and complete KYC for live payments
3. Settings → API Keys → Generate Key
4. Use `rzp_test_*` keys for development
5. Use `rzp_live_*` keys for production
6. Settings → Payment Methods → Enable UPI, Cards, Netbanking

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  Landing │ Auth │ Dashboard │ APIs │ Keys │ Usage │ Billing│
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS + JWT
┌──────────────────────▼──────────────────────────────────┐
│                  Backend (Express.js)                    │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Auth Routes │  │  API Routes  │  │  Proxy Routes  │  │
│  │  /api/auth/* │  │  /api/apis/* │  │  /api/v1/:slug │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Middleware Layer                        │ │
│  │  JWT Auth │ API Key Auth │ Rate Limiter │ Helmet     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  Scheduler   │  │  Socket.io  │  │  PDF Service   │  │
│  │  (Billing +  │  │  (Real-time │  │  (Invoice PDF) │  │
│  │   Reminders) │  │   updates)  │  └────────────────┘  │
│  └──────────────┘  └─────────────┘                      │
└──────────┬──────────────────┬───────────────────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼────────┐
│  MongoDB Atlas  │  │   Redis Cloud   │
│  (Primary DB)   │  │  (BullMQ Queue) │
└─────────────────┘  └─────────────────┘
           │
┌──────────▼──────────────────────────────┐
│           External Services             │
│  Razorpay (Payments) │ Gmail (Emails)   │
└─────────────────────────────────────────┘
```

---

## Security

- **Passwords** hashed with bcrypt (10 rounds)
- **JWT tokens** expire in 7 days, verified on every protected request
- **API keys** are 64-character cryptographically random hex strings
- **Razorpay payments** verified with HMAC-SHA256 signature
- **OTPs** expire in 10 minutes, single-use, auto-deleted via MongoDB TTL index
- **Helmet.js** sets secure HTTP headers (XSS, CSRF, clickjacking protection)
- **CORS** configured to allow only your frontend domain in production
- **Rate limiting** on all routes (100 req/15min globally)
- **Plan limits** enforced server-side — cannot be bypassed from frontend
- **API key ownership** validated before key creation
- **Environment variables** never committed to Git

---

## License

MIT License — free to use, modify, and distribute.

---

*Built with Node.js, React, MongoDB, Redis, Razorpay, and Tailwind CSS.*
