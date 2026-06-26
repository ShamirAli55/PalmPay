# PalmPay Wallet

A biometric-secured digital wallet application. Users authenticate transactions with a palm scan, manage a virtual wallet, add bank accounts and virtual cards, send and receive funds, and receive real-time notifications.

---

## 🚀 Recent Enhancements

- **Palm ID (@handle) System**: Every user now receives a unique Palm ID (e.g., `@alex_palm`). Users can search and send money using these handles instead of just phone numbers or email.
- **Dynamic Recipient Discovery**: Optimized "matches-only" search interface. Recipient cards appear dynamically as you type (Name, @Palm ID, or Phone), reducing UI clutter.
- **Production Hardening**: Implemented strict backend input validation (amount limits, ownership verification) and a defensive error-handling system.
- **Real-Time Notification Core**: Enhanced Socket.IO integration to provide instant feedback for transactions, balance updates, and profile changes. Added a real-time unread notification count synchronization.
- **Self-Transfer Protection**: Intelligent guards to prevent users from sending money to their own accounts, ensuring ledger integrity.
- **Mobile-Responsive UI**: Complete redesign of the notification system and dashboard to be fully responsive for mobile devices.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Prerequisites](#prerequisites)
5. [Environment Variables](#environment-variables)
6. [Installation](#installation)
7. [Running the Application](#running-the-application)
8. [Service Details](#service-details)
   - [Frontend](#frontend)
   - [Node.js Backend](#nodejs-backend)
   - [Palm Auth Service](#palm-auth-service)
9. [API Reference](#api-reference)
10. [Database Models](#database-models)
11. [Real-Time Events](#real-time-events)
12. [Authentication Flow](#authentication-flow)

---

## Architecture Overview

The system is composed of three independent services that run concurrently.

```
┌───────────────────────────────────────────────────────────────────┐
│                          Browser Client                           │
│                    React + Vite (port 5173)                       │
└───────────────────────┬───────────────────────────────────────────┘
                        │ HTTP / WebSocket
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                     Node.js API Server                            │
│               Express + Socket.IO (port 5000)                     │
│                                                                   │
│  Routes: /api/users  /api/palm  /api/transactions                 │
│          /api/wallet  /api/notifications                          │
└───────────────┬───────────────────────────────────────────────────┘
                │ HTTP (multipart/form-data)
                ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Palm Auth Microservice                         │
│               FastAPI + PyTorch (port 8000)                       │
│                                                                   │
│  Routes: POST /enroll/{user_id}                                   │
│          POST /verify/{user_id}                                   │
│          DELETE /unenroll/{user_id}                               │
└───────────────┬───────────────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────────────────┐
│                       MongoDB Atlas                               │
│                                                                   │
│  Collections: users  wallets  transactions  bank_accounts         │
│               cards  notifications  palm_embeddings               │
└───────────────────────────────────────────────────────────────────┘
```

**Clerk** handles user identity and session management. The Node.js backend verifies every protected request using the Clerk SDK. The Palm Auth service stores biometric embeddings separately in the same MongoDB cluster.

---

## Project Structure

```
palmpay-wallet/
│
├── package.json                  # Root scripts — runs all three services with concurrently
│
├── frontend/                     # React application (Vite)
│   ├── .env.example
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx              # Application entry point, Clerk provider
│       ├── app/                  # Router definition
│       ├── pages/                # Route-level components
│       │   ├── Dashboard.jsx
│       │   ├── Send.jsx
│       │   ├── Receive.jsx
│       │   ├── Wallet.jsx
│       │   ├── Transactions.jsx
│       │   ├── Analytics.jsx
│       │   ├── Notifications.jsx
│       │   ├── Security.jsx
│       │   ├── Settings.jsx
│       │   ├── AddCard.jsx
│       │   ├── AddMoney.jsx
│       │   ├── Login.jsx
│       │   └── SignUp.jsx
│       ├── components/           # Shared UI components
│       ├── features/             # Feature-specific logic
│       ├── api/                  # Axios API client wrappers
│       ├── store/                # Zustand global state
│       ├── realtime/             # Socket.IO client setup
│       ├── layouts/              # Page layout wrappers
│       └── constants/            # Application-wide constants
│
├── backend/                      # Node.js API server
│   ├── .env.example
│   ├── index.js                  # Server entry point
│   ├── middleware/
│   │   ├── authMiddleware.js     # Clerk JWT verification
│   │   └── upload.js             # Multer file upload config (size validation)
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── utils/
│   │   └── validators.js         # Strict input validation and sanitization
│   └── realtime/
│       ├── socketServer.js       # Socket.IO server initialization
│       ├── socketAuth.js         # Socket authentication middleware (Clerk)
│       ├── socketRooms.js        # Personal rooms per clerkId
│       ├── eventNames.js         # Shared event name constants
│       ├── io.js                 # Shared io instance
│       ├── emitters/             # Per-feature event emit helpers
│       └── utils/
│
└── backend/palm_auth/            # Python biometric microservice
    ├── main.py                   # FastAPI application
    ├── requirements.txt
    ├── palm_config.json          # Model inference configuration
    ├── palm_embedder_scripted.pt # TorchScript embedding model
    └── best_palm_model.pt        # Trained palm classification model
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| UI / Styling | Tailwind CSS v4, Shadcn/ui, Framer Motion |
| State management | Zustand |
| Server-state / caching | TanStack Query v5 |
| Authentication | Clerk |

| Real-time communication | Socket.IO 4 |
| API client | Axios |
| QR code | html5-qrcode, qrcode.react |
| Charts | Recharts |
| PDF export | jsPDF + jspdf-autotable |
| Node.js runtime | Express 5 |
| Database | MongoDB Atlas (Mongoose 9) |
| Auth middleware | @clerk/clerk-sdk-node |
| File uploads | Multer 1.4 (with memory storage) |
| Biometric service | FastAPI + Uvicorn |
| ML inference | PyTorch (TorchScript) |
| Image processing | Pillow, torchvision |
| Package manager | pnpm 10 |

---

## Prerequisites

- **Node.js** v18 or later
- **pnpm** v10 — `npm install -g pnpm`
- **Python** 3.10 or later
- **MongoDB Atlas** account with a cluster and database user
- **Clerk** account with an application configured
- **Stripe** account with test mode enabled

---

## Environment Variables

Each service has its own `.env` file. Example files are provided. Copy each one and fill in the real values.

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on. Default: `5000` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PALM_AUTH_URL` | Base URL of the Palm Auth microservice. Default: `http://localhost:8000` |
| `CLERK_SECRET_KEY` | Clerk secret key — used to verify session tokens server-side |

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key — loaded in the browser |

> **Note:** Never place secret keys in frontend environment variables. Only publishable keys that are safe to expose belong in the frontend `.env`.

---

## Installation

### 1. Install root dependencies

```bash
pnpm install
```

### 2. Install backend dependencies

```bash
cd backend
pnpm install
cd ..
```

### 3. Install frontend dependencies

```bash
cd frontend
pnpm install
cd ..
```

### 4. Set up the Python virtual environment

```bash
cd backend/palm_auth
python -m venv venv
```

Activate the virtual environment:

- **Windows:** `venv\Scripts\activate`
- **macOS / Linux:** `source venv/bin/activate`

Install Python dependencies:

```bash
pip install -r requirements.txt
```

```bash
cd ../..
```

---

## Running the Application

### All services at once (recommended)

From the project root, run all three services concurrently:

```bash
pnpm run dev
```

This executes the following three commands in parallel:

| Service | Command | URL |
|---|---|---|
| Frontend | `pnpm run dev --host` (in `frontend/`) | http://localhost:5173 |
| Node.js backend | `pnpm run dev` (in `backend/`) | http://localhost:5000 |
| Palm Auth service | `python main.py` (in `backend/palm_auth/`) | http://localhost:8000 |

### Running services individually

**Frontend:**
```bash
cd frontend
pnpm run dev --host
```

**Node.js backend:**
```bash
cd backend
pnpm run dev
```

**Palm Auth microservice** (activate the virtual environment first):
```bash
cd backend/palm_auth
venv\Scripts\activate        # Windows
python main.py
```

---

## Service Details

### Frontend

The frontend is a single-page application built with React and Vite. It uses React Router v7 for client-side routing and Clerk for authentication UI components.

**Key features:**

- **Palm ID Handle**: Integrated unique username system allowing users to identify each other via `@handle`.
- **Match-Only Recipient Search**: A refined search experience that only displays recipient cards when a specific match for Name, Handle, or Phone is found.
- **Stunning Real-Time UI**: High-fidelity dashboard with glassmorphism, swipeable asset carousels, and instant balance/notification updates via Sockets.
- **Interactive Security**: Integrated palm enrollment workflow with real-time feedback and status checks.

### Node.js Backend

The backend is an Express 5 server with Socket.IO attached to the same HTTP server instance. It connects to MongoDB Atlas using Mongoose and uses a transactional approach for all fund transfers.

**Security Hardening:**

- **Defensive Validation**: All inputs are sanitized and validated via `backend/utils/validators.js`.
- **Self-Transfer Guard**: Prevents users from sending funds to their own account.
- **Ownership Enforcement**: Clerk JWT `sub` is verified against requested `clerkId` on all sensitive operations.
- **Transactional Integrity**: Mongoose sessions ensure that multi-step operations (e.g., deducting from sender, adding to receiver, credit journaling) are atomic.

### Palm Auth Service

The Palm Auth service is a FastAPI application that handles biometric enrollment and verification using a TorchScript model (`palm_embedder_scripted.pt`).

**Inference configuration** (`palm_config.json`):

- **Threshold**: `0.82` (minimum cosine similarity for verification)
- **Embed Dim**: `128` (output dimension)
- **Img Size**: `128x128` (input resolution)

Verification returns `accepted: true` only if the probe image's similarity to the enrolled embedding exceeds the threshold.

---

## API Reference

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/users/sync` | No | Create/Update user from Clerk data |
| GET | `/api/users/:clerkId` | No | Retrieve user profile (includes Palm ID, balance, banks) |
| POST | `/api/users/update` | Yes | Update profile details (Name, Phone, Palm ID) |

### Palm Biometrics — `/api/palm`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/palm/enroll` | Yes | Upload palm image and store embedding |
| POST | `/api/palm/verify` | Yes | Verify palm image against stored embedding |
| DELETE | `/api/palm/unenroll` | Yes | Remove all biometric data |

### Transactions — `/api/transactions`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/transactions` | Yes | Create a new P2P transfer (requires palm scan) |
| GET | `/api/transactions` | Yes | List transaction history |
| GET | `/api/transactions/categories` | Yes | List unique transaction categories used |

### Wallet — `/api/wallet`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/wallet` | Yes | Get wallet balance and linked assets |
| POST | `/api/wallet/add-money` | Yes | Fund wallet from linked bank (requires palm scan) |
| POST | `/api/wallet/bank-accounts` | Yes | Link a new bank account |

---

## Database Models

### User

| Field | Type | Description |
|---|---|---|
| `clerkId` | String | Primary identifier from Clerk (Unique) |
| `username` | String | Unique Palm ID (@handle) |
| `name` | String | User's full name |
| `phone` | String | Verified phone number |
| `palmEnrolled`| Boolean | Biometric enrollment status |
| `kycStatus` | String | `pending`, `verified`, `rejected` |

### Wallet

| Field | Type | Description |
|---|---|---|
| `userId` | String | Reference to User `clerkId` |
| `balance` | Number | Current balance (default 25,000 for new users) |

### Transaction

| Field | Type | Description |
|---|---|---|
| `userId` | String | Owner of the transaction record |
| `sender` | String | Name of the sender |
| `recipient` | String | Name of the recipient |
| `amount` | Number | Amount (Negative for debits) |
| `type` | String | `transfer`, `deposit`, `credit` |
| `category` | String | Transaction category |

---

## Real-Time Events

| Event name | Payload | Description |
|---|---|---|
| `emitNotificationNew` | Notification object | New notification created (Real-time toast/feed) |
| `emitBalanceUpdate` | `{ balance }` | Wallet balance changed |
| `emitTransactionNew` | Transaction object | New transaction recorded |
| `emitUnreadCountUpdated`| `{ unreadCount }` | Updated badge count for notifications |

---

## Authentication Flow

1. **Sign-In**: User authenticates via Clerk UI in the React app.
2. **Session**: Clerk issues a JWT session token stored client-side.
3. **Authorization**: React app sends the token as a `Bearer` header on all API calls.
4. **Verification**: Backend `requireAuth` middleware validates the JWT via Clerk SDK.
5. **WebSocket Auth**: Handshake `auth` contains the token, validated by `socketAuthMiddleware`.
6. **Palm Verification**: For critical actions (transfers, additions), the user must provide a palm scan. The backend forwards the image to the Palm Auth service and proceeds only if `accepted: true`.
